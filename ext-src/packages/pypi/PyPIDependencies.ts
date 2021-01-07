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
import { PyPIPackage } from "./PyPIPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../models/ComponentEntry";
import { PyPICoordinate } from "./PyPICoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RequestService } from "../../services/RequestService";
import { PyPiUtils } from "./PyPiUtils";
import { ScanType } from "../../types/ScanType";

export class PyPIDependencies extends PackageDependenciesHelper implements PackageDependencies {
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

  public toComponentEntries(packages: Array<PyPIPackage>): Array<ComponentEntry> {
    let components = new Array<ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Name,
        pkg.Version,
        "pypi",
        ScanType.NexusIq
      );
      components.push(componentEntry);
      let coordinates = new PyPICoordinate(
        pkg.Name,
        pkg.Version,
        pkg.Extension,
        pkg.Qualifier
      );
      this.CoordinatesToComponents.set(
        coordinates.asCoordinates(),
        componentEntry
      );
    }
    return components;
  }

  public async packageForIq(): Promise<Array<PyPIPackage>> {
    try {
      let pypiUtils = new PyPiUtils();
      let deps = await pypiUtils.getDependencyArray();
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
}
