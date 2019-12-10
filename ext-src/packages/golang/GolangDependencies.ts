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

import { GolangPackage } from "./GolangPackage";
import { PackageDependencies } from "../PackageDependencies";
import { GolangCoordinate } from "./GolangCoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RequestService } from "../../services/RequestService";
import { GolangUtils } from "./GolangUtils";
import { ScanType } from "../../types/ScanType";
import { ComponentEntry } from "../../models/ComponentEntry";
import { GolangScanType } from "./GolangScanType";

export class GolangDependencies extends PackageDependenciesHelper implements PackageDependencies {
  Dependencies: Array<GolangPackage> = [];
  CoordinatesToComponents: Map<string, ComponentEntry> = new Map<
    string,
    ComponentEntry
  >();
  RequestService: RequestService;
  private scanType: string = "";

  constructor(private requestService: RequestService) {
    super();
    this.RequestService = this.requestService;
  }

  public CheckIfValid(): boolean {
    this.scanType =  PackageDependenciesHelper.checkIfValidWithArray(GolangScanType, "golang");
    return this.scanType === "" ? false : true;
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
        entry.componentIdentifier.coordinates.version,
        ScanType.NexusIq
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
      let golangUtils = new GolangUtils();
      this.Dependencies = await golangUtils.getDependencyArray(this.scanType);
      Promise.resolve();
    }
    catch (e) {
      Promise.reject();
    }
  }
}
