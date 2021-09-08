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
import { ReportComponent } from "../services/ReportResponse";
import { PolicyViolation } from "../types/PolicyViolation";
import { ScanType } from "../types/ScanType";
import { Application } from "./Application";
import { TreeableModel } from "./TreeableModel";


export class ComponentEntry implements TreeableModel {
  scope: string = "";
  failure: string = "";
  policyViolations: Array<PolicyViolation> = [];
  hash: string = "";
  nexusIQData?: NexusIQData = undefined;
  ossIndexData?: any = undefined;

  constructor(readonly name: string, readonly version: string, readonly format: string, readonly scanType: ScanType, readonly application: Application) { }

  public getLabel(): string {
    return this.toString();
  }

  public hasChildren(): boolean {
    return false;
  }

  public getTooltip(): string {
    return `Name: ${this.name}\nVersion: ${this.version}\nHash: ${this.hash}\nPolicy: ${this.maxPolicy()}`;
  }

  public toString(): string {
    return `${this.application.name}: ${this.format}: ${this.name} @ ${this.version}`;
  }

  public maxPolicy(): number {
    let maxThreatLevel = 0;
    if (this.scanType == ScanType.NexusIq) {
      if (!this.policyViolations) {
        return maxThreatLevel;
      }
      if (this.policyViolations && this.policyViolations.length > 0) {
        maxThreatLevel = this.policyViolations.reduce(
          (prevMax: number, a: PolicyViolation) => {
            return a.policyThreatLevel > prevMax ? a.policyThreatLevel : prevMax;
          },
          0
        );
      }
    } else if (this.scanType == ScanType.OssIndex) {
      if (!this.ossIndexData.vulnerabilities) {
        return maxThreatLevel;
      }
      if (this.ossIndexData.vulnerabilities.length > 0) {
        maxThreatLevel = this.ossIndexData.vulnerabilities.reduce(
          (prevMax: number, a: any) => {
            return a.cvssScore > prevMax ? a.cvssScore : prevMax;
          },
          0
        );
      }
    }
    return maxThreatLevel;
  }

  public iconName(): string {
    if ((this.scanType == ScanType.NexusIq && (!this.policyViolations || !this.nexusIQData)) ||
      (this.scanType == ScanType.OssIndex && !this.ossIndexData)) {
      return "loading.gif";
    }
    let maxThreatLevel = this.maxPolicy();

    // TODO what is the right way to display threat level graphically?
    if (maxThreatLevel >= 8) {
      return `threat-critical.png`;
    } else if (maxThreatLevel >= 4) {
      return `threat-severe.png`;
    } else if (maxThreatLevel >= 2) {
      return `threat-moderate.png`;
    } else if (maxThreatLevel >= 1) {
      return `threat-low.png`;
    } else {
      return `threat-none.png`;
    }
  }
}

export interface NexusIQData {
  component: ReportComponent
}
