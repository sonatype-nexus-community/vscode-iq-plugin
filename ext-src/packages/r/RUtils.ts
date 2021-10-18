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

import { Application } from "../../models/Application";
import { exec } from "../../utils/exec";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RPackage } from './RPackage';

export class RUtils {
  public async getDependencyArray(application: Application): Promise<Array<RPackage>> {
    try {
      let { stdout, stderr } = await exec(`RScript ` + PackageDependenciesHelper.getExtensionPath() + `/scripts/installed.r`
        , {
          cwd: application.workspaceFolder
        });

      if (stdout != "" && stderr === "") {
        return Promise.resolve(this.parseRInstall(stdout));
      } else {
        return Promise.reject(
          new Error(
            "Error occurred in generating dependency list. Check that you have R installed/"
          )
        );
      }
    } catch (e) {
      let errorMessage = 'R script failed, try running it manually to see what went wrong'
      if (e instanceof Error) {
        errorMessage += `. Error is ${e.message}`
      }
      return Promise.reject(errorMessage);
    }
  }

  private parseRInstall(dependencyTree: string): Array<RPackage> {
    const dependencies: string = dependencyTree;
    console.debug(dependencies);
    console.debug(
      "------------------------------------------------------------------------------"
    );
    let dependencyList: RPackage[] = [];

    const dependencyLines = dependencies.split("\n");
    dependencyLines.forEach((dep) => {
      console.debug(dep);
      if (dep.trim()) {
        //ignore comments
        if (dep.includes("Package Version")) {
          console.debug("Found headers, skipping");
        } else {
          let dependencyParts: string[] = dep.replace(/\s{2,}/g, ' ').trim().split(" ");
          const name: string = dependencyParts[0];
          const version: string = dependencyParts[2];
          if (name && version) {
            const dependencyObject: RPackage = new RPackage(
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
