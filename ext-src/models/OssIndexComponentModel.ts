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
import { LiteComponentContainer } from '../packages/LiteComponentContainer';
import { PackageType } from '../packages/PackageType';
import { LiteRequestService } from "../services/LiteRequestService";
import { OssIndexRequestService } from '../services/OssIndexRequestService';
import { OssIndexResponse } from "../services/ReportResponse";
import { ScanType } from "../types/ScanType";
import { OSS_INDEX_TOKEN, OSS_INDEX_USERNAME } from "../utils/Config";
import { ILogger, LogLevel } from "../utils/Logger";
import { Application } from "./Application";
import { ComponentEntry } from "./ComponentEntry";
import { ComponentModel } from "./ComponentModel";
import { ComponentModelOptions } from "./ComponentModelOptions";


export class OssIndexComponentModel implements ComponentModel {
  components = new Array<ComponentEntry>();
  requestService: LiteRequestService;
  dataSourceType: string = "ossindex";
  logger: ILogger;

  /**
   * Array of Applications derived from workspace folders.
   * 
   * Each folders currently implies a single distinct Application.
   * 
   * @var Array<Application>
   */
  applications = new Array<Application>();

  constructor(
    private options: ComponentModelOptions
  ) {
    const username = (process.env.OSSI_USERNAME ? process.env.OSSI_USERNAME : options.configuration.get(OSS_INDEX_USERNAME) as string);
    const password = (process.env.OSSI_TOKEN ? process.env.OSSI_TOKEN : options.configuration.get(OSS_INDEX_TOKEN) as string);
    this.logger = options.logger;

    this.evaluateWorkspaceFolders();

    this.requestService = new OssIndexRequestService(
      username, password, this.logger
    )
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

  public evaluateComponents(): Promise<any> {
    console.debug("evaluateComponents");
    return this.performOssIndexScan();
  }

  private async performOssIndexScan(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Clear state so that we don't create duplicates
        this.components = [];

        // Iterate each Applicaction, gather data and analyse with OSS Index
        this.applications.forEach((application) => {
          application.coordsToComponent.clear();
          let componentContainer = new LiteComponentContainer(this.logger, [application]);

          window.withProgress(
            {
              location: ProgressLocation.Notification,
              title: "Running OSS Index Scan"
            }, async (progress, token) => {
              const dependencies: Array<PackageType> = new Array();
              const purls: Array<string> = new Array();

              if (componentContainer.Valid && componentContainer.Valid.length > 0) {
                progress.report({ message: "Starting to package your dependencies for OSS Index", increment: 10 });
                const regex: RegExp = /^(.*):(.*)@(.*)$/;
                for (let pm of componentContainer.Valid) {
                  try {
                    this.logger.log(LogLevel.INFO, `Starting to Munch on ${pm.constructor.name} dependencies`);
                    const deps = await pm.packageForService();
                    this.logger.log(LogLevel.TRACE, `Obtained ${deps.length} Dependencies from Muncher ${pm.constructor.name}`, deps);
                    dependencies.push(...deps);
                    progress.report({ message: "Reticulating Splines", increment: 25 });

                    this.logger.log(LogLevel.TRACE, `Total components was ${application.coordsToComponent.size}`);
                    let pmCoordsToComponent: Map<string, ComponentEntry> = new Map([...application.coordsToComponent, ...pm.toComponentEntries(deps, ScanType.OssIndex)]);
                    application.coordsToComponent = new Map([...application.coordsToComponent.entries(), ...pmCoordsToComponent.entries()]);
                    this.logger.log(LogLevel.TRACE, `Total components is now ${application.coordsToComponent.size}`);

                    progress.report({ message: "Reticulating splines...", increment: 30 });

                    purls.push(...deps.map((x) => {
                      let matches = regex.exec(x.toPurl());
                      if (matches && matches.length === 4) {
                        return `${matches[1]}:${matches![2]}@${matches![3].replace("v", "")}`;
                      }
                      return "";
                    }));
                  } catch (ex) {
                    this.logger.log(LogLevel.ERROR, `Nexus IQ Extension Failure moving forward`, ex);
                    window.showErrorMessage(`Nexus OSS Index extension failure, moving forward, exception: ${ex}`);
                  }
                }
                progress.report({ message: "Packaging ready", increment: 35 });
              } else {
                throw new TypeError("No valid formats available to scan for this project.");
              }

              this.logger.log(LogLevel.TRACE, `Full list of purls in hand, off to OSS Index we go`, purls);
              progress.report({ message: "Talking to OSS Index", increment: 50 });

              let results: OssIndexResponse = await this.requestService.getResultsFromPurls(purls);
              this.logger.log(LogLevel.TRACE, `Obtained results from OSS Index`, results);
              progress.report({ message: "Morphing OSS Index results into something usable", increment: 75 });

              for (let resultEntry of results.components) {
                if (!resultEntry.coordinates) {
                  this.logger.log(LogLevel.ERROR, `missing coordinates`, resultEntry);
                  throw new Error(`missing coordinates. see log for details`);
                }

                let componentEntry = application.coordsToComponent.get(resultEntry.coordinates);
                // console.debug(`Getting CE for ${resultEntry.coordinates} is: ${componentEntry}`)

                if (componentEntry != undefined) {
                  componentEntry!.ossIndexData = resultEntry
                }
              }

              // this.components = results.map(x => {
              //   let purl: PackageURL = PackageURL.fromString(x.coordinates);
              //   let name = (purl.namespace) ? purl.namespace + " : " + purl.name : purl.name;
              //   let format = purl.type;
              //   let version = purl.version;
              //   let componentEntry = new ComponentEntry(name, version!, format, ScanType.OssIndex, application);
              //   componentEntry.ossIndexData = x;
              //   return componentEntry;
              // });
              progress.report({ message: "Done!", increment: 100 });

              console.debug(`Components Size before push for ${application.name} is ${this.components.length}`);
              this.components.push(...Array.from(application.coordsToComponent, ([name, value]) => (value)));
              console.debug(`Components Size AFTER push for ${application.name} is ${this.components.length}`);

              resolve();
            }).then(() => {
              window.showInformationMessage(`Oss Index Results in, build with confidence!\n Report for ${application.name} available at: ${application.latestIqReportUrl}`);
              window.setStatusBarMessage(`Oss Index Results in, build with confidence!`, 5000);
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
