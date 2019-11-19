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

import { MavenPackage } from "./MavenPackage";
import { PackageDependencies } from "../PackageDependencies";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { ComponentEntry } from "../../ComponentInfoPanel";
import { MavenCoordinate } from "./MavenCoordinate";
import { RequestService } from "../../RequestService";
import { MavenUtils } from "./MavenUtils";
import { ScanType } from "../../ScanType";

export class MavenDependencies extends PackageDependenciesHelper implements PackageDependencies {
  Dependencies: Array<MavenPackage> = [];
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

  public ConvertToComponentEntry(resultEntry: any): string {
    let coordinates = new MavenCoordinate(resultEntry.component.componentIdentifier.coordinates.artifactId, 
      resultEntry.component.componentIdentifier.coordinates.groupId, 
      resultEntry.component.componentIdentifier.coordinates.version, 
      resultEntry.component.componentIdentifier.coordinates.extension);

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
            format: "maven",
            coordinates: {
              artifactId: d.Name,
              groupId: d.Group,
              version: d.Version,
              extension: d.Extension
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
        entry.componentIdentifier.coordinates.groupId +
        ":" +
        entry.componentIdentifier.coordinates.artifactId;

      let componentEntry = new ComponentEntry(
        packageId,
        entry.componentIdentifier.coordinates.version,
        ScanType.NexusIq
      );
      components.push(componentEntry);
      let coordinates = new MavenCoordinate(
        entry.componentIdentifier.coordinates.artifactId,
        entry.componentIdentifier.coordinates.groupId,
        entry.componentIdentifier.coordinates.version,
        entry.componentIdentifier.coordinates.extension
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
      let mavenUtils = new MavenUtils();
      this.Dependencies = await mavenUtils.getDependencyArray();
      Promise.resolve();
    }
    catch (e) {
      Promise.reject();
    }
  }
}
