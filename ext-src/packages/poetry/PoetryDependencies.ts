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

import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../models/ComponentEntry";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RequestService } from "../../services/RequestService";
import { PyPIDependencies } from '../pypi/PyPIDependencies';
import { ScanType } from "../../types/ScanType";
import { ComponentRequestEntry } from "../../types/ComponentRequestEntry";
import { ComponentRequest } from "../../types/ComponentRequest";
import { PoetryUtils } from "./PoetryUtils";
import { PyPIPackage } from '../pypi/PyPIPackage';
import { PyPICoordinate } from "../pypi/PyPICoordinate";

export class PoetryDependencies extends PyPIDependencies implements PackageDependencies {
  Dependencies: Array<PyPIPackage> = [];
  CoordinatesToComponents: Map<string, ComponentEntry> = new Map<
    string,
    ComponentEntry
  >();

  constructor(requestService: RequestService) {
    super(requestService);
  }

  public CheckIfValid(): boolean {
    if (PackageDependenciesHelper.doesPathExist(PackageDependenciesHelper.getWorkspaceRoot(), "poetry.lock")) {
      console.debug("Valid for Poetry");
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

  public convertToNexusFormat(): ComponentRequest {
    let comps = this.Dependencies.map(d => {
      let entry: ComponentRequestEntry = {
        componentIdentifier: {
          format: "pypi",
          coordinates: {
            name: d.Name,
            version: d.Version,
            extension: "tar.gz"
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
      const packageId = entry.componentIdentifier.coordinates.name;
      const version = entry.componentIdentifier.coordinates.version;

      let componentEntry = new ComponentEntry(
        packageId,
        version,
        "pypi",
        ScanType.NexusIq
      );
      components.push(componentEntry);
      let coordinates = new PyPICoordinate(
        packageId,
        version,
        "",
        ""
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
      let poetryUtils = new PoetryUtils();
      this.Dependencies = await poetryUtils.getDependencyArray();
      Promise.resolve();
    }
    catch (e) {
      Promise.reject();
    }
  }
}
