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
import { MavenPackage } from "./MavenPackage";
import { PackageDependencies } from "../PackageDependencies";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { MavenCoordinate } from "./MavenCoordinate";
import { RequestService } from "../../services/RequestService";
import { MavenUtils } from "./MavenUtils";
import { ScanType } from "../../types/ScanType";
import { ComponentEntry } from "../../models/ComponentEntry";

export class MavenDependencies extends PackageDependenciesHelper implements PackageDependencies {
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
    return PackageDependenciesHelper.checkIfValid("pom.xml", "maven");
  }

  public toComponentEntries(packages: Array<MavenPackage>): Array<ComponentEntry> {
    let components = new Array<ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Group + ":" + pkg.Name,
        pkg.Version,
        "maven",
        ScanType.NexusIq
      );
      components.push(componentEntry);
      let coordinates = new MavenCoordinate(
        pkg.Name,
        pkg.Group,
        pkg.Version,
        pkg.Extension
      );
      this.CoordinatesToComponents.set(
        coordinates.asCoordinates(),
        componentEntry
      );
    }
    return components;
  }

  public async packageForIq(): Promise<Array<MavenPackage>> {
    try {
      const mavenUtils = new MavenUtils();
      const deps = await mavenUtils.getDependencyArray();
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }
}
