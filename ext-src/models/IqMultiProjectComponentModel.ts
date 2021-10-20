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
import { ProgressLocation, window, workspace } from "vscode";
import { CycloneDXSbomCreator } from "../cyclonedx/CycloneDXGenerator";
import { ComponentContainer } from "../packages/ComponentContainer";
import { PackageType } from "../packages/PackageType";
import { IqRequestService } from "../services/IqRequestService";
import { ReportResponse } from "../services/ReportResponse";
import { RequestService } from "../services/RequestService";
import { ScanType } from "../types/ScanType";
import {
  NEXUS_IQ_MAX_EVAL_POLL_ATTEMPTS, NEXUS_IQ_SERVER_URL,
  NEXUS_IQ_STRICT_SSL,
  NEXUS_IQ_USERNAME,
  NEXUS_IQ_USER_PASSWORD
} from "../utils/Config";
import { ILogger, LogLevel } from "../utils/Logger";
import { Application } from "./Application";
import { ComponentEntry } from "./ComponentEntry";
import { ComponentModel } from "./ComponentModel";
import { ComponentModelOptions } from "./ComponentModelOptions";

export class IqMultiProjectComponentModel implements ComponentModel {
  components = new Array<ComponentEntry>();
  requestService: RequestService;

  /**
   * Array of Applications derived from workspace folders.
   * 
   * Each folders currently implies a single distinct Application.
   * 
   * @var Array<Application>
   */
  applications = new Array<Application>();

  private logger: ILogger;
  private url: string = "";

  constructor(
    private options: ComponentModelOptions
  ) {
    // Set logger first
    this.logger = options.logger;

    this.evaluateWorkspaceFolders();

    this.url = (process.env.IQ_SERVER ? process.env.IQ_SERVER : options.configuration.get(NEXUS_IQ_SERVER_URL) as string);
    const username = (process.env.IQ_USERNAME ? process.env.IQ_USERNAME : options.configuration.get(NEXUS_IQ_USERNAME) as string);
    const token = (process.env.IQ_TOKEN ? process.env.IQ_TOKEN : options.configuration.get(NEXUS_IQ_USER_PASSWORD) as string);

    const maximumEvaluationPollAttempts = parseInt(
      String(options.configuration.get(NEXUS_IQ_MAX_EVAL_POLL_ATTEMPTS)), 10);
    const strictSSL = options.configuration.get(NEXUS_IQ_STRICT_SSL) as boolean;

    this.requestService = new IqRequestService(this.url, username, token, maximumEvaluationPollAttempts, strictSSL, options.logger);
  }

  public evaluateWorkspaceFolders() {
    // Detect all folders in Workspace and assume each is a separate Application
    let workspaceRoot = workspace.workspaceFolders
    if (workspaceRoot === undefined) {
      this.logger.log(LogLevel.WARN, 'The workspace does not contain any folders.');
      throw new TypeError("No workspaces opened");
    }

    this.applications = [];
    workspaceRoot.forEach((workspaceFolder) => {
      let baseFolderName = workspaceFolder.uri.fsPath.substr(workspaceFolder.uri.fsPath.lastIndexOf('/') + 1);
      this.applications.push(new Application(baseFolderName, workspaceFolder.uri.fsPath, this.options));
      this.logger.log(LogLevel.INFO, `Added Workspace Folder ${workspaceFolder.uri.fsPath} as Application '${baseFolderName}'`);
    })
  }

  public updateConfiguration(options: ComponentModelOptions) {
    this.options = options;
  }

  public evaluateComponents(): Promise<any> {
    this.logger.log(LogLevel.DEBUG, "Starting IQ Evaluation of Components");
    return this.performIqScan();
  }

