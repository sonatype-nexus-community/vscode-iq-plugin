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
import { RubyGemsPackage } from './RubyGemsPackage';
import { RubyGemsUtils } from './RubyGemsUtils';
import { RubyGemsCoordinate } from './RubyGemsCoordinate';
import { PackageDependencies } from "../PackageDependencies";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { ScanType } from "../../types/ScanType";
import { ComponentEntry } from "../../models/ComponentEntry";

export class RubyGemsDependencies implements PackageDependencies {

  public async packageForIq(): Promise<any> {
    try {
      const rubyGemsUtils = new RubyGemsUtils();
      const deps = await rubyGemsUtils.getDependencyArray();
      return Promise.resolve(deps);
    }
    catch (e) {
      return Promise.reject(e);
    }
  }

  public CheckIfValid(): boolean {
    return PackageDependenciesHelper.checkIfValid('Gemfile.lock', 'rubygems');
  }

  public toComponentEntries(packages: Array<RubyGemsPackage>): Map<string, ComponentEntry> {
    let map = new Map<string, ComponentEntry>();
    for (let pkg of packages) {
      let componentEntry = new ComponentEntry(
        pkg.Name,
        pkg.Version,
        "gem",
        ScanType.NexusIq
      );
      let coordinates = new RubyGemsCoordinate(
        pkg.Name,
        pkg.Version
      );
      map.set(
        coordinates.asCoordinates(),
        componentEntry
      );
    }
    return map;
  }
}
