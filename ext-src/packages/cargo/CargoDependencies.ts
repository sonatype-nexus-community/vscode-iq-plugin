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
import { ComponentRequestEntry } from "../../types/ComponentRequestEntry";
import { ComponentRequest } from "../../types/ComponentRequest";
import { RequestService } from "../../services/RequestService";
import { ScanType } from "../../types/ScanType";
import { PackageURL } from 'packageurl-js';
import { CargoUtils } from "./CargoUtils";

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
    return PackageDependenciesHelper.checkIfValid("cargo.lock", "cargo");
  }

  public ConvertToComponentEntry(resultEntry: any): string {
    let coordinates = new CargoCoordinate(resultEntry.component.componentIdentifier.coordinates.name,
      resultEntry.component.componentIdentifier.coordinates.namespace,
      resultEntry.component.componentIdentifier.coordinates.version);
    
    return coordinates.asCoordinates();
  }

  public convertToNexusFormat(): ComponentRequest {
    let comps = this.Dependencies.map(d => {
      let entry: ComponentRequestEntry = {
        packageUrl: d.toPurl()
      }

      return entry;
    });

    return new ComponentRequest(comps);
  }

  public toComponentEntries(data: any): Array<ComponentEntry> {
    let components = new Array<ComponentEntry>();
    for (let entry of data.components) {
      const purl: PackageURL = PackageURL.fromString(entry.packageUrl);
      const packageId = purl.name;
      const namespace = purl.namespace;
      const version = purl.version;

      let componentEntry = new ComponentEntry(
        namespace + ":" + packageId,
        version,
        "cargo",
        ScanType.NexusIq
      );
      components.push(componentEntry);
      let coordinates = new CargoCoordinate(
        packageId,
        namespace,
        version
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
      let composerUtils = new CargoUtils();
      this.Dependencies = await composerUtils.getDependencyArray();

      return Promise.resolve();
    } catch (ex) {
      return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while parsing your composer.lock file: ${ex}`);
    }
  }
}
