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
import { window, WorkspaceConfiguration, ProgressLocation } from "vscode";
import * as _ from "lodash";

import { LiteComponentContainer } from '../packages/LiteComponentContainer';
import { LiteRequestService } from "../services/LiteRequestService";
import { OssIndexRequestService } from "../services/OssIndexRequestService";
import { ComponentModel } from "./ComponentModel";
import { ScanType } from "../types/ScanType";
import { ComponentEntry } from "./ComponentEntry";
import { PackageType } from "../packages/PackageType";
import { SupplementalInfo } from "../types/SupplementalInfo";

export class OssIndexComponentModel implements ComponentModel {
  components = new Array<ComponentEntry>();
  componentContainer: LiteComponentContainer;
  requestService: LiteRequestService;
  dataSourceType: string = "ossindex";
  
  constructor(
    configuration: WorkspaceConfiguration
  ) {
    let username = configuration.get("ossindex.username") + "";
    let password = configuration.get("ossindex.password") + "";
    this.requestService = new OssIndexRequestService(username, password);
    this.componentContainer = new LiteComponentContainer();
  }
  
  public evaluateComponents(): Promise<any> {
    console.debug("evaluateComponents");
    return this.performOssIndexScan();
  }
  
  private async performOssIndexScan(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        window.withProgress(
          {
            location: ProgressLocation.Notification, 
            title: "Running OSS Index Scan"
          }, async (progress, token) => {
          if (this.componentContainer.PackageMuncher != undefined) {
            progress.report({message: "Starting to package your dependencies", increment: 10});
            await this.componentContainer.PackageMuncher.packageForService();
  
            progress.report({message: "Reticulating splines...", increment: 30});

            let purls = _.map(this.componentContainer.PackageMuncher.dependencies, (x => x.toPurl()));
            
            progress.report({message: "Talking to OSS Index", increment: 50});
            let results = await this.requestService.getResultsFromPurls(purls) as Array<any>;
            console.log("Result array from OSS Index", results);
  
            progress.report({message: "Morphing OSS Index results into something usable", increment: 75});
            this.components = results.map(x => {
              let coordinates = x.coordinates as string;
              let name = this.parsePackageName(coordinates);
              let version = coordinates.substring(coordinates.indexOf("@") + 1, coordinates.length);
              let componentEntry = new ComponentEntry(name, version, ScanType.OssIndex);
              componentEntry.ossIndexData = x;
              return componentEntry;
            })
            progress.report({message: "Done!", increment: 100});

            resolve(this.components);
          } else {
            reject("Unable to instantiate Package Muncher");
          }
        }).then(() => {
          window.setStatusBarMessage("Sonatype OSS Index results returned, now go build with confidence!", 5000);
        },
        (failure) => {
          window.showErrorMessage(`Nexus IQ OSS Index extension failure: ${failure}`)
        });
      } catch (e) {
        reject(e);
        return;
      }
    });
  }

  public async getSupplementalInfo(pkg: any): Promise<SupplementalInfo> {
    if (this.componentContainer.PackageMuncher != undefined) {
      return await this.componentContainer.PackageMuncher.getSupplementalInfo(pkg);
    }
    throw new Error("Package Muncher undefined");
  }

  private parsePackageName(pkg: string): string {
    return pkg.substring(pkg.indexOf("/") + 1, pkg.indexOf("@"));
  }
}
