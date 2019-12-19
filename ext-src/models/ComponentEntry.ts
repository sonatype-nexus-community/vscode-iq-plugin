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

import { PolicyViolation } from "../types/PolicyViolation";
import { ScanType } from "../types/ScanType";

export class ComponentEntry {
  scope: string = "";
  failure: string = "";
  policyViolations: Array<PolicyViolation> = [];
  hash: string = "";
  nexusIQData: any = undefined;
  ossIndexData: any = undefined;
  dependencyType: string = "";
  isTransitive: boolean = true;

  constructor(
    readonly name: string,
    readonly version: string,
    readonly scanType: ScanType
  ) {}

  public toString(): string {
    return `${this.name} @ ${this.version}`;
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
            return a.threatLevel > prevMax ? a.threatLevel : prevMax;
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
    if (
      (this.scanType == ScanType.NexusIq &&
        (!this.policyViolations || !this.nexusIQData)) ||
      (this.scanType == ScanType.OssIndex && !this.ossIndexData)
    ) {
      return "loading.gif";
    }
    let maxThreatLevel = this.maxPolicy();

    // TODO what is the right way to display threat level graphically?
    if (maxThreatLevel >= 8) {
      return `threat-critical.png`;
    } else if (maxThreatLevel >= 7) {
      return `threat-severe.png`;
    } else if (maxThreatLevel >= 5) {
      return `threat-moderate.png`;
    } else if (maxThreatLevel >= 1) {
      return `threat-low.png`;
    } else {
      return `threat-none.png`;
    }
  }
}
