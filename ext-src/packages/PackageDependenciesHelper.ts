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
import * as fs from "fs";
import * as path from "path";
import { workspace } from "vscode";

export class PackageDependenciesHelper {
  public doesPathExist(workspaceRoot: string, filename: string): boolean {
    return this.pathExists(path.join(workspaceRoot, filename));
  }
 
  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
      return true;
    } catch (err) {
      return false;
    }
  }

  public getWorkspaceRoot(): string {
    let workspaceRoot = workspace.rootPath;
    if (workspaceRoot === undefined) {
      throw new TypeError("No workspace opened");
    }
    return workspaceRoot;
  } 
}