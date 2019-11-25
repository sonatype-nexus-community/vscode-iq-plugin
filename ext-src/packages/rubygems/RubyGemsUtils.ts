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

import { exec } from "../../utils/exec";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RubyGemsPackage } from './RubyGemsPackage';

export class RubyGemsUtils {
  public async getDependencyArray(): Promise<Array<RubyGemsPackage>> {
    try {
      let {stdout, stderr } = await exec(`bundle show`, {
        cwd: PackageDependenciesHelper.getWorkspaceRoot(),
        env: {
          PATH: process.env.PATH
        }
      });

      if (stdout != "" && stderr === "") {
        return Promise.resolve(this.parseGemfile(stdout));
      } else {
        return Promise.reject(
          new Error(
            "Error occurred in generating dependency list. Check that you have bundler installed, and you've installed your dependencies"
          )
        );
      }
    } catch (e) {
      return Promise.reject(
        `bundle show failed, try running it manually to see what went wrong: ${e.error}`
      );
    }
  }

  private parseGemfile(dependencyTree: string): Array<RubyGemsPackage> {
    const dependencies: string = dependencyTree;
    console.debug(dependencies);
    console.debug(
      "------------------------------------------------------------------------------"
    );
    let dependencyList: RubyGemsPackage[] = [];

    const dependencyLines = dependencies.split("\n");
    dependencyLines.forEach((dep) => {  
      console.debug(dep);
      if (dep.trim()) {
        //ignore comments
        if (dep.startsWith("Gems included by the bundle:")) {
          console.debug("Found comment, skipping");
        } else {
          let dependencyParts: string[] = dep.trim().split(" (");
          let realName: string = dependencyParts[0].substring(2, dependencyParts[0].length);
          const name: string = realName;
          const version: string = dependencyParts[1].replace(")", "");
          if (name && version) {
            const dependencyObject: RubyGemsPackage = new RubyGemsPackage(
              name,
              version
            );
            dependencyList.push(dependencyObject);
          } else {
            console.warn(
              "Skipping dependency: " +
                dep +
                " due to missing data (name, version)"
            );
          }
        }
      }
    });

    return dependencyList;
  }
}
