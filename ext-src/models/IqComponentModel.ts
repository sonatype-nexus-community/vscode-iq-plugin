/*
 * Copyright (c) 2019-present Sonatype, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Uri, window, ProgressLocation } from "vscode";

import { ComponentContainer } from "../packages/ComponentContainer";
import { RequestService } from "../services/RequestService";
import { IqRequestService } from "../services/IqRequestService";
import { ComponentModel } from "./ComponentModel";
import { ComponentEntry } from "./ComponentEntry";
import { PolicyViolation } from "../types/PolicyViolation";
import { ComponentRequest } from "../types/ComponentRequest";
import { IQResponse } from "../types/IQResponse";
import { ComponentEntryConversions } from '../utils/ComponentEntryConversions';
import { ComponentModelOptions } from "./ComponentModelOptions";
import { Logger, LogLevel } from "../utils/Logger";

export class IqComponentModel implements ComponentModel {
    components = new Array<ComponentEntry>();
    coordsToComponent: Map<string, ComponentEntry> = new Map<
      string,
      ComponentEntry
    >();
    requestService: RequestService;
    dataSourceType: string;
    applicationPublicId: string;
    logger: Logger;
  
    constructor(
      options: ComponentModelOptions
    ) {
      
      this.dataSourceType = options.configuration.get("nexusExplorer.dataSource", "ossindex");
      let url = options.configuration.get("nexusiq.url") + "";
      let username = options.configuration.get("nexusiq.username") + "";
      let maximumEvaluationPollAttempts = parseInt(
        options.configuration.get("nexusiq.maximumEvaluationPollAttempts") + "", 10);
      this.applicationPublicId = options.configuration.get("nexusiq.applicationPublicId") + "";
      let password = options.configuration.get("nexusiq.password") + "";
      let strictSSL = options.configuration.get("nexusiq.strictSSL") as boolean;
      this.requestService = new IqRequestService(url, username, password, maximumEvaluationPollAttempts, strictSSL);
      this.logger = options.logger;
    }
  
    public getContent(resource: Uri): Thenable<string> {
      return new Promise((c, e) => "my stubbed content entry");
    }
  
    public evaluateComponents(): Promise<any> {
      this.logger.log(LogLevel.DEBUG, "Starting IQ Evaluation of Components");
      return this.performIqScan();
    }
  
    private async performIqScan(): Promise<any> {
      return new Promise((resolve, reject) => {
        try {
          let componentContainer = new ComponentContainer(this.requestService);

          window.withProgress(
            {
              location: ProgressLocation.Notification, 
              title: "Running Nexus IQ Server Scan"
            }, async (progress, token) => {
              let data: ComponentRequest = new ComponentRequest([]);
              if (componentContainer.Valid.length > 0) {
                progress.report({message: "Starting to package your dependencies for IQ Server", increment: 5});
                for (let pm of componentContainer.Valid) {
                  try {
                    await pm.packageForIq();
                    progress.report({message: "Reticulating Splines", increment: 25});
                    let result: ComponentRequest = await pm.convertToNexusFormat();
                    this.logger.log(LogLevel.TRACE, `Component Request for ${pm.constructor.name} obtained: ${JSON.stringify(result)}`);

                    data.components.push(...result.components);
                    this.components.push(...pm.toComponentEntries(result));
                    this.coordsToComponent = new Map([...this.coordsToComponent, ...pm.CoordinatesToComponents]);
                  } catch (ex) {
                    this.logger.log(LogLevel.ERROR, `Nexus IQ Extension Failure moving forward: ${ex}`);
                    window.showErrorMessage(`Nexus IQ extension failure, moving forward, exception: ${ex}`);
                  }
                }
                progress.report({message: "Packaging ready", increment: 35});
              } else {
                throw new TypeError("Unable to instantiate Package Muncher");
              }
      
              if (undefined == data) {
                throw new RangeError("Attempted to generate dependency list but received an empty collection. NexusIQ will not be invoked for this project.");
              }
        
              this.logger.log(LogLevel.DEBUG, `Getting Internal ID from Public ID: ${this.applicationPublicId}`);
              progress.report({message: "Getting IQ Server Internal Application ID", increment: 40});
              
              let response: string = await this.requestService.getApplicationId(this.applicationPublicId);
              this.logger.log(LogLevel.TRACE, `Obtained app response: ${response}`);
              
              let appRep = JSON.parse(response);
        
              this.requestService.setApplicationId(appRep.applications[0].id);
              this.logger.log(
                LogLevel.DEBUG, 
                `Set application internal ID: ${this.requestService.getApplicationInternalId()}`
                );

              progress.report({message: "Submitting to IQ Server for evaluation", increment: 50});
              let resultId = await this.requestService.submitToIqForEvaluation(data, this.requestService.getApplicationInternalId());
        
              this.logger.log(LogLevel.DEBUG, `Report id obtained: ${resultId}`);
              progress.report({message: "Polling IQ Server for report results", increment: 60});
              let resultDataString = await this.requestService.asyncPollForEvaluationResults(this.requestService.getApplicationInternalId(), resultId);
              progress.report({message: "Report retrieved, parsing", increment: 80});
              let resultData: IQResponse = JSON.parse(resultDataString);
        
              this.logger.log(LogLevel.TRACE, `Recieved results from IQ Scan: ${JSON.stringify(resultData)}`);

              progress.report({message: "Morphing results into something usable", increment: 90});
              for (let resultEntry of resultData.results) {
                let format: string = resultEntry.component.componentIdentifier.format as string;
                
                let componentEntry = this.coordsToComponent.get(
                  ComponentEntryConversions.ConvertToComponentEntry(format, resultEntry)
                );
                if (componentEntry != undefined) {
                  componentEntry!.policyViolations = resultEntry.policyData.policyViolations as Array<PolicyViolation>;
                  componentEntry!.hash = resultEntry.component.hash;
                  componentEntry!.nexusIQData = resultEntry;
                }
              }

              resolve();
            }).then(() => {
              window.setStatusBarMessage("Nexus IQ Server Results in, build with confidence!", 5000);
            }, 
            (failure) => {
              this.logger.log(LogLevel.ERROR, `Nexus IQ extension failure: ${failure}`);
              window.showErrorMessage(`Nexus IQ extension failure: ${failure}`);
            });
        } catch (e) {
          this.logger.log(LogLevel.ERROR, `Uh ohhhh: ${e}`);
          reject(e);
        }
      });
  }
}
