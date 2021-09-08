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
import { PackageURL } from 'packageurl-js';
import { ProgressLocation, window, workspace } from "vscode";
import { LiteComponentContainer } from '../packages/LiteComponentContainer';
import { PackageDependenciesHelper } from '../packages/PackageDependenciesHelper';
import { LiteRequestService } from "../services/LiteRequestService";
import { OssIndexRequestService } from "../services/OssIndexRequestService";
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
  private applications = new Array<Application>();

  private dummyApplication = new Application('ALL', 'TBC', PackageDependenciesHelper.getWorkspaceRoot())

  constructor(
    options: ComponentModelOptions
  ) {
    const username = (process.env.OSSI_USERNAME ? process.env.OSSI_USERNAME : options.configuration.get(OSS_INDEX_USERNAME) as string);
    const password = (process.env.OSSI_TOKEN ? process.env.OSSI_TOKEN : options.configuration.get(OSS_INDEX_TOKEN) as string);
    this.logger = options.logger;
    this.requestService = new OssIndexRequestService(username, password, options.logger);

    // Detect all folders in Workspace and assume each is a separate Application
    let workspaceRoot = workspace.workspaceFolders
    if (workspaceRoot === undefined) {
      this.logger.log(LogLevel.WARN, 'The workspace does not contain any folders.');
      throw new TypeError("No workspaces opened");
    }

    workspaceRoot.forEach((workspaceFolder) => {
      let baseFolderName = workspaceFolder.uri.fsPath.substr(workspaceFolder.uri.fsPath.lastIndexOf('/') + 1);
      this.applications.push(new Application(baseFolderName, baseFolderName, workspaceFolder.uri.fsPath));
      this.logger.log(LogLevel.INFO, `Added Workspace Folder ${workspaceFolder.uri.fsPath} as Application '${baseFolderName}'`);
    })
  }

  public evaluateComponents(): Promise<any> {
    console.debug("evaluateComponents");
    return this.performOssIndexScan();
  }

  private async performOssIndexScan(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        let componentContainer = new LiteComponentContainer(this.logger, this.applications);
        window.withProgress(
          {
            location: ProgressLocation.Notification,
            title: "Running OSS Index Scan"
          }, async (progress, token) => {
            if (componentContainer.Valid.length > 0) {
              let purls: string[] = [];
              progress.report({ message: "Starting to package your dependencies", increment: 10 });
              const regex: RegExp = /^(.*):(.*)@(.*)$/;
              for (let pm of componentContainer.Valid) {
                try {

                  this.logger.log(LogLevel.DEBUG, `Packaging Dependencies for ${pm.constructor.name}`);
                  const packages = await pm.packageForService();

                  progress.report({ message: "Reticulating splines...", increment: 30 });

                  purls.push(...packages.map((x) => {
                    let matches = regex.exec(x.toPurl());
                    if (matches && matches.length === 4) {
                      return `${matches[1]}:${matches![2]}@${matches![3].replace("v", "")}`;
                    }
                    return "";
                  }));
                } catch (ex) {
                  window.showErrorMessage(`Nexus OSS Index extension failure, moving forward, exception: ${ex}`);
                }
              }
              this.logger.log(LogLevel.TRACE, `Full list of purls in hand, off to OSS Index we go`, purls);
              progress.report({ message: "Talking to OSS Index", increment: 50 });
              let results = await this.requestService.getResultsFromPurls(purls) as Array<any>;
              this.logger.log(LogLevel.TRACE, `Obtained results from OSS Index`, results);

              progress.report({ message: "Morphing OSS Index results into something usable", increment: 75 });
              this.components = results.map(x => {
                let purl: PackageURL = PackageURL.fromString(x.coordinates);
                let name = (purl.namespace) ? purl.namespace + " : " + purl.name : purl.name;
                let format = purl.type;
                let version = purl.version;
                let componentEntry = new ComponentEntry(name, version!, format, ScanType.OssIndex, this.dummyApplication);
                componentEntry.ossIndexData = x;
                return componentEntry;
              });
              progress.report({ message: "Done!", increment: 100 });

              resolve(this.components);
            } else {
              this.logger.log(LogLevel.ERROR, `No valid Package Munchers to work with!`);
              reject("Unable to instantiate Package Muncher");
            }
          }).then(() => {
            window.setStatusBarMessage("Sonatype OSS Index results returned, now go build with confidence!", 5000);
          },
            (failure) => {
              this.logger.log(LogLevel.ERROR, `Uh oh`, failure);
              window.showErrorMessage(`Nexus IQ OSS Index extension failure: ${failure}`)
            });
      } catch (e) {
        this.logger.log(LogLevel.ERROR, `Uh oh`, e);
        reject(e);
        return;
      }
    });
  }
}
