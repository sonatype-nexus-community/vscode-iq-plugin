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

export class MavenPackage implements PackageType {
  constructor(
    readonly Name: string,
    readonly Group: string,
    readonly Version: string,
    readonly Extension: string,
    readonly Hash?: string
  ) {}

  public toPurl() {
    let purl: PackageURL = new PackageURL(
      "maven", this.Group, this.Name, this.Version, {"type": this.Extension}, undefined);
    return purl.toString();
  }
}
