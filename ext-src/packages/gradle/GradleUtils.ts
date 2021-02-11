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
import { MavenPackage } from "../maven/MavenPackage";

export class GradleUtils {

  public async getDependencyArray(): Promise<any> {

    let gradleCommand;
    try {
      gradleCommand = `./gradlew dependencies --configuration default`;

      let { stdout, stderr } = await exec(gradleCommand, {
        cwd: PackageDependenciesHelper.getWorkspaceRoot(),
        env: {
          PATH: process.env.PATH
        }
      });

      if (stdout === "" && stderr != "") {
        return Promise.reject(
          new Error(
            "Error occurred in running gradle. Please check that gradle is on your PATH."
          )
        );
      }

      return Promise.resolve(this.parseGradleDependencyTree(stdout));
    } catch (e) {
      return Promise.reject(
        "gradle command failed, try running it manually to see what went wrong:" +
          gradleCommand +
          ", " +
          e.error
      );
    }
  }

  private parseGradleDependencyTree(output: string): Array<MavenPackage> {
    console.debug(
      "------------------------------------------------------------------------------"
    );
    let dependencyList: MavenPackage[] = [];

    const dependencyLines = output.split("\n");
    dependencyLines.forEach((dep) => {
      console.debug(dep);
      if (dep.trim().includes("\\---")) {
        //ignore empty lines
        const dependencyParts: string[] = dep.trim().replace("\\--- ", "").split(":");
        const group: string = dependencyParts[0];
        const artifact: string = dependencyParts[1];
        const version: string = dependencyParts[2];

        if (artifact && group && version) {
          const dependencyObject: MavenPackage = new MavenPackage(
            artifact,
            group,
            version,
            "jar"
          );
          dependencyList.push(dependencyObject);
        } else {
          console.warn(
            "Skipping dependency: " +
              dep +
              " due to missing data (artifact, version, and/or extension)"
          );
        }
      }
    });

    return dependencyList;
  }
}