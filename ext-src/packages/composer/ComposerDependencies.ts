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
import { ComposerPackage } from "./ComposerPackage";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../models/ComponentEntry";
import { ComposerCoordinate } from "./ComposerCoordinate";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { ScanType } from "../../types/ScanType";
import { ComposerUtils } from "./ComposerUtils";

/**
* @class ComposerDependencies
*/
export class ComposerDependencies extends PackageDependenciesHelper implements PackageDependencies {

  public CheckIfValid(): boolean {
    return PackageDependenciesHelper.checkIfValid("composer.lock", "composer");
  }

  public toComponentEntries(packages: Array<ComposerPackage>): Map<string, ComponentEntry> {
    let map = new Map<string, ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Group + ":" + pkg.Name,
        pkg.Version,
        "composer",
        ScanType.NexusIq
      );
      let coordinates = new ComposerCoordinate(
        pkg.Name,
        pkg.Group,
        pkg.Version
      );
      map.set(
        coordinates.asCoordinates(),
        componentEntry
      );
    }
    return map;
  }

  public async packageForIq(): Promise<Array<ComposerPackage>> {
    try {
      const composerUtils = new ComposerUtils();
      const deps = await composerUtils.getDependencyArray();

      return Promise.resolve(deps);
    } catch (ex) {
      return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while parsing your composer.lock file: ${ex}`);
    }
  }
}
