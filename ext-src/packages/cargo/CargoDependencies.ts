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
import { CargoPackage } from "./CargoPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../models/ComponentEntry";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { ScanType } from "../../types/ScanType";
import { CargoUtils } from "./CargoUtils";

/**
* @class CargoDependencies
*/
export class CargoDependencies extends PackageDependenciesHelper implements PackageDependencies {

  public checkIfValid(): boolean {
    return PackageDependenciesHelper.checkIfValid("Cargo.lock", "cargo");
  }

  public toComponentEntries(packages: Array<CargoPackage>): Map<string, ComponentEntry> {
    let map = new Map<string, ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Name,
        pkg.Version,
        "cargo",
        ScanType.NexusIq
      );
      map.set(
        pkg.toPurl(),
        componentEntry
      );
    }
    return map;
  }

  public async packageForIq(): Promise<Array<CargoPackage>> {
    try {
      const composerUtils = new CargoUtils();
      const deps = await composerUtils.getDependencyArray();

      return Promise.resolve(deps);
    } catch (ex) {
      return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while parsing your Cargo.lock file: ${ex}`);
    }
  }
}
