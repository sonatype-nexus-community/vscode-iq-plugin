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

import { exec } from "../../exec";
import { GolangPackage } from "./GolangPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../ComponentInfoPanel";
import { GolangCoordinate } from "./GolangCoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RequestService } from "../../RequestService";

export class GolangDependencies extends PackageDependenciesHelper implements PackageDependencies {
  Dependencies: Array<GolangPackage> = [];
  CoordinatesToComponents: Map<string, ComponentEntry> = new Map<
    string,
    ComponentEntry
  >();
  RequestService: RequestService;

  constructor(private requestService: RequestService) {
    super();
    this.RequestService = this.requestService;
  }

  public CheckIfValid(): boolean {
    if (this.doesPathExist(this.getWorkspaceRoot(), "go.sum")) {
      console.debug("Valid for Golang");
      return true;
    }
    return false;
  }

  public ConvertToComponentEntry(resultEntry: any): string {
    let coordinates = new GolangCoordinate(resultEntry.component.componentIdentifier.coordinates.name, 
      resultEntry.component.componentIdentifier.coordinates.version);

    return coordinates.asCoordinates();
  }

  public convertToNexusFormat() {
    return {
      components: _.map(
        this.Dependencies,
        (d: { Hash: any; Name: any; Version: any }) => ({
          hash: null,
          componentIdentifier: {
            format: "golang",
            coordinates: {
              name: d.Name,
              version: d.Version
            }
          }
        })
      )
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
      let coordinates = new GolangCoordinate(
        entry.componentIdentifier.coordinates.name,
        entry.componentIdentifier.coordinates.version
      );
      this.CoordinatesToComponents.set(
        coordinates.asCoordinates(),
        componentEntry
      );
    }
    return components;
  }

  public async packageForIq(): Promise<any> {
    try {
      // TODO: When running this command, Golang is now using the workspace root to establish a GOCACHE, we should use some other temporary area or try and suss out the real one
      let { stdout, stderr } = await exec(`go list -m all`, {
        cwd: this.getWorkspaceRoot(),
        env: {
          PATH: process.env.PATH,
          HOME: this.getGoCacheDirectory()
        }
      });

      if (stdout != "" && stderr === "") {
        this.parseGolangDependencies(stdout);
      } else {
        return Promise.reject(
          new Error(
            "Error occurred in generating dependency tree. Please check that golang is on your PATH."
          )
        );
      }

      return Promise.resolve();
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

  private parseGolangDependencies(dependencyTree: string) {
    let dependencyList: GolangPackage[] = [];

    const dependencyLines = dependencyTree.split("\n");

    dependencyLines.forEach((dep, index) => {
      if (index > 0 && dep != "") {
        const dependencyParts: string[] = dep.trim().split(" ");
        const name: string = dependencyParts[0];
        const version: string = dependencyParts[1];

        dependencyList.push(new GolangPackage(name, version));
      }
    });

    this.Dependencies = dependencyList;
  }
}
