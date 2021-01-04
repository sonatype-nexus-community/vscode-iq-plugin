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
import { PyPIPackage } from './PyPIPackage';
import { type } from 'os';

export class PyPiUtils {
  public async getDependencyArray(): Promise<Array<PyPIPackage>> {
    // Try to generate in fly the requirements content
    try {
      if (PackageDependenciesHelper.doesPathExist(PackageDependenciesHelper.getWorkspaceRoot(), "Pipfile.lock") &&
      ! PackageDependenciesHelper.doesPathExist(PackageDependenciesHelper.getWorkspaceRoot(), "requirements.txt")) {
        let requirements = await this.generateRequirements();
        return Promise.resolve(this.parsePyPIDependencyTree(requirements));
      }
    } catch (e) {
      console.log(`Unable to generate on fly the requirement : ${e}`)
      return Promise.reject(
        new Error(
          "Error occurred in generating dependency tree. Check that there is not an issue with your requirements.txt"
        )
      );
    }
    // Continue
    const WINDOWS = "Windows_NT"
    try {
      let command: string = "cat requirements.txt"
      if (type() === WINDOWS) {
        command = "type requirements.txt"
      }
      let {stdout, stderr } = await exec(command, {
        cwd: PackageDependenciesHelper.getWorkspaceRoot(),
        env: {
          PATH: process.env.PATH
        }
      });

      if (stdout != "" && stderr === "") {
        return Promise.resolve(this.parsePyPIDependencyTree(stdout));
      } else {
        return Promise.reject(
          new Error(
            "Error occurred in generating dependency tree. Check that there is not an issue with your requirements.txt"
          )
        );
      }
    } catch (e) {
      return Promise.reject(
        `cat requirements.txt failed, try running it manually to see what went wrong: ${e.error}`
      );
    }
  }

  private async generateRequirements(): Promise<string> {

    try {
      let {stdout, stderr } = await exec("pipenv run pip freeze", {
        cwd: PackageDependenciesHelper.getWorkspaceRoot(),
        env: {
          PATH: process.env.PATH
        }
      });
      if (stdout != "" && stderr === "") {
        return Promise.resolve(stdout);
      } 
      return Promise.reject(
        new Error(
          `Generate requirements.txt content failed, try running it manually to see what went wrong: ${stderr}`
        )
      );

    } catch (e) {
      return Promise.reject(
        `Generate requirements.txt content failed, try running it manually to see what went wrong: ${e.error}`
      );
    }
  }

  private parsePyPIDependencyTree(dependencyTree: string): Array<PyPIPackage> {
    const dependencies: string = dependencyTree;
    console.debug(dependencies);
    console.debug(
      "------------------------------------------------------------------------------"
    );
    let dependencyList: PyPIPackage[] = [];
    //numpy==1.16.4
    const dependencyLines = dependencies.split("\n");
    dependencyLines.forEach((dep) => {  
      console.debug(dep);
      if (dep.trim()) {
        //ignore comments
        if (dep.startsWith("#")) {
          console.debug("Found comment, skipping");
        } else {
          const dependencyParts: string[] = dep.trim().split("==");
          const name: string = dependencyParts[0];
          const version: string = dependencyParts[1];
          const extension: string = "";
          const qualifier: string = "";
            //dependencies used only during unit testing are generally ignored since they aren't included in the runtime artifact
            // artifactId, extension, and version are required fields. If a single dependency is missing any of the three, IQ will return a 400 response for the whole list
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
                " due to missing data (name, version, and/or extension)"
            );
          }
        }
      }
    });

    return dependencyList;
  }
}
