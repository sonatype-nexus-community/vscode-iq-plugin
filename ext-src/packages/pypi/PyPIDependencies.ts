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
import { PyPIPackage } from "./PyPIPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../models/ComponentEntry";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { PyPiUtils } from "./PyPiUtils";
import { ScanType } from "../../types/ScanType";
import { PackageDependenciesOptions } from "../PackageDependenciesOptions";

export class PyPIDependencies implements PackageDependencies {

  constructor(readonly options: PackageDependenciesOptions) {}

  public checkIfValid(): boolean {
    return PackageDependenciesHelper.doesPathExist(PackageDependenciesHelper.getWorkspaceRoot(), "requirements.txt");
  }

  public toComponentEntries(packages: Array<PyPIPackage>): Map<string, ComponentEntry> {
    let map = new Map<string, ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Name,
        pkg.Version,
        "pypi",
        ScanType.NexusIq
      );
      map.set(
        pkg.toPurl(),
        componentEntry
      );
    }
    return map;
  }

  public async packageForService(): Promise<Array<PyPIPackage>> {
    try {
      let pypiUtils = new PyPiUtils();
      let deps = await pypiUtils.getDependencyArray();
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
}
