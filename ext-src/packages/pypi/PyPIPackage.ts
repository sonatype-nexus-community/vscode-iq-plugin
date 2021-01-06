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
import { PackageURL } from 'packageurl-js';

export class PyPIPackage implements PackageType {
  constructor(
    readonly Name: string,
    readonly Version: string,
    readonly Extension: string,
    readonly Qualifier: string,
    readonly Hash?: string
  ) {}

  public toCoordinates() {
    return `${this.Name}:${this.Extension}:${this.Qualifier}:${this.Version}`;
  }

  public toPurl() {
    let purl: PackageURL = new PackageURL("pypi", "", this.Name, this.Version, {"extension": this.Extension}, "");
    console.debug(purl);
    return purl.toString();
  }

  public toCoordValueType(): string {
    return `${this.Name} - ${this.Extension} - ${this.Qualifier} - ${this.Version}`;
  }
}
