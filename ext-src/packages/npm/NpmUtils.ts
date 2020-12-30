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
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { NpmPackage } from "./NpmPackage";
import { listInstalled } from 'list-installed';
import { PackageJson } from 'type-fest';

export class NpmUtils {
  public async getDependencyArray(manifestType: string): Promise<Array<NpmPackage>> {
    try {
      let pkgs = await listInstalled(PackageDependenciesHelper.getWorkspaceRoot());

      if (pkgs.size === 0) {
        return Promise.reject("No npm dependencies installed, make sure to install your dependencies");
      }

      return Promise.resolve(this.parseListInstalled(pkgs));
    } catch (ex) {
      return Promise.reject(ex);
    }
  }

  private parseListInstalled(pkgs: Map<String, PackageJson>): Array<NpmPackage>{
    let res: Array<NpmPackage> = new Array();
    for (let [name, packageJson] of pkgs.entries()) {
      if (packageJson.version && packageJson.name) {
        res.push(new NpmPackage(packageJson.name, packageJson.version, ""));
      }
    }

    return this.sortDependencyList(res);
  }

  private sortDependencyList(list: NpmPackage[]): NpmPackage[] {
    return list.sort((a, b) => {
      if (a.Name > b.Name) { return 1; }
      if (a.Name < b.Name) { return -1; }
      return 0;
    });
  }
}