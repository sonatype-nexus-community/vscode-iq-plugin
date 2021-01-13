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
import * as React from 'react';
import { ExtScanType } from '../utils/ExtScanType';
import { VulnerabilityDetails } from './VulnerabilityResponse';

export interface VersionsContextInterface {
  scanType?: ExtScanType,
  allVersions: any[],
  component: any,
  selectedVersionDetails?: any,
  selectedVersion: string,
  initialVersion: string,
  remediation?: any,
  vulnDetails?: VulnerabilityDetails | undefined,
  policyViolations?: any[],
  handleGetRemediation(o: any, s: string): void
}

const ctxt = React.createContext<VersionsContextInterface | undefined>(undefined);

export const VersionsContextProvider = ctxt.Provider;

export const VersionsContext = ctxt;
