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
import { CoordinateType } from '../CoordinateType';

export class PyPICoordinate implements CoordinateType {
  Name: string;
  Version: string;
  Extension: string;
  Qualifier: string;
 
  constructor (name: string, version: string, extension: string, qualifier: string){
    this.Name = name;
    this.Version = version;
    this.Extension = extension;
    this.Qualifier = qualifier;
  }

  public asCoordinates(): string {
    return `pypi - ${this.Name} - ${this.Extension} - ${this.Qualifier} - ${this.Version}`.toLowerCase();
  }
}
