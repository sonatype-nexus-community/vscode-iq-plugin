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
import { extensions, version } from "vscode";
import * as os from 'os';

export class RequestHelpers {
  public static getUserAgentHeader() {
    let nodeVersion = process.versions;
    let environment = 'NodeJS';
    let environmentVersion = nodeVersion.node;
    let system = `${os.type()} ${os.release()}`;

    return { 'User-Agent': `Nexus_IQ_Visual_Studio_Code/${this.getExtensionVersion()} (${environment} ${environmentVersion}; ${system}; VSCode: ${version})` };
  }

  private static getExtensionVersion() {
    let extension = extensions.getExtension('SonatypeCommunity.vscode-iq-plugin');
    if (extension != undefined) {
      return extension.packageJSON.version;
    } else {
      return "0.0.0"
    }
  }
}
