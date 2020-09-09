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

import { exec } from "../../utils/exec";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { MavenPackage } from "./MavenPackage";

export class MavenUtils {
  public async getDependencyArray(): Promise<any> {
    let mvnCommand;
    try {
      const pomFile = path.join(PackageDependenciesHelper.getWorkspaceRoot(), "pom.xml");

      /*
       * Need to use dependency tree operation because:
       * 1. Standard POM may lack dependency versions due to usage of property variables or inherited versions from parent POM
       * 2. Standard POM does not include transitive dependmavenDependenciesencies
       * 3. Effective POM may contain unused dependencies
       */
      const outputPath: string = path.join(
        PackageDependenciesHelper.getWorkspaceRoot(),
        "dependency_tree.txt"
      );
      mvnCommand = `mvn dependency:tree -Dverbose -DappendOutput=true -DoutputFile="${outputPath}" -f "${pomFile}"`;

      await exec(mvnCommand, {
        cwd: PackageDependenciesHelper.getWorkspaceRoot(),
        env: {
          PATH: process.env.PATH
        }
      });

      if (!fs.existsSync(outputPath)) {
        return Promise.reject(
          new Error(
            "Error occurred in generating dependency tree. Please check that maven is on your PATH."
          )
        );
      }
      const dependencyTree: string = fs.readFileSync(outputPath).toString();

      return Promise.resolve(this.parseMavenDependencyTree(dependencyTree));
    } catch (e) {
      return Promise.reject(
        "mvn dependency:tree failed, try running it manually to see what went wrong:" +
          mvnCommand +
          ", " +
          e.error
      );
    }
  }

  private parseMavenDependencyTree(dependencyTree: string): Array<MavenPackage> {
    // For example output, see: https://maven.apache.org/plugins/maven-dependency-plugin/examples/resolving-conflicts-using-the-dependency-tree.html
    const dependencies: string = dependencyTree.replace(
      /[\| ]*[\\+][\\-]/g,
      ""
    ); // cleanup each line to remove the "|", "+-", "\-" tree syntax
    console.debug(dependencies);
    console.debug(
      "------------------------------------------------------------------------------"
    );
    let dependencyList: MavenPackage[] = [];
    let dependencyListString: Set<string> = new Set<string>();

    // Dependencies are returned from the above operation as newline-separated strings of the format group:artifact:extension:version:scope
    // Example: org.springframework.boot:spring-boot-starter:jar:2.0.3.RELEASE:compile
    const dependencyLines = dependencies.split("\n");
    dependencyLines.forEach((dep, index) => {
      if (index > 0) {
        //skip the first element, which is the application's artifact itself
        console.debug(dep);
        if (dep.trim()) {
          //ignore empty lines
          const dependencyParts: string[] = dep.trim().split(":");
          const group: string = dependencyParts[0];
          const artifact: string = dependencyParts[1];
          const extension: string = dependencyParts[2];
          const version: string = dependencyParts[3];
          const scope: string = dependencyParts[4];

          if ("test" != scope) {
            //dependencies used only during unit testing are generally ignored since they aren't included in the runtime artifact
            // artifactId, extension, and version are required fields. If a single dependency is missing any of the three, IQ will return a 400 response for the whole list
            if (artifact && extension && version) {
              const dependencyObject: MavenPackage = new MavenPackage(
                artifact,
                group,
                version,
                extension
              );
              if (!dependencyListString.has(dependencyObject.toCoordinates()))
              {
                dependencyListString.add(dependencyObject.toCoordinates())
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

    // TODO: The dependency list brought back appears to have a ton of duplicates, it needs to be deduped at a minimum in the future
    //   we added dependencyListString above as a brute force way to dedupe. there is probably a better way to dedupe, but we couldn't 
    //   get it to work with the MavenPackage object
    //   Also, it would be good to do the dedupe closer to where the IQ Server request is made (probably IqComponentModel.ts) so that 
    //   the dedupe logic catches all formats, in addition to maven as done here.
    return dependencyList;
  }
}
