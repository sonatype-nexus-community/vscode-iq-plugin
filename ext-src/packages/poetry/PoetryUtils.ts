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
import { PyPIPackage } from '../pypi/PyPIPackage';

import { parse } from 'toml';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PackageDependenciesHelper } from '../PackageDependenciesHelper';

export class PoetryUtils {
  public async getDependencyArray(): Promise<Array<PyPIPackage>> {
    try {
        const toml = readFileSync(join(PackageDependenciesHelper.getWorkspaceRoot(), "poetry.lock"));
        const poetry: Poetry = parse(toml.toString());

        if (poetry.package && poetry.package.length > 0) {
          let res: Array<PyPIPackage> = new Array();

          poetry.package.forEach(pkg => {
            res.push(new PyPIPackage(pkg.name, pkg.version, "tar.gz", ""));
          });

          return Promise.resolve(res);
        }

        return Promise.reject("No dependencies found, check your poetry.lock file!");
    } catch(ex) {
        return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while parsing poetry dependencies: ${ex}`);
    }
  }
}

interface Poetry {
  metadata: Object;
  package: Package[];
}

interface Package {
  category: string;
  description: string;
  name: string;
  version: string;
  optional: boolean;
  "python-versions": string;
}
