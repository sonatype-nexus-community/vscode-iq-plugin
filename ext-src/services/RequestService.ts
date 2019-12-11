import { BaseRequestService } from "./BaseRequestService";

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
export interface RequestService extends BaseRequestService {
  getApplicationId(applicationPublicId: string): Promise<string>;
  submitToIqForEvaluation(data: any, applicationInternalId: string): Promise<any>;
  asyncPollForEvaluationResults(applicationInternalId: string, resultId: string): Promise<any>;
  getAllVersions(component: any, iqApplicationPublicId: string): Promise<any>;
  getCVEDetails(cve: any, nexusArtifact: any): Promise<any>;
  getRemediation(nexusArtifact: any, iqApplicationId: string): Promise<any>;
  showSelectedVersion(componentIdentifier: any, version: string): Promise<any>
  setPassword(password: string): void;
  isPasswordSet(): boolean;
  setApplicationId(s: string): void;
  getApplicationInternalId(): string;
}
