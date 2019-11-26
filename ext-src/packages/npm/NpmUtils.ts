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
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash";

import { exec } from "../../utils/exec";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { NpmPackage } from "./NpmPackage";

export class NpmUtils {
  public async getDependencyArray(manifestType: [string, string]): Promise<Array<NpmPackage>> {
    try {
      if (manifestType[0] == "yarn") {
        let {stdout, stderr} = await exec(`yarn list`, {
          cwd: PackageDependenciesHelper.getWorkspaceRoot()
        });

        if (stdout != "" && stderr == "") {
          return Promise.resolve(this.parseYarnList(stdout));
        }
      } else if (manifestType[0] == "npmOld") {
        // We don't really need to do this, since we check if it exists further up the food chain
        const npmShrinkwrapFilename = path.join(
          PackageDependenciesHelper.getWorkspaceRoot(),
          "npm-shrinkwrap.json"
        );

        if (!fs.existsSync(npmShrinkwrapFilename)) {
          let { stdout, stderr } = await exec("npm shrinkwrap", {
            cwd: PackageDependenciesHelper.getWorkspaceRoot()
          });
          let npmShrinkWrapFile = "npm-shrinkwrap.json";
          let shrinkWrapSucceeded =
            stdout || stderr.search(npmShrinkWrapFile) > -1;
          if (!shrinkWrapSucceeded) {
            return Promise.reject("Unable to run npm shrinkwrap");
          }
        }
        //read npm-shrinkwrap.json
        let obj = JSON.parse(fs.readFileSync(npmShrinkwrapFilename, "utf8"));
        
        return Promise.resolve(this.flattenAndUniqDependencies(obj));
      } else if (manifestType[0] == "npmNew") {
        let {stdout, stderr} = await exec(`npm list`, {
          cwd: PackageDependenciesHelper.getWorkspaceRoot()
        });

        if (stdout != "" && stderr == "") {
          return Promise.resolve(this.parseNpmList(stdout));
        }
      } else {
        return Promise.reject();
      }
    } catch (e) {
      return Promise.reject(
        "npm shrinkwrap failed, try running it manually to see what went wrong:" +
          e.message
      );
    }
    return Promise.reject();
  }

  private parseYarnList(output: string) {
    let dependencyList: NpmPackage[] = [];
    let results = output.split("\n");

    results.forEach((dep, index) => {
      if (index == 0) {
        console.debug("Skipping line");
      } else {
        let splitParts = dep.trim().split(" ");
        if (!this.isRegularVersion(splitParts[splitParts.length - 1])) {
          console.debug("Skipping since version range");
        } else {
          let newName = this.removeScopeSymbolFromName(splitParts[splitParts.length - 1]);
          let newSplit = newName.split("@");
          const name = newSplit[0];
          const version = newSplit[1];
          if (name != "" && version != undefined) {
            dependencyList.push(new NpmPackage(name, version, ""));
          } else {
            console.debug("No valid information, skipping dependency", newName);
          }
        }
      }
    });

    return dependencyList.sort((a, b) => {
      if (a.Name > b.Name) { return 1; }
      if (a.Name < b.Name) { return -1; }
      return 0;
    });
  }

  private isRegularVersion(version: string): boolean {
    if (version.includes("^")) {
      return false;
    }
    if (version.includes(">=")) {
      return false;
    }
    if (version.includes("<=")) {
      return false;
    }
    if (version.includes("~")) {
      return false;
    }
    if (version.includes("<")) {
      return false;
    }
    if (version.includes(">")) {
      return false;
    }
    return true;
  }

  private parseNpmList(output: string) {
    let dependencyList: NpmPackage[] = [];
    let results = output.split("\n");

    results.forEach((dep, index) => {
      if (index == 0) {
        console.debug("Skipping first line");
      } else {
        let splitParts = dep.trim().split(" ");

        if (splitParts[splitParts.length - 1] === "deduped") {
          console.debug("Skipping");
        } else {
          let newName = this.removeScopeSymbolFromName(splitParts[splitParts.length - 1]);
          let newSplit = newName.split("@");
          const name = newSplit[0];
          const version = newSplit[1];
          if (name != "" && version != undefined) {
            dependencyList.push(new NpmPackage(name, version, ""));
          } else {
            console.debug("No valid information, skipping dependency", newName);
          }
        }
      }
    });

    return dependencyList.sort((a, b) => {
      if (a.Name > b.Name) { return 1; }
      if (a.Name < b.Name) { return -1; }
      return 0;
    });
  }

  private removeScopeSymbolFromName(name: string): string {
    if (name.substr(0, 1) === "@") {
      return "%40" + name.substr(1, name.length);
    } else {
      return name;
    }
  }

  private flattenAndUniqDependencies(
    npmShrinkwrapContents: any
  ): Array<NpmPackage> {
    console.debug("flattenAndUniqDependencies");
    //first level in npm-shrinkwrap is our project package, we go a level deeper not to include it in the results
    // TODO: handle case where npmShrinkwrapContents does not have a 'dependencies' element defined (eg: simple projects)
    if (npmShrinkwrapContents.dependencies === undefined) {
      return new Array();
    }
    let flatDependencies = this.flattenDependencies(
      this.extractInfo(npmShrinkwrapContents.dependencies)
    );
    let newflatDependencies = _.uniqBy(flatDependencies, function(x) {
      return x.Name;
    });

    console.log(newflatDependencies);
    return flatDependencies;
  }

  private flattenDependencies(dependencies: any): Array<NpmPackage> {
    let result = new Array<NpmPackage>();
    for (let dependency of dependencies) {
      result.push(dependency);
      if (dependency.dependencies) {
        result = result.concat(
          this.flattenDependencies(this.extractInfo(dependency.dependencies))
        );
      }
    }
    return result;
  }

  //extracts array with name, version, dependencies from a dictionary
  private extractInfo(array: any): Array<NpmPackage> {
    return Object.keys(array).map(
      k => new NpmPackage(k, array[k].version, array[k].dependencies)
    );
  }
}