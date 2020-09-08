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

import { ComposerPackage } from "./ComposerPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../models/ComponentEntry";
import { ComposerCoordinate } from "./ComposerCoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RequestService } from "../../services/RequestService";
import { ComposerUtils } from "./ComposerUtils";
import { ScanType } from "../../types/ScanType";

export class ComposerDependencies
  extends PackageDependenciesHelper
  implements PackageDependencies {
  Dependencies: Array<ComposerPackage> = [];
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
    if (
      PackageDependenciesHelper.doesPathExist(
        PackageDependenciesHelper.getWorkspaceRoot(),
        "composer.json"
      )
    ) {
      console.debug("Valid for PHP Composer");
      return true;
    }
    return false;
  }

  public ConvertToComponentEntry(resultEntry: any): string {
    let coordinates = new ComposerCoordinate(
      resultEntry.component.componentIdentifier.coordinates.namespace + '/' + resultEntry.component.componentIdentifier.coordinates.name,
      resultEntry.component.componentIdentifier.coordinates.version
    );

    return coordinates.asCoordinates();
  }

  public convertToNexusFormat() {
    return {
      components: _.map(this.Dependencies, (d) => ({
        packageUrl: d.toPurl() ,
      })),
    };
  }

  public toComponentEntries(data: any): Array<ComponentEntry> {
    let components = new Array<ComponentEntry>();
    for (let entry of data.components) {
      const purl: string = entry.packageUrl;
      const parts: string[] = purl.substr(13, purl.length).split("@");
      const packageId = parts[0];

      const version: string = parts[1].split("?")[0];

      let componentEntry = new ComponentEntry(
        packageId,
        version,
        ScanType.NexusIq
      );
      components.push(componentEntry);
      let coordinates = new ComposerCoordinate(parts[0], version);
      this.CoordinatesToComponents.set(
        coordinates.asCoordinates(),
        componentEntry
      );
    }
    return components;
  }

  public async packageForIq(): Promise<any> {
    try {
      let composerUtils = new ComposerUtils();
      this.Dependencies = await composerUtils.getDependencyArray();
      Promise.resolve();
    } catch (e) {
      Promise.reject();
    }
  }
}
