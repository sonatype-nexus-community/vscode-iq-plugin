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
import commandExists from "command-exists";
import { Application } from "../../models/Application";
import { exec } from "../../utils/exec";
import { ILogger, LogLevel } from "../../utils/Logger";
import { MavenPackage } from "../maven/MavenPackage";
import { PackageDependenciesOptions } from "../PackageDependenciesOptions";

export class GradleUtils {
  private logger: ILogger;

  constructor(options: PackageDependenciesOptions) {
    this.logger = options.logger;
  }

  private readonly GRADLE = `gradle`;
  private readonly GRADLEW = `./gradlew`;
  private readonly GRADLEW_BAT = `gradlew.bat`;
  private readonly gradleArguments = `dependencies --configuration runtimeClasspath`;

  public async getDependencyArray(application: Application): Promise<any> {
    this.logger.log(LogLevel.DEBUG, `Starting to attempt to get gradle dependencies`);

    let gradleCommandBaseCommand: string = "";
    let gradleCommand: string = "";

    try {
      const gradleExists = commandExists.sync(this.GRADLE);
      this.logger.log(LogLevel.DEBUG, `Does gradle exist as a command?`, gradleExists);

      if (gradleExists) {
        gradleCommandBaseCommand = this.GRADLE;

        this.logger.log(LogLevel.INFO, `Set gradle Command Base Command`, gradleCommandBaseCommand);
      } else {
        this.logger.log(LogLevel.INFO, `Operating system determination`, process.platform);

        gradleCommandBaseCommand = (process.platform === 'win32') ? this.GRADLEW_BAT : this.GRADLEW;

        this.logger.log(LogLevel.INFO, `Set gradle Command Base Command`, gradleCommandBaseCommand);
      }
      gradleCommand = `${gradleCommandBaseCommand} ${this.gradleArguments}`;

      this.logger.log(LogLevel.INFO, `Full gradle command constructed`, gradleCommand);


      this.logger.log(LogLevel.DEBUG, `Attempting to run gradle command`, gradleCommand);
      const { stdout, stderr } = await exec(gradleCommand, {
        cwd: application.workspaceFolder,
        env: {
          PATH: process.env.PATH
        }
      });
      this.logger.log(LogLevel.DEBUG, `Gradle command has run`, gradleCommand);

      if (stdout === "" && stderr != "") {
        this.logger.log(LogLevel.ERROR, `StdErr has information from running gradle command`, gradleCommand, stderr);

        return Promise.reject(
          new Error(
            `Error occurred in running ${gradleCommandBaseCommand}. Please check that ${gradleCommandBaseCommand} exists or is on your PATH.`
          )
        );
      }

      return Promise.resolve(this.parseGradleDependencyTree(stdout));
    } catch (e) {
      let errorMessage = `${gradleCommand} command failed - try running it mannually to see what went wrong`
      if (e instanceof Error) {
        errorMessage += `. Error is ${e.message}`
      }
      return Promise.reject(errorMessage);
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