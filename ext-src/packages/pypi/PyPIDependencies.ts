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
import * as path from "path";
import * as fs from "fs";

import { exec } from "../../exec";
import { PyPIPackage } from "./PyPIPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../ComponentInfoPanel";
import { PyPICoordinate } from "./PyPICoordinate";
import { DependencyType } from "../DependencyType";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";

export class PyPIDependencies extends PackageDependenciesHelper implements PackageDependencies {
  Dependencies: Array<PyPIPackage> = [];
  CoordinatesToComponents: Map<string, ComponentEntry> = new Map<
    string,
    ComponentEntry
  >();

  public CheckIfValid(): boolean {
    if (this.doesPathExist(this.getWorkspaceRoot(), "package.json")) {
      console.debug("Valid for NPM");
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
            format: DependencyType.PyPI.toLowerCase(),
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
    let pypiCommand;
    try {
      const requirementsFile = path.join(this.getWorkspaceRoot(), "requirements.txt");

      const outputPath: string = path.join(
        this.getWorkspaceRoot(),
        "requirementsTree.txt"
      );
      pypiCommand = `cat ${requirementsFile} > ${outputPath}`;
      await exec(pypiCommand, {
        cwd: this.getWorkspaceRoot(),
        env: {
          PATH: process.env.PATH
        }
      });

      if (!fs.existsSync(outputPath)) {
        return Promise.reject(
          new Error(
            "Error occurred in generating dependency tree. Please check that pip is on your PATH."
          )
        );
      }
      const dependencyTree: string = fs.readFileSync(outputPath).toString();

      this.parsePyPIDependencyTree(dependencyTree);

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        "pip freeze failed, try running it manually to see what went wrong:" +
        pypiCommand +
          ", " +
          e.error
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
    dependencyLines.forEach((dep, index) => {  
      console.debug(dep);
      if (dep.trim()) {
        //ignore empty lines
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
    });

    this.Dependencies = dependencyList;
  }
}
