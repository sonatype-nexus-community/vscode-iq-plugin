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
import { join } from "path";
import { ComponentEntry } from "../../models/ComponentEntry";
import { ScanType } from "../../types/ScanType";
import { PackageDependencies } from "../PackageDependencies";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { NpmPackage } from "./NpmPackage";
import { NpmUtils } from './NpmUtils';

export class NpmDependencies extends PackageDependencies {

  private lockFiles: string[] = [];

  public async packageForService(): Promise<Array<NpmPackage>> {
    try {
      const npmUtils = new NpmUtils();
      const deps = await npmUtils.getDependencyArray(this.application, this.options.includeDev);
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }

  public checkIfValid(): boolean {
    // This is a pseudo hack for the time being, it populates a lockFile list which we will use in another
    // effort with Progressive to iterate over any lock files we find
    let workspaceRoot = PackageDependenciesHelper.getWorkspaceRoot();
    if (PackageDependenciesHelper.doesPathExist(workspaceRoot, "yarn.lock")) {
      this.lockFiles.push(join(workspaceRoot, "yarn.lock"));
    }
    if (PackageDependenciesHelper.doesPathExist(workspaceRoot, "package-lock.json")) {
      this.lockFiles.push(join(workspaceRoot, "package-lock.json"));
    }

    return this.lockFiles.length > 0 ? false : true;
  }

  public toComponentEntries(packages: Array<NpmPackage>, scanType: ScanType): Map<string, ComponentEntry> {
    let map = new Map<string, ComponentEntry>();
    for (let pkg of packages) {
      const name = (pkg.Group != "") ? `${pkg.Group}/${pkg.Name}` : pkg.Name;
      let componentEntry = new ComponentEntry(
        name,
        pkg.Version,
        "npm",
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
}
