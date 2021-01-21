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
import { BaseRequestService } from "./BaseRequestService";
import { ThirdPartyAPIResponse } from './ThirdPartyApiResponse';
import { ReportResponse } from './ReportResponse';
import { VulnerabilityResponse } from './VulnerabilityResponse';
import { RemediationResponse } from './RemediationResponse';
import { ComponentDetails } from './ComponentDetails';
import { PackageURL } from 'packageurl-js';

export interface RequestService extends BaseRequestService {
  getApplicationId(applicationPublicId: string): Promise<string>;
  submitToThirdPartyAPI(sbom: string, applicationInternalId: string): Promise<string>;
  getReportResults(reportID: string, applicationPublicId: string): Promise<ReportResponse>;
  asyncPollForEvaluationResults(statusURL: string): Promise<ThirdPartyAPIResponse>;
  getAllVersionDetails(versions: Array<string>, purl: PackageURL): Promise<ComponentDetails>;
  getAllVersions(purl: PackageURL): Promise<Array<string>>;
  getVulnerabilityDetails(vulnID: string): Promise<VulnerabilityResponse>;
  getRemediation(purl: string): Promise<RemediationResponse>;
  showSelectedVersion(purl: string): Promise<ComponentDetails>
  setUrl(user: string): void;
  setUser(user: string): void;
  setPassword(password: string): void;
  isPasswordSet(): boolean;
  setApplicationId(s: string): void;
  getApplicationInternalId(): string;
}
