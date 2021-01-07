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

  public toComponentEntries(packages: Array<GolangPackage>): Array<ComponentEntry> {
    let components = new Array<ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Name,
        pkg.Version,
        "golang",
        ScanType.NexusIq
      );
      components.push(componentEntry);
      let coordinates = new GolangCoordinate(
        pkg.Name,
        pkg.Version
      );
      this.CoordinatesToComponents.set(
        coordinates.asCoordinates(),
        componentEntry
      );
    }
    return components;
  }

  public async packageForIq(): Promise<Array<GolangPackage>> {
    try {
      const golangUtils = new GolangUtils();
      const deps = await golangUtils.getDependencyArray(this.scanType);
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
}
