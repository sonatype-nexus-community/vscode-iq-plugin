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
import { PyPIPackage } from '../pypi/PyPIPackage';


export class PoetryUtils {
  public async getDependencyArray(application: Application, includeDev: boolean = true): Promise<Array<PyPIPackage>> {
    try {
      const toml = readFileSync(join(application.workspaceFolder, "poetry.lock"));
      const poetry: Poetry = parse(toml.toString());

      let pyprojectToml;
      let isPyprojectTomlExists = false;

      try {
        pyprojectToml = readFileSync(join(application.workspaceFolder, "pyproject.toml"));
        isPyprojectTomlExists = true;
      }
      catch (ignored) {}

      let productionDependencies: Set<string> = new Set<string>();
      if (isPyprojectTomlExists && !includeDev) {
        // if pyprojecttoml exists, derive !dev dependencies from this file
        productionDependencies = this.extracted(pyprojectToml, poetry);
      }

      if (poetry.package && poetry.package.length > 0) {
        let res: Array<PyPIPackage> = new Array();

        poetry.package.forEach(pkg => {
          if (!includeDev) {
            if (pkg.category == 'dev') {
              return;
            }
            if (isPyprojectTomlExists && !productionDependencies.has(pkg.name.toLowerCase())) {
              return;
            }
          }
          res.push(new PyPIPackage(pkg.name, pkg.version, "tar.gz", ""));
        });

        return Promise.resolve(res);
      }

      return Promise.reject("No dependencies found, check your poetry.lock file!");
    } catch (ex) {
      return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while parsing poetry dependencies: ${ex}`);
    }
  }

  private extracted(pyprojectToml: Buffer, poetry: Poetry): Set<string> {
    const pyProject = parse(pyprojectToml.toString());

    let productionDirectDependencies = Object.keys(pyProject?.tool?.poetry?.dependencies);
    productionDirectDependencies = productionDirectDependencies.filter(value => value !== 'python');

    // Resolve dependency for all components found in the poetry.lock file
    let packageDependencyMap = new Map();
    for (let poetryPackage of poetry.package) {
      let poetryPackageDependencies = poetryPackage.dependencies;
      packageDependencyMap.set(poetryPackage.name.toLowerCase(),
        poetryPackageDependencies ? Object.keys(poetryPackageDependencies) : [])
    }

    let productionDependencies = new Set<string>();
    for (let productionDirectDependency of productionDirectDependencies) {
      this.resolveRecursively(productionDependencies, productionDirectDependency, packageDependencyMap);
    }

    return productionDependencies;
  }

  private resolveRecursively(productionDependencies: Set<any>, packageName: string, packageDependencyMap: Map<any, any>) {
    productionDependencies.add(packageName.toLowerCase());
    let dependencies = packageDependencyMap.get(packageName.toLowerCase());
    if (!dependencies) {
      return;
    }

    for (let dependency of dependencies) {
      if (!productionDependencies.has(dependency)) {
        this.resolveRecursively(productionDependencies, dependency, packageDependencyMap);
      }
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
  dependencies: Object[];
}
