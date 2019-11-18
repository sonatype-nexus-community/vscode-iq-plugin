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
import { window } from "vscode";
import * as _ from "lodash";

import { ComponentEntry } from "./ComponentInfoPanel";
import { LiteComponentContainer } from './packages/LiteComponentContainer';
import { LiteRequestService } from "./LiteRequestService";
import { OssIndexRequestService } from "./OssIndexRequestService";

export class OssIndexComponentModel {
    components: Array<ComponentEntry> = [];
    requestService: LiteRequestService;
  
    constructor(
    ) {
      this.requestService = new OssIndexRequestService();
    }
  
    public async evaluateComponents() {
      console.debug("evaluateComponents");
      await this.performOssIndexScan();
    }
  
    private async performOssIndexScan() {
      try {
        let componentContainer = new LiteComponentContainer();

        let data: any;

        if (componentContainer.PackageMuncher != undefined) {
          await componentContainer.PackageMuncher.packageForService();

          let purls = _.map(componentContainer.PackageMuncher.dependencies, (x => x.toPurl()));

          console.log(this.requestService.getResultsFromPurls(purls));
        } else {
          throw new TypeError("Unable to instantiate Package Muncher");
        }

        if (undefined == data) {
          throw new RangeError("Attempted to generated dependency list but received an empty collection. NexusIQ will not be invoked for this project.");
        }

      } catch (e) {
        window.showErrorMessage("Nexus Security extension: " + e);
        return;
      }
  }
}
