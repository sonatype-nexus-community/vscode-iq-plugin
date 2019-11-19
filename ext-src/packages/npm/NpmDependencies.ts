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

import { NpmPackage } from "./NpmPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../ComponentInfoPanel";
import { NpmCoordinate } from "./NpmCoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RequestService } from "../../RequestService";
import { NpmUtils } from './NpmUtils';
import { ScanType } from "../../ScanType";

export class NpmDependencies implements PackageDependencies {
  Dependencies: Array<NpmPackage> = [];
  CoordinatesToComponents: Map<string, ComponentEntry> = new Map<
    string,
    ComponentEntry
  >();
  RequestService: RequestService;

  constructor(private requestService: RequestService) {
    this.RequestService = this.requestService;
  }

  public async packageForIq(): Promise<any> {
    try {
      let npmUtils = new NpmUtils();
      this.Dependencies = await npmUtils.getDependencyArray();
      Promise.resolve();
    }
    catch (e) {
      Promise.reject();
    }
  }

  public CheckIfValid(): boolean {
    return PackageDependenciesHelper.checkIfValid("package.json", "npm");
  }

  public ConvertToComponentEntry(resultEntry: any): string {
    let coordinates = new NpmCoordinate(resultEntry.component.componentIdentifier.coordinates.packageId, 
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
          Group: any;
          Version: any;
          Extension: any;
        }) => ({
          hash: null,
          componentIdentifier: {
            format: "npm",
            coordinates: {
              packageId: d.Name,
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
      let componentEntry = new ComponentEntry(
        entry.componentIdentifier.coordinates.packageId,
        entry.componentIdentifier.coordinates.version,
        ScanType.NexusIq
      );
      components.push(componentEntry);
      let coordinates = new NpmCoordinate(
        entry.componentIdentifier.coordinates.packageId,
        entry.componentIdentifier.coordinates.version
      );
      this.CoordinatesToComponents.set(
        coordinates.asCoordinates(),
        componentEntry
      );
    }
    return components;
  }
}
