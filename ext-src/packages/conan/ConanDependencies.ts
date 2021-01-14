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

import { ConanPackage } from "./ConanPackage";
import { PackageDependencies } from "../PackageDependencies";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { ComponentEntry } from "../../models/ComponentEntry";
import { ScanType } from "../../types/ScanType";
import { PackageDependenciesOptions } from "../PackageDependenciesOptions";
import { ConanUtils } from "./ConanUtils";

/**
* @class ConanDependencies
*/
export class ConanDependencies implements PackageDependencies {
  private theseAreTheLockFilesIKnow: Array<string> = ["composer.lock", "Cargo.lock", "Gemfile.lock", "yarn.lock", "renv.lock"];

  constructor(private options: PackageDependenciesOptions) {}

  public checkIfValid(): boolean {
    return PackageDependenciesHelper.checkIfValidWithExclusion(
      ".lock", 
      "conan", 
      this.theseAreTheLockFilesIKnow
    );
  }

  public toComponentEntries(packages: Array<ConanPackage>): Map<string, ComponentEntry> {
    let map = new Map<string, ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Name,
        pkg.Version,
        "conan",
        ScanType.NexusIq
      );
      
      map.set(
        pkg.toPurl(),
        componentEntry
      );
    }
    return map;
  }

  public async packageForService(): Promise<Array<ConanPackage>> {
    try {
      const conanUtils = new ConanUtils(this.theseAreTheLockFilesIKnow);

      const deps = await conanUtils.getDependencyArray();

      return Promise.resolve(deps);
    } catch (ex) {
      return Promise.reject(
        `Uh oh spaghetti-o, something went wrong!: ${ex}`
      );
    }
  }
}
