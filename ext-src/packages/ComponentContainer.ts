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
import { PackageDependencies } from "./PackageDependencies";
import { MavenDependencies } from "./maven/MavenDependencies";
import { NpmDependencies } from "./npm/NpmDependencies";
import { GolangDependencies } from "./golang/GolangDependencies";
import { PyPIDependencies } from "./pypi/PyPIDependencies";
import { RequestService } from "../services/RequestService";

export class ComponentContainer {
  Possible: Array<PackageDependencies> = [];
  Valid: Array<PackageDependencies> = [];
  PackageMuncher: PackageDependencies | undefined;

  constructor(private requestService: RequestService) {

    // To add a new format, you just need to push another implementation to this list
    this.Possible.push(new MavenDependencies(this.requestService));
    this.Possible.push(new NpmDependencies(this.requestService));
    this.Possible.push(new GolangDependencies(this.requestService));
    this.Possible.push(new PyPIDependencies(this.requestService));

    // Bit of an odd side effect, if a project has multiple dependency types, the PackageMuncher will get set to the last one it encounters currently
    this.Possible.forEach(i => {
      if(i.CheckIfValid()) {
        this.Valid.push(i);
      }
    });

    if (this.Valid.length != 0) {
      console.debug("Package Muncher set");
    } else {
      throw new TypeError("No valid implementation exists for workspace");
    }
  }
}
