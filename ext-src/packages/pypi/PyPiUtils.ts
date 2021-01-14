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
import { PyPIPackage } from './PyPIPackage';
import { readFileSync } from "fs";
import { join } from "path";

export class PyPiUtils {
  public async getDependencyArray(): Promise<Array<PyPIPackage>> {
    try {
      const requirements = readFileSync(
        join(
          PackageDependenciesHelper.getWorkspaceRoot(), 
          "requirements.txt"));

      return Promise.resolve(
        this.parsePyPIDependencyTree(
          requirements.toString()));
    } catch (ex) {
      return Promise.reject(
        `Error occurred in generating dependency tree. Check that there is not an issue with your requirements.txt, ex: ${ex}`
        );
    }
  }

  private parsePyPIDependencyTree(dependencyTree: string): Array<PyPIPackage> {
    let dependencyList: PyPIPackage[] = [];
    dependencyTree.split("\n").forEach((dep) => {  
      if (dep.trim()) {
        if (dep.startsWith("#")) {
          console.debug("Found comment, skipping");
        } else {
          // remove any conditionals after semicolon, split result to get package and version
          const dependencyParts: string[] = dep.split(";")[0].trim().split("==");
          if (!dependencyParts || dependencyParts.length != 2) {
            // Short circuit, we couldn't split, move on to next one
            return;
          }
          const name: string = dependencyParts[0];
          const version: string = dependencyParts[1];
          const extension: string = "tar.gz";
          const qualifier: string = "";
          if (name && version) {
            const dependencyObject: PyPIPackage = new PyPIPackage(
              name,
              version,
              extension,
              qualifier
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
