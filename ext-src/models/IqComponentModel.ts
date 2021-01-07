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
import { window, ProgressLocation } from "vscode";

import { ComponentContainer } from "../packages/ComponentContainer";
import { RequestService } from "../services/RequestService";
import { IqRequestService } from "../services/IqRequestService";
import { ComponentModel } from "./ComponentModel";
import { ComponentEntry } from "./ComponentEntry";
import { ComponentEntryConversions } from '../utils/ComponentEntryConversions';
import { ComponentModelOptions } from "./ComponentModelOptions";
import { ILogger, LogLevel } from "../utils/Logger";
import { PackageType } from "../packages/PackageType";
import { CycloneDXSbomCreator } from "../cyclonedx/CycloneDXGenerator";
import { ReportResponse } from "../services/ReportResponse";

export class IqComponentModel implements ComponentModel {
    components = new Array<ComponentEntry>();
    coordsToComponent: Map<string, ComponentEntry> = new Map<
      string,
      ComponentEntry
    >();
    requestService: RequestService;
    dataSourceType: string;
    applicationPublicId: string;
    private logger: ILogger;
  
    constructor(
      options: ComponentModelOptions
    ) {
      this.dataSourceType = configuration.get("nexusExplorer.dataSource", "ossindex");
      let url = configuration.get("nexusIQ.serverUrl") + "";
      let username = configuration.get("nexusIQ.username") + "";
      let maximumEvaluationPollAttempts = parseInt(
        configuration.get("nexusIQ.maximumEvaluationPollAttempts") + "", 10);
      this.applicationPublicId = configuration.get("nexusIQ.applicationId") + "";
      let password = configuration.get("nexusIQ.userPassword") + "";
      let strictSSL = configuration.get("nexusIQ.strictSSL") as boolean;
      this.requestService = new IqRequestService(url, username, password, maximumEvaluationPollAttempts, strictSSL, options.logger);
      this.logger = options.logger;
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
              // Clear state so that we don't create duplicates
              this.components = [];
              this.coordsToComponent.clear();

              const dependencies: Array<PackageType> = new Array();
              if (componentContainer.Valid.length > 0) {
                progress.report({message: "Starting to package your dependencies for IQ Server", increment: 5});
                for (let pm of componentContainer.Valid) {
                  try {
                    this.logger.log(LogLevel.INFO, `Starting to Munch on ${pm.constructor.name} dependencies`);
                    const deps = await pm.packageForIq();
                    this.logger.log(LogLevel.TRACE, `Obtained Dependencies from Muncher`, deps);
                    dependencies.push(...deps);
                    progress.report({message: "Reticulating Splines", increment: 25});

                    this.components.push(...pm.toComponentEntries(deps));
                    this.coordsToComponent = new Map([...this.coordsToComponent, ...pm.CoordinatesToComponents]);
                  } catch (ex) {
                    this.logger.log(LogLevel.ERROR, `Nexus IQ Extension Failure moving forward`, ex);
                    window.showErrorMessage(`Nexus IQ extension failure, moving forward, exception: ${ex}`);
                  }
                }
                progress.report({message: "Packaging ready", increment: 35});
              } else {
                throw new TypeError("Unable to instantiate Package Muncher");
              }
        
              this.logger.log(LogLevel.DEBUG, `Getting Internal ID from Public ID: ${this.applicationPublicId}`);
              progress.report({message: "Getting IQ Server Internal Application ID", increment: 40});
              
              let response: string = await this.requestService.getApplicationId(this.applicationPublicId);
              this.logger.log(LogLevel.TRACE, `Obtained internal application ID response`, response);
              
              let appRep = JSON.parse(response);
        
              this.requestService.setApplicationId(appRep.applications[0].id);
              this.logger.log(
                LogLevel.DEBUG, 
                `Set application internal ID: ${this.requestService.getApplicationInternalId()}`
                );

              const sbomGenerator = new CycloneDXSbomCreator();

              let xml = await sbomGenerator.createBom(dependencies);
              this.logger.log(LogLevel.TRACE, `Obtained XML from SBOM Creator`, xml);

              progress.report({message: "Submitting to IQ Server Third Party API", increment: 50});
              let resultId = await this.requestService.submitToThirdPartyAPI(xml, this.requestService.getApplicationInternalId());
        
              this.logger.log(LogLevel.DEBUG, `Report id obtained: ${resultId}`);
              progress.report({message: "Polling IQ Server for report results", increment: 60});
              let resultData = await this.requestService.asyncPollForEvaluationResults(resultId);
              progress.report({message: "Report retrieved, parsing", increment: 80});

              this.logger.log(LogLevel.TRACE, `Received results from Third Party API IQ Scan`, resultData);
              
              let results: ReportResponse;
              if (resultData && resultData.reportHtmlUrl) {
                let parts = /[^/]*$/.exec(resultData!.reportHtmlUrl!);

                if (parts) {
                  results = await this.requestService.getReportResults(parts[0], this.applicationPublicId);
  
                  this.logger.log(LogLevel.TRACE, `Received results from Report API`, results);

                  progress.report({message: "Morphing results into something usable", increment: 90});

                  for (let resultEntry of results.components) {                   
                    let componentEntry = this.coordsToComponent.get(
                      ComponentEntryConversions.ConvertToComponentEntry(
                        resultEntry.componentIdentifier.format, 
                        resultEntry.componentIdentifier.coordinates
                        )
                    );

                    if (componentEntry != undefined) {
                      componentEntry!.policyViolations = resultEntry.violations;
                      componentEntry!.hash = resultEntry.hash;
                      componentEntry!.nexusIQData = { component: resultEntry };
                    }
                  }
                }
              }

              resolve();
            }).then(() => {
              window.setStatusBarMessage("Nexus IQ Server Results in, build with confidence!", 5000);
            }, 
            (failure) => {
              this.logger.log(LogLevel.ERROR, `Nexus IQ extension failure`, failure);
              window.showErrorMessage(`Nexus IQ extension failure: ${failure}`);
            });
        } catch (e) {
          this.logger.log(LogLevel.ERROR, `Uh ohhhh`, e);
          reject(e);
        }
      });
  }
}