  private async performIqScan(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Clear state so that we don't create duplicates
        this.components = [];

        // Iterate each Application, gather data and perform an IQ scan
        this.applications.forEach((application) => {
          application.coordsToComponent.clear();
          let componentContainer = new ComponentContainer(this.logger, [application]);

          window.withProgress(
            {
              location: ProgressLocation.Notification,
              title: `Running Nexus IQ Scan for ${application.name}`
            }, async (progress, token) => {
              const dependencies: Array<PackageType> = new Array();
              if (componentContainer.Valid && componentContainer.Valid.length > 0) {
                progress.report({ message: "Starting to package your dependencies for IQ Server", increment: 5 });
                for (let pm of componentContainer.Valid) {
                  try {
                    this.logger.log(LogLevel.INFO, `Starting to Munch on ${pm.constructor.name} dependencies`);
                    const deps = await pm.packageForService();
                    this.logger.log(LogLevel.TRACE, `Obtained ${deps.length} Dependencies from Muncher ${pm.constructor.name}`, deps);
                    dependencies.push(...deps);
                    progress.report({ message: "Reticulating Splines", increment: 25 });

                    this.logger.log(LogLevel.TRACE, `Total components was ${application.coordsToComponent.size}`);
                    let pmCoordsToComponent: Map<string, ComponentEntry> = new Map([...application.coordsToComponent, ...pm.toComponentEntries(deps, ScanType.NexusIq)]);
                    application.coordsToComponent = new Map([...application.coordsToComponent.entries(), ...pmCoordsToComponent.entries()]);
                    this.logger.log(LogLevel.TRACE, `Total components is now ${application.coordsToComponent.size}`);

                  } catch (ex) {
                    this.logger.log(LogLevel.ERROR, `Nexus IQ Extension Failure moving forward`, ex);
                    window.showErrorMessage(`Nexus IQ extension failure, moving forward, exception: ${ex}`);
                  }
                }
                progress.report({ message: "Packaging ready", increment: 35 });
              } else {
                throw new TypeError("No valid formats available to scan for this project.");
              }

              this.logger.log(LogLevel.DEBUG, `Getting Internal ID from Public ID: ${application.nexusIqApplicationId}`);
              progress.report({ message: "Getting IQ Server Internal Application ID", increment: 40 });

              let internalID: string = await this.requestService.getApplicationId(application.nexusIqApplicationId);
              this.logger.log(LogLevel.TRACE, `Obtained internal application ID response: ${internalID}`);

              this.requestService.setApplicationId(internalID);
              this.logger.log(
                LogLevel.DEBUG,
                `Set application internal ID: ${this.requestService.getApplicationInternalId()}`
              );

              const sbomGenerator = new CycloneDXSbomCreator();

              let xml = await sbomGenerator.createBom(dependencies);
              this.logger.log(LogLevel.TRACE, `Obtained XML from SBOM Creator`, xml);

              progress.report({ message: "Submitting to IQ Server Third Party API", increment: 50 });
              let resultId = await this.requestService.submitToThirdPartyAPI(xml, this.requestService.getApplicationInternalId());

              this.logger.log(LogLevel.DEBUG, `Report id obtained: ${resultId}`);
              progress.report({ message: "Polling IQ Server for report results", increment: 60 });
              let resultData = await this.requestService.asyncPollForEvaluationResults(resultId);
              progress.report({ message: "Report retrieved, parsing", increment: 80 });

              this.logger.log(LogLevel.TRACE, `Received results from Third Party API IQ Scan`, resultData);

              let results: ReportResponse;

              if (resultData) {
                let id: string = "";
                if (resultData.reportHtmlUrl) {
                  application.setLatestIqReportUrl(resultData.reportHtmlUrl, this.url);

                  let parts = /[^/]*$/.exec(resultData!.reportHtmlUrl!);

                  if (parts) {
                    id = parts[0];
                  }
                } else if (resultData.scanId) {
                  id = resultData.scanId;
                } else {
                  throw new RangeError("No ID to work with");
                }

                results = await this.requestService.getReportResults(id, application.nexusIqApplicationId);

                this.logger.log(LogLevel.TRACE, `Received results from Report API`, results);

                progress.report({ message: "Morphing results into something usable", increment: 90 });

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

                  let componentEntry = application.coordsToComponent.get(purl);

                  if (componentEntry != undefined) {
                    componentEntry!.policyViolations = resultEntry.violations;
                    componentEntry!.hash = resultEntry.hash;
                    componentEntry!.nexusIQData = { component: resultEntry };
                  }
                }

                console.debug(`Components Size before push for ${application.name} is ${this.components.length}`);
                this.components.push(...Array.from(application.coordsToComponent, ([name, value]) => (value)));
                console.debug(`Components Size AFTER push for ${application.name} is ${this.components.length}`);
              }

              resolve();
            }).then(() => {
              window.showInformationMessage(`Nexus IQ Server Results in, build with confidence!\n Report for ${application.name} available at: ${application.latestIqReportUrl}`);
              window.setStatusBarMessage(`Nexus IQ Server Results in, build with confidence!`, 5000);
            },
              (failure) => {
                this.logger.log(LogLevel.ERROR, `Nexus IQ extension failure`, failure);
                window.showErrorMessage(`Nexus IQ extension failure: ${failure}`);
              });
        })

      } catch (e) {
        this.logger.log(LogLevel.ERROR, `Nexus IQ Extension failure: ${e}`, e);
        reject(e);
      }
    });
  }
}
