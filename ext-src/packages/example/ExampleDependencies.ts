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
import { ExamplePackage } from "./ExamplePackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../ComponentInfoPanel";
import { ExampleCoordinate } from "./ExampleCoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";

/**
* @class ExampleDependencies
*/
export class ExampleDependencies extends PackageDependenciesHelper implements PackageDependencies {
  Dependencies: Array<ExamplePackage> = [];
  CoordinatesToComponents: Map<string, ComponentEntry> = new Map<
    string,
    ComponentEntry
  >();

  public CheckIfValid(): boolean {
    // TODO: Set filename to manifest file for format
    if (this.doesPathExist(this.getWorkspaceRoot(), "")) {
      console.debug("Valid for Example");
      return true;
    }
    return false;
  }

  public ConvertToComponentEntry(resultEntry: any): string {
    let coordinates = new ExampleCoordinate(resultEntry.component.componentIdentifier.coordinates.name,
      resultEntry.component.componentIdentifier.coordinates.version);
    
    return coordinates.asCoordinates();
  }

  public convertToNexusFormat() {
    return {
      components: _.map(
        this.Dependencies,
        (d: {
          Hash: any;
          Name: any;
          Version: any;
        }) => ({
          hash: null,
          componentIdentifier: {
            format: "Example",
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
      const packageId =
        entry.componentIdentifier.coordinates.name;

      let componentEntry = new ComponentEntry(
        packageId,
        entry.componentIdentifier.coordinates.version
      );
      components.push(componentEntry);
      let coordinates = new ExampleCoordinate(
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
    throw new Error("not Implemented");

    try {
      // TODO: Fill in command to run to get list of dependencies
      let {stdout, stderr } = await exec(``, {
        cwd: this.getWorkspaceRoot(),
        env: {
          PATH: process.env.PATH
        }
      });

      if (stdout != "" && stderr === "") {
        this.parseExampleDependencyTree(stdout);
      } else {
        return Promise.reject(
          new Error(
            "Error occurred in generating dependency tree."
          )
        );
      }

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        `Command failed, try running it manually to see what went wrong: ${e.error}`
      );
    }
  }

  private parseExampleDependencyTree(dependencyTree: string) {
    const dependencies: string = dependencyTree;
    console.debug(dependencies);
    console.debug(
      "------------------------------------------------------------------------------"
    );
    let dependencyList: ExamplePackage[] = [];

    const dependencyLines = dependencies.split("\n");
    dependencyLines.forEach((dep) => {  
      console.debug(dep);
      // TODO: Implement parsing of dependencies into appropriate list for pushing to IQ server
      throw new Error("not Implemented");
    });

    this.Dependencies = dependencyList;
  }
}
