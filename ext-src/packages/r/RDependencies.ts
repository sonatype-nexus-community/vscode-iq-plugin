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
import { RPackage } from "./RPackage";
import { RUtils } from './RUtils';
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { PackageDependencies } from "../PackageDependencies";
import { ComponentEntry } from "../../models/ComponentEntry";
import { PackageType } from "../PackageType";
import { PackageDependenciesOptions } from "../PackageDependenciesOptions";

export class RDependencies implements PackageDependencies {
  
  constructor(private options: PackageDependenciesOptions) {}

  format: string = "r";
  manifestName: string = ".Rbuildignore";

  public checkIfValid(): boolean {
    return PackageDependenciesHelper.checkIfValid(this.manifestName, this.format);
  }

  toComponentEntries(data: PackageType[]): Map<string, ComponentEntry> {
    throw new Error("Method not implemented.");
  }

  public async packageForService(): Promise<Array<RPackage>> {
    try {
      const rUtils = new RUtils();
      const deps = await rUtils.getDependencyArray();

      return Promise.resolve(deps);
    }
    catch (ex) {
      return Promise.reject(ex);
    }
  }
}
