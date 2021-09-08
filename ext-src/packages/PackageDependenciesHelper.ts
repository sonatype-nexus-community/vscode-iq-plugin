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
import { Extension, extensions, workspace } from "vscode";
import { Application } from "../models/Application";

export class PackageDependenciesHelper {
  public static doesPathExist(workspaceRoot: string, filename: string): boolean {
    return this.pathExists(path.join(workspaceRoot, filename));
  }

  private static pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
      return true;
    } catch (err) {
      return false;
    }
  }

  public static getWorkspaceRoot(): string {
    // TODO: This is mostly to address a deprecation warning on using rootPath
    // VS Code plans to allow multiple folders to be opened as multiple workspaces in
    // the future, so we will need to address this in a more robust way
    let workspaceRoot = workspace.workspaceFolders;
    if (workspaceRoot === undefined) {
      throw new TypeError("No workspaces opened");
    }
    return workspaceRoot[0].uri.fsPath;
  }

  public static getExtensionPath(): string {
    console.debug("Getting extension path");
    let extension: Extension<any> | undefined = extensions.getExtension("SonatypeCommunity.vscode-iq-plugin");
    if (extension != undefined) {
      return extension.extensionPath;
    } else {
      throw new TypeError("No extension found");
    }
  }

  public static checkIfValid(manifest: string, format: string, application: Application): boolean {
    if (this.doesPathExist(application.workspaceFolder, manifest)) {
      console.debug(`Valid for ${format} - found ${manifest} inside Application Folder ${application.workspaceFolder}`);
      return true;
    }
    return false;
  }

  public static checkIfValidWithArray(manifests: Array<string>, format: string, application: Application): string {
    let result: string = "";
    manifests.forEach((element) => {
      if (this.doesPathExist(application.workspaceFolder, element)) {
        console.debug(`Valid for ${format} - found ${element} inside Application Folder ${application.workspaceFolder}`);
        result = element;
      }
    })

    return result;
  }

  public static checkIfValidWithExclusion(extension: string, format: string, exclusions: string[], application: Application): boolean {
    let dirCont = fs.readdirSync(application.workspaceFolder);

    let files = dirCont.filter((file) => {
      return !exclusions.includes(file) && file.endsWith(extension);
    });

    if (files && files.length > 0) {
      return true;
    }
    return false;
  }
}
