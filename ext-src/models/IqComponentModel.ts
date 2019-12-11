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
import { Uri, window, WorkspaceConfiguration, ProgressLocation } from "vscode";

import { ComponentContainer } from "../packages/ComponentContainer";
import { RequestService } from "../services/RequestService";
import { IqRequestService } from "../services/IqRequestService";
import { ComponentModel } from "./ComponentModel";
import { ComponentEntry } from "./ComponentEntry";
import { PolicyViolation } from "../types/PolicyViolation";

export class IqComponentModel implements ComponentModel {
    components = new Array<ComponentEntry>();
    coordsToComponent: Map<string, ComponentEntry> = new Map<
      string,
      ComponentEntry
    >();
    requestService: RequestService;
    dataSourceType: string;
    applicationPublicId: string;
  
    constructor(
      configuration: WorkspaceConfiguration
    ) {
      
      this.dataSourceType = configuration.get("nexusExplorer.dataSource", "ossindex");
      let url = configuration.get("nexusiq.url") + "";
      let username = configuration.get("nexusiq.username") + "";
      let maximumEvaluationPollAttempts = parseInt(
        configuration.get("nexusiq.maximumEvaluationPollAttempts") + "", 10);
      this.applicationPublicId = configuration.get("nexusiq.applicationPublicId") + "";
      let password = configuration.get("nexusiq.password") + "";
      this.requestService = new IqRequestService(url, username, password, maximumEvaluationPollAttempts);
    }
  
    public getContent(resource: Uri): Thenable<string> {
      return new Promise((c, e) => "my stubbed content entry");
    }
  
    public async evaluateComponents(): Promise<any> {
      console.debug("evaluateComponents");
      return await this.performIqScan();
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
              let data: any;
              if (componentContainer.PackageMuncher != undefined) {
                progress.report({message: "Starting to package your dependencies for IQ Server", increment: 5});
                await componentContainer.PackageMuncher.packageForIq();

                progress.report({message: "Reticulating splines...", increment: 25});
                data = await componentContainer.PackageMuncher.convertToNexusFormat();
                this.components = componentContainer.PackageMuncher.toComponentEntries(data);
                this.coordsToComponent = componentContainer.PackageMuncher.CoordinatesToComponents;
                progress.report({message: "Packaging ready", increment: 35});
              } else {
                throw new TypeError("Unable to instantiate Package Muncher");
              }
      
              if (undefined == data) {
                throw new RangeError("Attempted to generated dependency list but received an empty collection. NexusIQ will not be invoked for this project.");
              }
        
              console.debug("getting applicationInternalId", this.applicationPublicId);
              progress.report({message: "Getting IQ Server Internal Application ID", increment: 40});
              let response: string = await this.requestService.getApplicationId(this.applicationPublicId) as string;
        
              let appRep = JSON.parse(response);
              console.debug("appRep", appRep);
        
              this.requestService.setApplicationId(appRep.applications[0].id)
              console.debug("applicationInternalId", this.requestService.getApplicationInternalId());

              progress.report({message: "Submitting to IQ Server for evaluation", increment: 50});
              let resultId = await this.requestService.submitToIqForEvaluation(data, this.requestService.getApplicationInternalId());
        
              console.debug("report", resultId);
              progress.report({message: "Polling IQ Server for report results", increment: 60});
              let resultDataString = await this.requestService.asyncPollForEvaluationResults(this.requestService.getApplicationInternalId(), resultId);
              progress.report({message: "Report retrieved, parsing", increment: 80});
              let resultData = JSON.parse(resultDataString as string);
        
              console.debug(`Received results from IQ scan:`, resultData);

              progress.report({message: "Morphing results into something usable", increment: 90});
              for (let resultEntry of resultData.results) {
                let componentEntry: ComponentEntry | undefined;
      
                componentEntry = this.coordsToComponent.get(
                  componentContainer.PackageMuncher.ConvertToComponentEntry(resultEntry)
                );
              
                componentEntry!.policyViolations = resultEntry.policyData.policyViolations as Array<PolicyViolation>;
                componentEntry!.hash = resultEntry.component.hash;
                componentEntry!.nexusIQData = resultEntry;
              }
              resolve("x");
            })
        } catch (e) {
          window.showErrorMessage("Nexus IQ extension: " + e);
          reject(e);
          return;
        }
      });
  }
}
