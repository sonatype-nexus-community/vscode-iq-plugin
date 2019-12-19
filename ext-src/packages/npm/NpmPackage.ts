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
import { PackageType } from "../PackageType";

export class NpmPackage implements PackageType {
  Hash: string;
  Name: string;
  Version: string;
  IsTransitive: boolean;
  DependencyType: string;

  constructor(
    name: string,
    version: string,
    hash: string,
    isTransitive?: boolean,
    dependencyType?: string
  ) {
    this.Hash = hash;
    this.Name = name;
    this.Version = version;
    this.DependencyType = dependencyType || "";
    this.IsTransitive = isTransitive || true;
  }

  public toCoordinates() {
    return `${this.Name}@${this.Version}`;
  }

  public toPurl() {
    return `pkg:npm/${this.Name.replace("@", "")}@${this.Version}`;
  }

  public toCoordValueType(): string {
    return `${this.Name} - ${this.Version}`;
  }

  public toString(): string {
    return `${this.Name} - ${this.Version}`;
  }
}
