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
import { GolangPackage } from "./GolangPackage";
import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { GolangUtils } from "./GolangUtils";
import { GolangScanType, GO_MOD_SUM } from "./GolangScanType";
import { exec } from "../../utils/exec";
import { GolangDepGraph } from "./GolangDepGraph";

export class GolangLiteDependencies implements LitePackageDependencies {
  dependencies: Array<GolangPackage> = [];
  manifestName: string = "go.sum";
  format: string = "golang";
  private scanType: string = "";
  private graph: GolangDepGraph = new GolangDepGraph();
  
  public checkIfValid(): boolean {
    this.scanType =  PackageDependenciesHelper.checkIfValidWithArray(GolangScanType, this.format);
    return this.scanType === "" ? false : true;
  }

  public async packageForService(): Promise<any> {
    try {
      let golangUtils = new GolangUtils();
      this.dependencies = await golangUtils.getDependencyArray(this.scanType);

      Promise.resolve();
    }
    catch (e) {
      Promise.reject(e);
    }
  }

  public async getSupplementalInfo(pkg: any): Promise<any> {
    if (this.scanType === GO_MOD_SUM) {
      let { stdout, stderr } = await exec(`go mod graph`, 
        { 
          cwd: PackageDependenciesHelper.getWorkspaceRoot()
        }
      );
      if (stdout === "" && stderr != "") {
        throw new TypeError("Something went wrong with running go mod graph");
      } else {
        this.buildGraph(stdout.split("\n"));

        return "";
      }
    }
    else {
      throw new Error("Not implemented");
    }
  }

  private buildGraph(output: string[]) {
    output.forEach((x) => {
      let splitItem = x.split(" ");
      this.graph.addVertex(splitItem[0]);
      this.graph.addVertex(splitItem[1]);
      this.graph.addEdge(splitItem[0], splitItem[1]);
    })

    console.log("Hello");
  }
}
