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
import { join } from 'path';
import { readFileSync } from 'fs';
import { parse } from 'toml';

import { GolangPackage } from "./GolangPackage";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { GO_MOD_SUM, DEP_LOCK } from "./GolangScanType";

export class GolangUtils {
  public async getDependencyArray(scanType: string): Promise<Array<GolangPackage>> {
    try {
      if (scanType === GO_MOD_SUM) {
        // TODO: When running this command, Golang is now using the workspace root to establish a GOCACHE, we should use some other temporary area or try and suss out the real one
        let { stdout, stderr } = await exec(`go list -m all`, {
          cwd: PackageDependenciesHelper.getWorkspaceRoot(),
          env: {
            PATH: process.env.PATH,
            HOME: this.getGoCacheDirectory()
          }
        });

        if (stdout != "" && stderr === "") {
          return Promise.resolve(this.parseGolangDependencies(stdout));
        } else {
          return Promise.reject(
            new Error(
              "Error occurred in generating dependency tree. Please check that golang is on your PATH."
            )
          );
        }
      }
      if (scanType === DEP_LOCK) {
        let goPkgLockPath: string = join(PackageDependenciesHelper.getWorkspaceRoot(), DEP_LOCK);
        let goPkgContents: string = readFileSync(goPkgLockPath, "utf8");
        let depList: any = parse(goPkgContents);

        console.log(depList);

        return Promise.resolve(this.parseGolangDepDependencies(depList.projects));
      } else {
        return Promise.reject("Type not implemented");
      }
    } catch (e) {
      return Promise.reject(
        "go list -m all failed, please try running locally to see why: " +
          e.message
      );
    }
  }

  private getGoCacheDirectory(): string {
    // TODO: This will only work on OS X/Linux, need to find a valid GOCACHE dir and set it for Windows
    return "/tmp/gocache/";
  }

  private parseGolangDepDependencies(projectList: [any]): Array<GolangPackage> {
    let dependencyList: GolangPackage[] = [];

    projectList.forEach((project) => {
      if (project.version && project.name) {
        dependencyList.push(new GolangPackage(project.name, project.version));
      }
    });

    return dependencyList;
  }

  private parseGolangDependencies(dependencyTree: string): Array<GolangPackage> {
    let dependencyList: GolangPackage[] = [];

    const dependencyLines = dependencyTree.split("\n");

    dependencyLines.forEach((dep, index) => {
      if (index > 0 && dep != "") {
        const dependencyParts: string[] = dep.trim().split(" ");
        const fullName: string = dependencyParts[0];
        const version: string = dependencyParts[1];
        dependencyList.push(
          new GolangPackage(
            fullName, 
            version));
      }
    });

    return dependencyList;
  }
}