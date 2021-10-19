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
import * as fs from "fs";
import * as path from "path";
import * as temp from 'temp';
import { Application } from "../../models/Application";
import { exec } from "../../utils/exec";
import { MavenPackage } from "./MavenPackage";



export class MavenUtils {
  public async getDependencyArray(application: Application): Promise<any> {
    let mvnCommand;
    try {
      const pomFile = path.join(application.workspaceFolder, "pom.xml");

      /*
       * Need to use dependency tree operation because:
       * 1. Standard POM may lack dependency versions due to usage of property variables or inherited versions from parent POM
       * 2. Standard POM does not include transitive Maven Dependencies
       * 3. Effective POM may contain unused dependencies
       */

      const tmpFile = temp.openSync();

      mvnCommand = `mvn dependency:tree -Dverbose -DappendOutput=true -DoutputFile="${tmpFile.path}" -f "${pomFile}"`;

      await exec(mvnCommand, {
        cwd: application.workspaceFolder
      });

      if (!fs.existsSync(tmpFile.path)) {
        return Promise.reject(
          new Error(
            "Error occurred in generating dependency tree. Please check that maven is on your PATH."
          )
        );
      }
      const dependencyTree: string = fs.readFileSync(tmpFile.path).toString();

      temp.cleanupSync();

      return Promise.resolve(this.parseMavenDependencyTree(dependencyTree));
    } catch (e) {
      let errorMessage = `${mvnCommand} command failed - try running it mannually to see what went wrong`
      if (e instanceof Error) {
        errorMessage += `. Error is ${e.message}`
      }
      return Promise.reject(errorMessage);
    }
  }

  private parseMavenDependencyTree(dependencyTree: string): Array<MavenPackage> {
    // For example output, see: https://maven.apache.org/plugins/maven-dependency-plugin/examples/resolving-conflicts-using-the-dependency-tree.html
    const dependencies: string = dependencyTree.replace(
      /[\| ]*[\\+][\\-]/g,
      ""
    ); // cleanup each line to remove the "|", "+-", "\-" tree syntax
    // console.debug(dependencies);
    // console.debug(
    //   "------------------------------------------------------------------------------"
    // );

    let dependencyList: MavenPackage[] = [];
    let dependencyListString: Set<string> = new Set<string>();

    const dependencyLines = dependencies.split("\n");
    dependencyLines.forEach((dep, index) => {
      if (index > 0) {
        if (dep.trim()) {
          console.log(`Parsing dep: ${dep}`)
          if (dep.includes(" omitted for ")) {
            console.log(`Skipping dep: ${dep}`)
            return;
          }
          const dependencyParts: string[] = dep.trim().split(":");
          const group: string = dependencyParts[0];
          const artifact: string = dependencyParts[1];
          const extension: string = dependencyParts[2];
          const version: string = dependencyParts[3];
          const scope: string = dependencyParts[4];

          if ("test" != scope) {
            if (artifact && extension && version) {
              const dependencyObject: MavenPackage = new MavenPackage(
                artifact,
                group,
                version,
                extension
              );
              if (!dependencyListString.has(dependencyObject.toPurl())) {
                dependencyListString.add(dependencyObject.toPurl())
                dependencyList.push(dependencyObject);
              }
            } else {
              console.warn(
                "Skipping dependency: " +
                dep +
                " due to missing data (artifact, version, and/or extension)"
              );
            }
          }
        }
      }
    });

    return dependencyList;
  }
}
