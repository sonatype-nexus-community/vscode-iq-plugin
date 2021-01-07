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
import { CargoPackage } from "./CargoPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../models/ComponentEntry";
import { CargoCoordinate } from "./CargoCoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RequestService } from "../../services/RequestService";
import { ScanType } from "../../types/ScanType";
import { CargoUtils } from "./CargoUtils";

/**
* @class CargoDependencies
*/
export class CargoDependencies extends PackageDependenciesHelper implements PackageDependencies {
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
    return PackageDependenciesHelper.checkIfValid("Cargo.lock", "cargo");
  }

  public toComponentEntries(packages: Array<CargoPackage>): Array<ComponentEntry> {
    let components = new Array<ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Name,
        pkg.Version,
        "cargo",
        ScanType.NexusIq
      );
      components.push(componentEntry);
      let coordinates = new CargoCoordinate(
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

  public async packageForIq(): Promise<Array<CargoPackage>> {
    try {
      const composerUtils = new CargoUtils();
      const deps = await composerUtils.getDependencyArray();

      return Promise.resolve(deps);
    } catch (ex) {
      return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while parsing your Cargo.lock file: ${ex}`);
    }
  }
}
