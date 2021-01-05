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
import { exec } from "../../exec";
import { CargoPackage } from "./CargoPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../ComponentInfoPanel";
import { CargoCoordinate } from "./CargoCoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { ComponentRequestEntry } from "../../types/ComponentRequestEntry";
import { ComponentRequest } from "../../types/ComponentRequest";

/**
* @class CargoDependencies
*/
export class CargoDependencies extends PackageDependenciesHelper implements PackageDependencies {
  Dependencies: Array<CargoPackage> = [];
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
    // TODO: Set filename to manifest file for format
    if (this.doesPathExist(this.getWorkspaceRoot(), "")) {
      console.debug("Valid for Cargo");
      return true;
    }
    return false;
  }

  public ConvertToComponentEntry(resultEntry: any): string {
    let coordinates = new CargoCoordinate(resultEntry.component.componentIdentifier.coordinates.name,
      resultEntry.component.componentIdentifier.coordinates.version);
    
    return coordinates.asCoordinates();
  }

  public convertToNexusFormat(): ComponentRequest {
    let comps = this.Dependencies.map(d => {
      let entry: ComponentRequestEntry = {
        componentIdentifier: {
          format: "",
          coordinates: {
            name: d.Name,
            version: d.Version,
          }
        }
      }

      return entry;
    });

    return new ComponentRequest(comps);
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
      let coordinates = new CargoCoordinate(
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
        this.parseCargoDependencyTree(stdout);
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

  private parseCargoDependencyTree(dependencyTree: string) {
    const dependencies: string = dependencyTree;
    console.debug(dependencies);
    console.debug(
      "------------------------------------------------------------------------------"
    );
    let dependencyList: CargoPackage[] = [];

    const dependencyLines = dependencies.split("\n");
    dependencyLines.forEach((dep) => {  
      console.debug(dep);
      // TODO: Implement parsing of dependencies into appropriate list for pushing to IQ server
      throw new Error("not Implemented");
    });

    this.Dependencies = dependencyList;
  }
}
