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
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { PyPIDependencies } from '../pypi/PyPIDependencies';
import { PyPIPackage } from '../pypi/PyPIPackage';
import { PoetryUtils } from "./PoetryUtils";

export class PoetryDependencies extends PyPIDependencies {

  public checkIfValid(): boolean {
    return PackageDependenciesHelper.doesPathExist(this.application.workspaceFolder, "poetry.lock");
  }

  public toComponentEntries(packages: Array<PyPIPackage>, scanType: ScanType): Map<string, ComponentEntry> {
    let map = new Map<string, ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Name,
        pkg.Version,
        "pypi",
        scanType,
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
    console.debug(`Grabbing Poetry dependencies from Application ${this.application.name}...`)
    try {
      const poetryUtils = new PoetryUtils();
      const deps = await poetryUtils.getDependencyArray(this.application, this.options.includeDev);
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
}
