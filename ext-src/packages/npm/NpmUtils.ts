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
  public async getDependencyArray(includeDev: boolean = true): Promise<Array<NpmPackage>> {
    try {
      let pkgs = await listInstalled(PackageDependenciesHelper.getWorkspaceRoot());

      if (pkgs.size === 0) {
        return Promise.reject("No npm dependencies installed, make sure to install your dependencies");
      }

      return Promise.resolve(this.parseListInstalled(pkgs, includeDev));
    } catch (ex) {
      return Promise.reject(`Uh oh, spaghetti-o, something went wrong. Most likely you don't have your dependencies installed, so try running npm i or yarn and retrying! Exception message: ${ex}`);
    }
  }

  private parseListInstalled(pkgs: Map<String, PackageJson>, includeDev: boolean = true): Array<NpmPackage>{
    let res: Array<NpmPackage> = new Array();
    for (let [name, packageJson] of pkgs.entries()) {
      if (!includeDev && packageJson.hasOwnProperty("_development")) {
        continue;
      }
      if (packageJson.version && packageJson.name) {
        let parts = packageJson.name!.split("/");
        if (parts && parts.length > 1) {
          res.push(new NpmPackage(parts[1], parts[0], packageJson.version, ""));
          continue;
        }
        res.push(new NpmPackage(packageJson.name, "", packageJson.version, ""));
      }
    }

    return this.sortDependencyList(res);
  }

  private sortDependencyList(list: NpmPackage[]): NpmPackage[] {
    return list.sort((a, b) => {
      let combineA = a.Group + a.Name;
      let combineB = b.Group + b.Name;
      if (combineA > combineB) { return 1; }
      if (combineA < combineB) { return -1; }
      return 0;
    });
  }
}