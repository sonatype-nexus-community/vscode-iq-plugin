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
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'toml';
import { Application } from '../../models/Application';
import { CargoPackage } from './CargoPackage';

export class CargoUtils {
  public async getDependencyArray(application: Application): Promise<Array<CargoPackage>> {
    try {
      const cargoLockFile = readFileSync(join(application.workspaceFolder, "Cargo.lock"));
      const cargoLock: CargoLock = parse(cargoLockFile.toString());

      if (cargoLock.package && cargoLock.package.length > 0) {
        let res: Array<CargoPackage> = new Array();
        cargoLock.package.forEach((pkg) => {
          res.push(new CargoPackage(pkg.name, pkg.version, ""));
        });

        return Promise.resolve(res);
      }

      return Promise.reject("No dependencies found, check your Cargo.lock file!");
    } catch (ex) {
      return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while parsing Cargo dependencies: ${ex}`);
    }
  }
}

interface CargoLock {
  package: CargoLockPackage[];
}

interface CargoLockPackage {
  name: string;
  version: string;
}
