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
import { window, WorkspaceConfiguration } from "vscode";
import * as _ from "lodash";

import { LiteComponentContainer } from './packages/LiteComponentContainer';
import { LiteRequestService } from "./LiteRequestService";
import { OssIndexRequestService } from "./OssIndexRequestService";
import { ComponentModel } from "./ComponentModel";
import { ScanType } from "./ScanType";
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
  
    public async evaluateComponents() {
      console.debug("evaluateComponents");
      await this.performOssIndexScan();
    }
  
    private async performOssIndexScan() {
      try {
        let componentContainer = new LiteComponentContainer();

        if (componentContainer.PackageMuncher != undefined) {
          await componentContainer.PackageMuncher.packageForService();

          let purls = _.map(componentContainer.PackageMuncher.dependencies, (x => x.toPurl()));
          let results = await this.requestService.getResultsFromPurls(purls) as Array<any>;
          console.log("Result array from OSS Index", results);

          this.components = results.map(x => {
            let coordinates = x.coordinates as string;
            let name = this.parsePackageName(coordinates);
            let version = coordinates.substring(coordinates.indexOf("@") + 1, coordinates.length);
            let componentEntry = new ComponentEntry(name, version, ScanType.OssIndex);
            componentEntry.ossIndexData = x;
            return componentEntry;
          })
        } else {
          throw new TypeError("Unable to instantiate Package Muncher");
        }
      } catch (e) {
        window.showErrorMessage("Nexus IQ extension: " + e);
        return;
      }
  }

  private parsePackageName(pkg: string): string {
    return pkg.substring(pkg.indexOf("/") + 1, pkg.indexOf("@"));
  }
}
