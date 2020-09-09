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
import { ComposerPackage } from './ComposerPackage';

const COMPOSER_SHOW_COMMAND = "composer show";

export class ComposerUtils {
  public async getDependencyArray(): Promise<Array<ComposerPackage>> {
    console.debug(`running '${COMPOSER_SHOW_COMMAND}'`);
    try {
      let { stdout, stderr } = await exec(COMPOSER_SHOW_COMMAND, {
        cwd: PackageDependenciesHelper.getWorkspaceRoot()
      });

      if (stdout != "" && stderr === "") {
        return Promise.resolve(this.parseComposerInstall(stdout));
      } else {
        return Promise.reject(
          new Error(
            "Error occurred in generating dependency list. Check that you have Composer installed"
          )
        );
      }
    } catch (e) {
      return Promise.reject(
        `"composer show" failed, try running it manually to see what went wrong: ${e.error}`
      );
    }
  }

  private parseComposerInstall(dependencyTree: string): Array<ComposerPackage> {
    const dependencies: string = dependencyTree;
    console.debug(dependencies);
    console.debug(
      "------------------------------------------------------------------------------"
    );
    let dependencyList: ComposerPackage[] = [];

    const dependencyLines = dependencies.split("\n");
    dependencyLines.forEach((dep) => {
      if (dep.trim()) {
        let dependencyParts: string[] = dep.replace(/\s{2,}/g,' ').trim().split(" ");
        const name: string = dependencyParts[0];
        const version: string = dependencyParts[1];
        if (name && version) {
          const dependencyObject: ComposerPackage = new ComposerPackage(
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
    });

    return dependencyList;
  }
}
