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
import * as fs from "fs";
import * as path from "path";

import { exec } from "../../exec";
import { GolangPackage } from "./GolangPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../ComponentInfoPanel";
import { GolangCoordinate } from "./GolangCoordinate";

export class GolangDependencies implements PackageDependencies {
  Dependencies: Array<GolangPackage> = [];
  CoordinatesToComponents: Map<string, ComponentEntry> = new Map<string, ComponentEntry>();

  public convertToNexusFormat() {
    return {
      components: _.map(this.Dependencies, (d: { Hash: any; Name: any; Version: any; }) => ({
        hash: d.Hash,
        componentIdentifier: {
          format: "golang",
          coordinates: {
            name: d.Name,
            version: d.Version
          }
        }
      }))
    };
  }

  public toComponentEntries(data: any): Array<ComponentEntry> {
    let components = new Array<ComponentEntry>();
    for (let entry of data.components) {
      const packageId = entry.componentIdentifier.coordinates.name;

      let componentEntry = new ComponentEntry(
        packageId,
        entry.componentIdentifier.coordinates.version
      );
      components.push(componentEntry);
      let coordinates = new GolangCoordinate(entry.componentIdentifier.coordinates.name, 
        entry.componentIdentifier.coordinates.version);
      this.CoordinatesToComponents.set(
        coordinates.asCoordinates(),
        componentEntry
      );
    }
    return components;
  }

  public async packageForIq(workspaceRoot: string): Promise<any> {
    try {
      // TODO: Probably should output to somewhere else on disk, or maybe just capture the stdout to a string
      const outputPath = path.join(
        workspaceRoot,
        "golistresults.txt"
      );

      // TODO: When running this command, Golang is now using the workspace root to establish a GOCACHE, we should use some other temporary area or try and suss out the real one
      await exec(`go list -m all > ${outputPath}`, {
        cwd: workspaceRoot,
        env: {
          PATH: process.env.PATH,
          HOME: workspaceRoot
        }
      });

      if (!fs.existsSync(outputPath)){
        return Promise.reject(new Error('Error occurred in generating dependency tree. Please check that golang is on your PATH.'));
      }
      const dependencyTree: string = fs.readFileSync(outputPath).toString();

      this.parseGolangDependencies(dependencyTree);

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        "go list -m all failed, please try running locally to see why: " +
          e.message
      );
    }
  }

  private parseGolangDependencies(dependencyTree: string) {
    let dependencyList: GolangPackage[] = [];

    const dependencyLines = dependencyTree.split("\n");

    dependencyLines.forEach((dep, index) => {
      if (index > 0 && dep != "") {
        const dependencyParts: string[] = dep.trim().split(" ");
        const name: string = dependencyParts[0];
        const version: string = dependencyParts[1];

        dependencyList.push(new GolangPackage(name, version))
      }
    })

    this.Dependencies = dependencyList;
  }
}
