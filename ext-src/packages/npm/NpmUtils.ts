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
  public async getDependencyArray(): Promise<Array<NpmPackage>> {
    try {
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
    } catch (e) {
      return Promise.reject(
        "npm shrinkwrap failed, try running it manually to see what went wrong:" +
          e.message
      );
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