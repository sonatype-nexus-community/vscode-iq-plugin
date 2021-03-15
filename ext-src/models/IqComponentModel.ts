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
import { ComponentModelOptions } from "./ComponentModelOptions";
import { ILogger, LogLevel } from "../utils/Logger";
import { PackageType } from "../packages/PackageType";
import { CycloneDXSbomCreator } from "../cyclonedx/CycloneDXGenerator";
import { ReportResponse } from "../services/ReportResponse";
import { 
  NEXUS_IQ_MAX_EVAL_POLL_ATTEMPTS, 
  NEXUS_IQ_PUBLIC_APPLICATION_ID, 
  NEXUS_IQ_SERVER_URL, 
  NEXUS_IQ_STRICT_SSL, 
  NEXUS_IQ_USERNAME, 
  NEXUS_IQ_USER_PASSWORD } from "../utils/Config";

export class IqComponentModel implements ComponentModel {
    components = new Array<ComponentEntry>();
    coordsToComponent: Map<string, ComponentEntry> = new Map<
      string,
      ComponentEntry
    >();
    requestService: RequestService;
    applicationPublicId: string;
    private logger: ILogger;
    private url: string = "";
    private reportUrl: string = "";
  
    constructor(
      options: ComponentModelOptions
    ) {
      this.applicationPublicId = options.configuration.get(NEXUS_IQ_PUBLIC_APPLICATION_ID) as string;
      this.url = (process.env.IQ_SERVER ? process.env.IQ_SERVER : options.configuration.get(NEXUS_IQ_SERVER_URL) as string);
      const username = (process.env.IQ_USERNAME ? process.env.IQ_USERNAME : options.configuration.get(NEXUS_IQ_USERNAME) as string);
      const token = (process.env.IQ_TOKEN ? process.env.IQ_TOKEN : options.configuration.get(NEXUS_IQ_USER_PASSWORD) as string);
      
      const  maximumEvaluationPollAttempts = parseInt(
        String(options.configuration.get(NEXUS_IQ_MAX_EVAL_POLL_ATTEMPTS)), 10);
      const strictSSL = options.configuration.get(NEXUS_IQ_STRICT_SSL) as boolean;

      this.requestService = new IqRequestService(this.url, username, token, maximumEvaluationPollAttempts, strictSSL, options.logger);
      
      this.logger = options.logger;
    }
  
    public evaluateComponents(): Promise<any> {
      this.logger.log(LogLevel.DEBUG, "Starting IQ Evaluation of Components");
      return this.performIqScan();
    }
  
    private async performIqScan(): Promise<any> {
      return new Promise<void>((resolve, reject) => {
        try {
          let componentContainer = new ComponentContainer(this.logger);

          window.withProgress(
            {
              location: ProgressLocation.Notification, 
              title: "Running Nexus IQ Server Scan"
            }, async (progress, token) => {
              // Clear state so that we don't create duplicates
              this.components = [];
              this.coordsToComponent.clear();

              const dependencies: Array<PackageType> = new Array();
              if (componentContainer.Valid && componentContainer.Valid.length > 0) {
                progress.report({message: "Starting to package your dependencies for IQ Server", increment: 5});
                for (let pm of componentContainer.Valid) {
                  try {
                    this.logger.log(LogLevel.INFO, `Starting to Munch on ${pm.constructor.name} dependencies`);
                    const deps = await pm.packageForService();
                    this.logger.log(LogLevel.TRACE, `Obtained Dependencies from Muncher`, deps);
                    dependencies.push(...deps);
                    progress.report({message: "Reticulating Splines", increment: 25});

                    this.coordsToComponent = new Map([...this.coordsToComponent, ...pm.toComponentEntries(deps)]);
                  } catch (ex) {
                    this.logger.log(LogLevel.ERROR, `Nexus IQ Extension Failure moving forward`, ex);
                    window.showErrorMessage(`Nexus IQ extension failure, moving forward, exception: ${ex}`);
                  }
                }
                progress.report({message: "Packaging ready", increment: 35});
              } else {
                throw new TypeError("No valid formats available to scan for this project.");
              }
        
              this.logger.log(LogLevel.DEBUG, `Getting Internal ID from Public ID: ${this.applicationPublicId}`);
              progress.report({message: "Getting IQ Server Internal Application ID", increment: 40});
              
              let internalID: string = await this.requestService.getApplicationId(this.applicationPublicId);
              this.logger.log(LogLevel.TRACE, `Obtained internal application ID response`, internalID);
        
              this.requestService.setApplicationId(internalID);
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

              if (resultData) {
                let id: string = "";
                if (resultData.reportHtmlUrl) {
                  this.reportUrl = resultData.reportHtmlUrl;

                  let parts = /[^/]*$/.exec(resultData!.reportHtmlUrl!);
                  
                  if (parts) {
                    id = parts[0];
                  }
                } else if (resultData.scanId) {
                  id = resultData.scanId;
                } else {
                  throw new RangeError("No ID to work with");
                }

                results = await this.requestService.getReportResults(id, this.applicationPublicId);
  
                this.logger.log(LogLevel.TRACE, `Received results from Report API`, results);

                progress.report({message: "Morphing results into something usable", increment: 90});

                for (let resultEntry of results.components) {
                  if (!resultEntry.componentIdentifier) {
                    this.logger.log(LogLevel.ERROR, `missing componentIdentifier`, resultEntry);
                    throw new Error(`missing componentIdentifier. see log for details`);
                  }
                  let purl = resultEntry.packageUrl;
                  if (resultEntry.componentIdentifier.format == 'golang' && resultEntry.packageUrl.includes("incompatible")) {
                    purl = purl.replace("%20", "+");
                    resultEntry.packageUrl = purl;
                  }

                  let componentEntry = this.coordsToComponent.get(purl);

                  if (componentEntry != undefined) {
                    componentEntry!.policyViolations = resultEntry.violations;
                    componentEntry!.hash = resultEntry.hash;
                    componentEntry!.nexusIQData = { component: resultEntry };
                  }
                }

                this.components.push(...Array.from(this.coordsToComponent, ([name, value]) => (value)));
              }

              resolve();
            }).then(() => {
              if (!this.reportUrl.startsWith(this.url)) {
                this.reportUrl = new URL(this.reportUrl, this.url).href
              }
              
              window.showInformationMessage(`Nexus IQ Server Results in, build with confidence!\n Report available at: ${this.reportUrl}`);
              window.setStatusBarMessage(`Nexus IQ Server Results in, build with confidence!`, 5000);
            }, 
            (failure) => {
              this.logger.log(LogLevel.ERROR, `Nexus IQ extension failure`, failure);
              window.showErrorMessage(`Nexus IQ extension failure: ${failure}`);
            });
        } catch (e) {
          this.logger.log(LogLevel.ERROR, `Nexus IQ Extension failure: ${e}`, e);
          reject(e);
        }
      });
  }
}
