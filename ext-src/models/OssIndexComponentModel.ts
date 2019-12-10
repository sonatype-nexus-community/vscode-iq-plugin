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

export class OssIndexComponentModel implements ComponentModel {
  components = new Array<ComponentEntry>();
  requestService: LiteRequestService;
  dataSourceType: string = "ossindex";
  
  constructor(
    configuration: WorkspaceConfiguration
  ) {
    let username = configuration.get("ossindex.username") + "";
    let password = configuration.get("ossindex.password") + "";
    this.requestService = new OssIndexRequestService(username, password);
  }
  
  public async evaluateComponents(): Promise<any> {
    console.debug("evaluateComponents");
    return await this.performOssIndexScan();
  }
  
  private async performOssIndexScan(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        let componentContainer = new LiteComponentContainer();
        window.withProgress(
          {
            location: ProgressLocation.Notification, 
            title: "Running OSS Index Scan"
          }, async (progress, token) => {
          if (componentContainer.PackageMuncher != undefined) {
            progress.report({message: "Starting to package your dependencies", increment: 10});
            await componentContainer.PackageMuncher.packageForService();
  
            progress.report({message: "Reticulating splines...", increment: 30});

            let purls = _.map(componentContainer.PackageMuncher.dependencies, (x => x.toPurl()));
            
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
        })
      } catch (e) {
        window.showErrorMessage("Nexus IQ extension: " + e);
        reject(e);
      }
    });
  }

  private parsePackageName(pkg: string): string {
    return pkg.substring(pkg.indexOf("/") + 1, pkg.indexOf("@"));
  }
}
