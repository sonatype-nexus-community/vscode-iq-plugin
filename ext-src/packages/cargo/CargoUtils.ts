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
import { CargoPackage } from './CargoPackage';

import { readFileSync } from 'fs';
import { join } from 'path';
import { PackageDependenciesHelper } from '../PackageDependenciesHelper';

export class CargoUtils {
  public async getDependencyArray(): Promise<Array<CargoPackage>> {
    try {
        const cargoLockFile = readFileSync(join(PackageDependenciesHelper.getWorkspaceRoot(), "cargo.lock"));
        const cargoLock: CargoLock = JSON.parse(cargoLockFile.toString());
  
        if (cargoLock.packages && cargoLock.packages.length > 0) {
          let res: Array<CargoPackage> = new Array();
          cargoLock.packages.forEach((pkg) => {
            let namespaceName: string[] = pkg.name.split("/");
            let name: string = namespaceName[1];
            let namespace: string = namespaceName[0];
            res.push(new CargoPackage(name, namespace, pkg.version, ""));
          });
  
          return Promise.resolve(res);
        }

        return Promise.reject("No dependencies found, check your Cargo.lock file!");
    } catch(ex) {
        return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while parsing Cargo dependencies: ${ex}`);
    }
  }
}

interface CargoLock {
    packages: CargoLockPackage[];
}

interface CargoLockPackage {
    name: string;
    version: string;
}
