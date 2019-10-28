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
import { PyPIPackage } from "./PyPIPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../ComponentInfoPanel";
import { PyPICoordinate } from "./PyPICoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";

export class PyPIDependencies extends PackageDependenciesHelper implements PackageDependencies {
  Dependencies: Array<PyPIPackage> = [];
  CoordinatesToComponents: Map<string, ComponentEntry> = new Map<
    string,
    ComponentEntry
  >();

  public CheckIfValid(): boolean {
    if (this.doesPathExist(this.getWorkspaceRoot(), "requirements.txt")) {
      console.debug("Valid for PyPI");
      return true;
    }
    return false;
  }

  public ConvertToComponentEntry(resultEntry: any): string {
    let coordinates = new PyPICoordinate(resultEntry.component.componentIdentifier.coordinates.name,
      resultEntry.component.componentIdentifier.coordinates.version,
      "", "");
    
    return coordinates.asCoordinates();
  }

  public convertToNexusFormat() {
    return {
      components: _.map(
        this.Dependencies,
        (d: {
          Hash: any;
          Name: any;
          Qualifier: any;
          Extension: any;
          Version: any;
        }) => ({
          hash: null,
          componentIdentifier: {
            format: "pypi",
            coordinates: {
              name: d.Name,
              version: d.Version,              
              qualifier: d.Qualifier, // "py2.py3-none-any"
              extension: d.Extension // "whl"              
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
      let coordinates = new PyPICoordinate(
        entry.componentIdentifier.coordinates.name,
        entry.componentIdentifier.coordinates.version,
        entry.componentIdentifier.coordinates.extension,
        entry.componentIdentifier.coordinates.qualifier
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
      let {stdout, stderr } = await exec(`cat requirements.txt`, {
        cwd: this.getWorkspaceRoot(),
        env: {
          PATH: process.env.PATH
        }
      });

      if (stdout != "" && stderr === "") {
        this.parsePyPIDependencyTree(stdout);
      } else {
        return Promise.reject(
          new Error(
            "Error occurred in generating dependency tree. Check that there is not an issue with your requirements.txt"
          )
        );
      }

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        `cat requirements.txt failed, try running it manually to see what went wrong: ${e.error}`
      );
    }
  }

  private parsePyPIDependencyTree(dependencyTree: string) {
    const dependencies: string = dependencyTree;
    console.debug(dependencies);
    console.debug(
      "------------------------------------------------------------------------------"
    );
    let dependencyList: PyPIPackage[] = [];
    //numpy==1.16.4
    const dependencyLines = dependencies.split("\n");
    dependencyLines.forEach((dep) => {  
      console.debug(dep);
      if (dep.trim()) {
        //ignore comments
        if (dep.startsWith("#")) {
          console.debug("Found comment, skipping");
        } else {
          const dependencyParts: string[] = dep.trim().split("==");
          const name: string = dependencyParts[0];
          const version: string = dependencyParts[1];
          const extension: string = "";
          const qualifier: string = "";
            //dependencies used only during unit testing are generally ignored since they aren't included in the runtime artifact
            // artifactId, extension, and version are required fields. If a single dependency is missing any of the three, IQ will return a 400 response for the whole list
          if (name && version) {
            const dependencyObject: PyPIPackage = new PyPIPackage(
              name,
              version,
              extension,
              qualifier
            );
            dependencyList.push(dependencyObject);
          } else {
            console.warn(
              "Skipping dependency: " +
                dep +
                " due to missing data (name, version, and/or extension)"
            );
          }
        }
      }
    });

    this.Dependencies = dependencyList;
  }
}
