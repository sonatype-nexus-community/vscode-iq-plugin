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

import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../models/ComponentEntry";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { PyPIDependencies } from '../pypi/PyPIDependencies';
import { ScanType } from "../../types/ScanType";
import { PoetryUtils } from "./PoetryUtils";
import { PyPIPackage } from '../pypi/PyPIPackage';

export class PoetryDependencies extends PyPIDependencies implements PackageDependencies {

  public CheckIfValid(): boolean {
    if (PackageDependenciesHelper.doesPathExist(PackageDependenciesHelper.getWorkspaceRoot(), "poetry.lock")) {
      console.debug("Valid for Poetry");
      return true;
    }
    return false;
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

  public async packageForIq(): Promise<Array<PyPIPackage>> {
    try {
      const poetryUtils = new PoetryUtils();
      const deps = await poetryUtils.getDependencyArray();
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
}
