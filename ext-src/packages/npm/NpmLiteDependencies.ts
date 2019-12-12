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
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { NpmPackage } from "./NpmPackage";
import { NpmUtils } from "./NpmUtils";
import { NpmScanType, PACKAGE_LOCK_JSON, YARN_LOCK } from "./NpmScanType";
import { exec } from "../../utils/exec";
import { SupplementalInfo } from "../../types/SupplementalInfo";

export class NpmLiteDependencies implements LitePackageDependencies {
  dependencies: Array<NpmPackage> = [];
  format: string = "npm";
  manifestName: string = "package.json";
  private scanType: string = "";

  constructor() {
  }

  public checkIfValid(): boolean {
    this.scanType = PackageDependenciesHelper.checkIfValidWithArray(NpmScanType, this.format);
    return this.scanType === "" ? false : true;
  }

  public async packageForService(): Promise<any> {
    try {
      let npmUtils = new NpmUtils();
      this.dependencies = await npmUtils.getDependencyArray(this.scanType);

      Promise.resolve();
    }
    catch (e) {
      throw new TypeError(`There are problems, please check this error: ${e}`);
    }
  }

  public async getSupplementalInfo(pkg: any): Promise<SupplementalInfo> {
    if (this.scanType === PACKAGE_LOCK_JSON) {
        let { stdout, stderr } = await exec(`npm ls ${pkg.name}@${pkg.version}`, 
        { 
          cwd: PackageDependenciesHelper.getWorkspaceRoot()
        }
      );
      if (stdout === "" && stderr != "") {
        throw new TypeError(`Something went wrong with running npm ls: ${stderr}`);
      } else {
        return new SupplementalInfo(stdout, PACKAGE_LOCK_JSON);
      }
    }
    if (this.scanType === YARN_LOCK) {
      let { stdout, stderr } = await exec(`yarn list ${pkg.name}@${pkg.version}`, 
      { 
        cwd: PackageDependenciesHelper.getWorkspaceRoot()
      }
      );
      if (stdout === "" && stderr != "") {
        throw new TypeError(`Something went wrong with running yarn list: ${stderr}`);
      } else {
        return new SupplementalInfo(stdout, YARN_LOCK);
      }
    }
    else {
      throw new Error(`Not implemented for this type: ${this.scanType}`);
    }
  }
}
