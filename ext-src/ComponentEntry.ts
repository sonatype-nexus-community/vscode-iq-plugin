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

import { PolicyViolation } from "./PolicyViolation";
import { ScanType } from "./ScanType";

export class ComponentEntry {
  scope: string = "";
  failure: string = "";
  policyViolations: Array<PolicyViolation> = [];
  hash: string = "";
  nexusIQData: any = undefined;
  ossIndexData: any = undefined;

  constructor(readonly name: string, readonly version: string, readonly scanType: ScanType) {
  }

  public toString(): string {
    return `${this.name} @ ${this.version}`;
  }

  public maxPolicy(): number {
    let maxThreatLevel = 0;
    if (!this.policyViolations) {
      return maxThreatLevel;
    }
    if (this.policyViolations && this.policyViolations.length > 0) {
      maxThreatLevel = this.policyViolations.reduce(
        (prevMax: number, a: PolicyViolation) => {
          console.log(a);
          return a.threatLevel > prevMax ? a.threatLevel : prevMax;
        },
        0
      );
    }
    return maxThreatLevel;
  }
  public iconName(): string {
    console.log(`iconName called for ${this.toString()}`, this);
    if (!this.policyViolations || !this.nexusIQData) {
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
