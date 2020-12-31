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
import { ComposerPackage } from './ComposerPackage';

import { readFileSync } from 'fs';
import { join } from 'path';
import { PackageDependenciesHelper } from '../PackageDependenciesHelper';

export class ComposerUtils {
  public async getDependencyArray(): Promise<Array<ComposerPackage>> {
    try {
        const composerLockFile = readFileSync(join(PackageDependenciesHelper.getWorkspaceRoot(), "composer.lock"));
        const composerLock: ComposerLock = JSON.parse(composerLockFile.toString());
  
        if (composerLock.packages && composerLock.packages.length > 0) {
          let res: Array<ComposerPackage> = new Array();
          composerLock.packages.forEach((pkg) => {
            let namespaceName: string[] = pkg.name.split("/");
            let name: string = namespaceName[1];
            let namespace: string = namespaceName[0];
            res.push(new ComposerPackage(name, namespace, pkg.version, ""));
          });
  
          return Promise.resolve(res);
        }

        return Promise.reject("No dependencies found, check your poetry.lock file!");
    } catch(ex) {
        return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while parsing poetry dependencies: ${ex}`);
    }
  }
}

interface ComposerLock {
    packages: ComposerLockPackage[];
}

interface ComposerLockPackage {
    name: string;
    version: string;
}
