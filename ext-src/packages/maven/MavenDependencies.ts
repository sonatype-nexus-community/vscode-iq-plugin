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

import * as _ from "lodash";
import { MavenPackage } from "./MavenPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "ext-src/ComponentInfoPanel";
import * as path from "path";
import * as fs from "fs";
import { exec } from "../../exec";
import { MavenCoordinate } from "ext-src/coordinates/MavenCoordinate";

export class MavenDependencies implements PackageDependencies {
  Dependencies: Array<MavenPackage>;
  CoordinatesToComponents: Map<String, ComponentEntry>;

  public convertToNexusFormat() {
    return {
      components: _.map(this.Dependencies.entries, (d: { Hash: any; Name: any; Group: any; Version: any; Extension: any; }) => ({
        hash: d.Hash,
        componentIdentifier: {
          format: "maven",
          coordinates: {
            artifactId: d.Name,
            groupId: d.Group,
            version: d.Version,
            extension: d.Extension
          }
        }
      }))
    };
  }

  public toComponentEntries(data: any): Array<ComponentEntry> {
    let components = new Array<ComponentEntry>();
    for (let entry of data.components) {
      const packageId = entry.componentIdentifier.coordinates.groupId +":"+ entry.componentIdentifier.coordinates.artifactId;

      let componentEntry = new ComponentEntry(
        packageId,
        entry.componentIdentifier.coordinates.version
      );
      components.push(componentEntry);
      let coordinates = entry.componentIdentifier.coordinates as MavenCoordinate;
      this.CoordinatesToComponents.set(
        coordinates.asCoordinates(),
        componentEntry
      );
    }
    return components;
  }

  public async packageForIq(workspaceRoot: string) {
    try {
      const pomFile = path.join(workspaceRoot, "pom.xml");

      /*
       * Need to use dependency tree operation because:
       * 1. Standard POM may lack dependency versions due to usage of property variables or inherited versions from parent POM
       * 2. Standard POM does not include transitive dependmavenDependenciesencies
       * 3. Effective POM may contain unused dependencies
       */
      const outputPath: string = path.join(workspaceRoot, "dependency_tree.txt");

      await exec(`mvn dependency:tree -Dverbose -packageForIqDoutputFile="${outputPath}" -f "${pomFile}"`, {
        cwd: workspaceRoot,
        env: {
          PATH: process.env.PATH
        }
      });

      if (!fs.existsSync(outputPath)){
        return Promise.reject(new Error('Error occurred in generating dependency tree. Please check that maven is on your PATH.'));
      }
      const dependencyTree: string = fs.readFileSync(outputPath).toString();

      this.parseMavenDependencyTree(dependencyTree);
    } catch (e) {
      return Promise.reject(
        "mvn dependency:tree failed, try running it manually to see what went wrong:" +
          e.message
      );
    }
  }

  private parseMavenDependencyTree(dependencyTree: string){
    // For example output, see: https://maven.apache.org/plugins/maven-dependency-plugin/examples/resolving-conflicts-using-the-dependency-tree.html
    const dependencies: string =  dependencyTree.replace(/[\| ]*[\\+][\\-]/g, "");  // cleanup each line to remove the "|", "+-", "\-" tree syntax
    console.debug(dependencies)
    console.debug("------------------------------------------------------------------------------")
    let dependencyList: MavenPackage[] = [];

    // Dependencies are returned from the above operation as newline-separated strings of the format group:artifact:extension:version:scope
    // Example: org.springframework.boot:spring-boot-starter:jar:2.0.3.RELEASE:compile
    const dependencyLines = dependencies.split("\n");
    dependencyLines.forEach((dep, index) => {
      if (index > 0){ //skip the first element, which is the application's artifact itself
        console.debug(dep)
        if (dep.trim()) {  //ignore empty lines
          const dependencyParts: string[] = dep.trim().split(":");
          const group: string = dependencyParts[0];
          const artifact: string = dependencyParts[1];
          const extension: string = dependencyParts[2];
          const version: string = dependencyParts[3];
          const scope: string = dependencyParts[4];

          if ("test" != scope) {  //dependencies used only during unit testing are generally ignored since they aren't included in the runtime artifact
            // artifactId, extension, and version are required fields. If a single dependency is missing any of the three, IQ will return a 400 response for the whole list
            if (artifact && extension && version) {
              const dependencyObject: MavenPackage = new MavenPackage(artifact, group, version, extension);
              dependencyList.push(dependencyObject);
            }
            else {
              console.warn("Skipping dependency: " + dep + " due to missing data (artifact, version, and/or extension)")
            }
          }
        }
      }
    });

    this.Dependencies = dependencyList;
  }
}
