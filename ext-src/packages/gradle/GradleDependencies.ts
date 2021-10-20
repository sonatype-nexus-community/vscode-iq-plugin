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
import { MavenPackage } from "../maven/MavenPackage";
import { PackageDependencies } from "../PackageDependencies";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { GradleUtils } from "./GradleUtils";

export class GradleDependencies extends PackageDependencies {

  public checkIfValid(): boolean {
    return PackageDependenciesHelper.checkIfValid("build.gradle", "gradle", this.application);
  }

  public toComponentEntries(packages: Array<MavenPackage>, scanType: ScanType): Map<string, ComponentEntry> {
    let map = new Map<string, ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Group + ":" + pkg.Name,
        pkg.Version,
        "gradle",
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

  public async packageForService(): Promise<Array<MavenPackage>> {
    try {
      const gradleUtils = new GradleUtils(this.options);
      const deps = await gradleUtils.getDependencyArray(this.application, this.options.includeDev);
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
}
