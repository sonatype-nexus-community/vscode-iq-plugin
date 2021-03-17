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
import { NpmPackage } from "./NpmPackage";
import { PackageDependencies } from "../PackageDependencies";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { NpmUtils } from './NpmUtils';
import { ScanType } from "../../types/ScanType";
import { ComponentEntry } from "../../models/ComponentEntry";
import { NpmScanType } from "./NpmScanType";
import { PackageDependenciesOptions } from "../PackageDependenciesOptions";

export class NpmDependencies implements PackageDependencies {

  constructor(private options: PackageDependenciesOptions) {}

  private scanType: string = "";

  public async packageForService(): Promise<Array<NpmPackage>> {
    try {
      const npmUtils = new NpmUtils();
      const deps = await npmUtils.getDependencyArray(this.options.includeDev);
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }

  public checkIfValid(): boolean {
    this.scanType = PackageDependenciesHelper.checkIfValidWithArray(NpmScanType, "npm");
    return this.scanType === "" ? false : true;
  }

  public toComponentEntries(packages: Array<NpmPackage>): Map<string, ComponentEntry> {
    let map = new Map<string, ComponentEntry>();
    for (let pkg of packages) {
      const name = (pkg.Group != "") ? `${pkg.Group}/${pkg.Name}` : pkg.Name;
      let componentEntry = new ComponentEntry(
        name,
        pkg.Version,
        "npm",
        ScanType.NexusIq
      );
      map.set(
        pkg.toPurl(),
        componentEntry
      );
    }
    return map;
  }
}
