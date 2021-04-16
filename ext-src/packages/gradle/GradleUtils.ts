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
import commandExistsSync from "command-exists";

export class GradleUtils {
  private gradleArguments = `dependencies --configuration runtimeClasspath`;

  public async getDependencyArray(): Promise<any> {
    let gradleCommand;

    try {
      if (commandExistsSync('gradle')) {
        gradleCommand = `gradle ${this.gradleArguments}`;
      } else {
        gradleCommand = (process.platform === 'win32') ? `gradlew.bat ${this.gradleArguments}` : gradleCommand = `gradlew ${this.gradleArguments}`;
      }

      const { stdout, stderr } = await exec(gradleCommand, {
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

    let dependencyList: MavenPackage[] = [];

    let start: boolean = false;
    const regexReplace: RegExp = /[| ]*[\\+]*[---]{3}/;
    const dependencyLines = output.split("\n");
    dependencyLines.forEach((dep) => {
      if (dep.includes('runtimeClasspath')) {
        start = true;
        return;
      }

      if (start) {
        if (dep === '') {
          start = false;
          return;
        }
        const replaceAndTrim = dep.replace(regexReplace, "").trim();
        const coords = replaceAndTrim.split(":");
        const group: string = coords[0];
        const artifact: string = coords[1];
        let version: string = coords[2];

        if (artifact && group && version) {
          if (version.includes("(*")) {
            console.warn("Omitted version");
            return;
          }
          if (version.includes(">")) {
            version = version.split(">")[1].trim();
          }

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
              " due to missing data (artifact, group, and/or version)"
          );
        }
      }
    });

    return dependencyList;
  }
}