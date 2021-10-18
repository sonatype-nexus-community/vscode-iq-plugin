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
import { Readable } from 'stream';
import parser from 'stream-json';
import { streamValues } from 'stream-json/streamers/StreamValues';
import { parse } from 'toml';
import { Application } from "../../models/Application";
import { exec } from "../../utils/exec";
import { GolangPackage } from "./GolangPackage";
import { DEP_LOCK, GO_MOD_SUM } from "./GolangScanType";


export class GolangUtils {
  public async getDependencyArray(application: Application, scanType: string): Promise<Array<GolangPackage>> {
    try {
      if (scanType === GO_MOD_SUM) {

        // TODO: When running this command, Golang is now using the workspace root to establish a GOCACHE, 
        // we should use some other temporary area or try and suss out the real one
        let { stdout, stderr } = await exec(`go list -m -json all`, {
          cwd: application.workspaceFolder,
          env: {
            "PATH": process.env["PATH"],
            "HOME": this.getGoCacheDirectory()
          }
        });

        if (stdout != "" && stderr === "") {
          const golangDeps = await this.parseGoModDependencies(Readable.from(stdout));

          return Promise.resolve(golangDeps);
        } else {
          return Promise.reject(
            new Error(
              "Error occurred in generating dependency tree. Please check that golang is on your PATH."
            )
          );
        }
      }

      if (scanType === DEP_LOCK) {
        let goPkgLockPath: string = join(application.workspaceFolder, DEP_LOCK);
        let goPkgContents: string = readFileSync(goPkgLockPath, "utf8");
        let depList: any = parse(goPkgContents);

        return Promise.resolve(this.parseGolangDepDependencies(depList.projects));
      } else {
        return Promise.reject("Type not implemented");
      }
    } catch (e) {
      return Promise.reject(
        "go list -m all failed, please try running locally to see why: " +
        e.message
      );
    }
  }

  private getGoCacheDirectory(): string {
    // TODO: This will only work on OS X/Linux, need to find a valid GOCACHE dir and set it for Windows
    return "/tmp/gocache/";
  }

  private parseGoModDependencies(readable: Readable): Promise<Array<GolangPackage>> {
    return new Promise((resolve, reject) => {
      let golangPackages = new Array<GolangPackage>();

      readable
        .pipe(parser({ jsonStreaming: true }))
        .pipe(streamValues())
        .on('data', ({ key, value }: any) => {
          const dep = value as GoModDependency;

          let version = dep.Version;
          if (dep.Replace) {
            version = dep.Replace.Version;
          }

          if (version) {
            const pkg = new GolangPackage(dep.Path, version);

            golangPackages.push(pkg);
          }
        })
        .on('error', (err: any) => {
          reject(err);
        })
        .on('end', () => {
          resolve(golangPackages);
        });
    });
  }

  private parseGolangDepDependencies(projectList: [any]): Array<GolangPackage> {
    let dependencyList: GolangPackage[] = [];

    projectList.forEach((project) => {
      if (project.version && project.name) {
        dependencyList.push(new GolangPackage(project.name, project.version));
      }
    });

    return dependencyList;
  }
}

export interface GoModDependency {
  Path: string;
  Version?: string;
  Replace?: Replace;
  Indirect: boolean;
  Dir: string;
  GoMod: string;
  GoVersion: string;
}

export interface Replace {
  Path: string;
  Version: string;
  Time: Date;
  Dir: string;
  GoMod: string;
  GoVersion: string;
}
