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

import { PyPIPackage } from "./PyPIPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../models/ComponentEntry";
import { PyPICoordinate } from "./PyPICoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RequestService } from "../../services/RequestService";
import { PyPiUtils } from "./PyPiUtils";
import { ScanType } from "../../types/ScanType";

export class PyPIDependencies extends PackageDependenciesHelper implements PackageDependencies {
  Dependencies: Array<PyPIPackage> = [];
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
    if (PackageDependenciesHelper.doesPathExist(PackageDependenciesHelper.getWorkspaceRoot(), "requirements.txt")) {
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
        entry.componentIdentifier.coordinates.version,
        ScanType.NexusIq
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
      let pypiUtils = new PyPiUtils();
      this.Dependencies = await pypiUtils.getDependencyArray();
      Promise.resolve();
    }
    catch (e) {
      Promise.reject();
    }
  }
}
