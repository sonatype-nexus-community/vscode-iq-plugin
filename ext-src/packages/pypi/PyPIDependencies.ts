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
import { ComponentEntry } from "../../models/ComponentEntry";
import { ScanType } from "../../types/ScanType";
import { PackageDependencies } from "../PackageDependencies";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { PyPIPackage } from "./PyPIPackage";
import { PyPiUtils } from "./PyPiUtils";

export class PyPIDependencies extends PackageDependencies {

  public checkIfValid(): boolean {
    return PackageDependenciesHelper.doesPathExist(this.application.workspaceFolder, "requirements.txt");
  }

  public toComponentEntries(packages: Array<PyPIPackage>): Map<string, ComponentEntry> {
    let map = new Map<string, ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Name,
        pkg.Version,
        "pypi",
        ScanType.NexusIq,
        this.application
      );
      map.set(
        pkg.toPurl(),
        componentEntry
      );
    }
    return map;
  }

  public async packageForService(): Promise<Array<PyPIPackage>> {
    console.debug(`Grabbing PyPi dependencies from Application ${this.application.name}...`)
    try {
      let pypiUtils = new PyPiUtils();
      let deps = await pypiUtils.getDependencyArray(this.application);
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
}
