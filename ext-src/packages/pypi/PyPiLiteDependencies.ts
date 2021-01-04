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
import { LitePackageDependencies } from "../LitePackageDependencies";
import { PyPIPackage } from "./PyPIPackage";
import { PyPiUtils } from './PyPiUtils';
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";

export class PyPiLiteDependencies implements LitePackageDependencies {
  dependencies: Array<PyPIPackage> = [];
  format: string = "pypi";
  manifestName: string = "requirements.txt";

  public checkIfValid(): boolean {
    return "" != PackageDependenciesHelper.checkIfValidWithArray(["Pipefile.lock", this.manifestName], this.format);
  }

  public async packageForService(): Promise<any> {
    try {
      let pypiUtils = new PyPiUtils();
      this.dependencies = await pypiUtils.getDependencyArray();

      Promise.resolve();
    }
    catch (e) {
      Promise.reject(e);
    }
  }
}
