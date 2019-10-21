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

export class ComponentContainer {
  Implementation: Array<PackageDependencies>;

  // To add a new format, you just need to push another implementation to this list
  constructor() {
    this.Implementation.push(new MavenDependencies());
    this.Implementation.push(new NpmDependencies());
    this.Implementation.push(new GolangDependencies());
    this.Implementation.push(new PyPIDependencies());
  }

  public checkDependencyType(): PackageDependencies {
    this.Implementation.forEach(implementation => {
      if(implementation.CheckIfValid()) {
        return implementation;
      }
    });

    throw new TypeError("No valid implementation exists for workspace");
  }
}
