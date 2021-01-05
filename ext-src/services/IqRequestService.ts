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
import fetch from 'node-fetch';
import { Headers } from 'node-fetch';
import * as HttpStatus from 'http-status-codes';
import { RequestService } from "./RequestService";
import { RequestHelpers } from "./RequestHelpers";
import { Agent as HttpsAgent }  from "https";
import { Agent } from 'http';
import { ILogger, LogLevel } from '../utils/Logger';

export class IqRequestService implements RequestService {
  readonly evaluationPollDelayMs = 2000;
  private agent: Agent;
  applicationId: string = "";

  constructor(
    private url: string,
    private user: string,
    private password: string,
    private getmaximumEvaluationPollAttempts: number,
    private strictSSL: boolean = true,
    readonly logger: ILogger
  ) 
  {
    this.agent = this.getAgent(this.strictSSL);
    if (url.endsWith("/")) {
      this.url = url.replace(/\/$/, "");
    }
  }

  public setPassword(password: string) {
    this.password = password;
  }

  public isPasswordSet(): boolean {
    if(this.password == "") {
      return false;
    }
    return true;
  }

  public setApplicationId(applicationId: string) {
    this.applicationId = applicationId;
  }

  public getApplicationInternalId(): string {
    return this.applicationId;
  }

  public getApplicationId(applicationPublicId: string): Promise<string> {
    this.logger.log(LogLevel.TRACE, `Getting application ID from public ID: ${applicationPublicId}`);

    return new Promise((resolve, reject) => {
      fetch(
        `${this.url}/api/v2/applications?publicId=${applicationPublicId}`, 
        {
          method: 'GET',
          headers: this.getHeaders(),
          agent: this.agent
        }).then(async (res) => {
          if (res.ok) {
            let json = await res.json();
            resolve(JSON.stringify(json));
          }
          reject(res.status);
        }).catch((ex) => {
          reject(ex);
        });
    });
  }

  public async submitToIqForEvaluation(
    data: any,
    applicationInternalId: string
  ): Promise<string> {
    this.logger.log(LogLevel.TRACE, `Data submitting to IQ Server`, data);
    return new Promise((resolve, reject) => {
      fetch(
        `${this.url}/api/v2/evaluation/applications/${applicationInternalId}`, 
        {
          method: 'POST',
          agent: this.agent,
          body: JSON.stringify(data),
          headers: this.getHeadersWithApplicationJsonContentType()
        }).then(async (res) => {
          if(res.ok) {
            let json = await res.json();
            resolve(json.resultId);
          }
          let body = await res.text();
          this.logger.log(
            LogLevel.TRACE, 
            `Non 200 response from IQ Server on submitting to 3rd Party API`, 
            body, 
            res.status
            );
          reject(res.status);
        }).catch((ex) => {
          reject(ex);
        });
    });
  }

  public async asyncPollForEvaluationResults(
    applicationInternalId: string,
    resultId: string
  ) {
    return new Promise((resolve, reject) => {
      this.pollForEvaluationResults(
        applicationInternalId,
        resultId,
        body => resolve(body),
        (statusCode, message) =>
          reject(
            `Could not fetch evaluation result, code ${statusCode}, message ${message}`
          )
      );
    });
  }

  public pollForEvaluationResults(
    applicationInternalId: string,
    resultId: string,
    success: (body: string) => any,
    failed: (statusCode: number, message: string) => any
  ) {
    let _this = this;
    let pollAttempts = 0;

    let successHandler = function(value: string) {
      success(value);
    };
    let errorHandler = function(statusCode: number, message: string) {
      if (statusCode === HttpStatus.NOT_FOUND) {
        // report still being worked on, continue to poll
        pollAttempts += 1;
        // TODO use the top-level class constant, but references are failing
        if (pollAttempts >= _this.getmaximumEvaluationPollAttempts) {
          failed(statusCode, "Poll limit exceeded, try again later");
        } else {
          setTimeout(() => {
            _this.getEvaluationResults(
              applicationInternalId,
              resultId,
              successHandler,
              errorHandler
            );
          }, _this.evaluationPollDelayMs);
        }
      } else {
        failed(statusCode, message);
      }
    };
    this.getEvaluationResults(
      applicationInternalId,
      resultId,
      successHandler,
      errorHandler
    );
  }

  public getEvaluationResults(
    applicationInternalId: string,
    resultId: string,
    resolve: (body: string) => any,
    reject: (statusCode: number, message: string) => any
  ) {
    fetch(
      `${this.url}/api/v2/evaluation/applications/${applicationInternalId}/results/${resultId}`, 
      {
        method: 'GET',
        headers: this.getHeaders(),
        agent: this.agent
      }).then(async (res) => {
        if (!res.ok) {
          reject(res.status, 'uhh');
          return;
        }
        if (res.status == 404) {
          reject(res.status, 'Polling');
          return;
        }
        let json = await res.json();
        resolve(JSON.stringify(json));
      }).catch((ex) => {
        reject(ex, 'big issue');
      });
  }

  public async getRemediation(nexusArtifact: any) {
    return new Promise((resolve, reject) => {
      this.logger.log(LogLevel.TRACE, `Begin Get Remediation`);
      var requestdata = nexusArtifact.component;
      this.logger.log(LogLevel.TRACE, `Begin Sending Request Data`);
      let url = `${this.url}/api/v2/components/remediation/application/${this.applicationId}`;

      fetch(
        url, 
        {
          method: 'POST',
          headers: this.getHeadersWithApplicationJsonContentType(),
          body: JSON.stringify(requestdata),
          agent: this.agent
        }).then(async (res) => {
          if (res.ok) {
            resolve(await res.json());
          }
          reject(res.status);
        }).catch((ex) => {
          reject(ex);
        });
    });
  }

  public async getCVEDetails(cve: any, nexusArtifact: any) {
    return new Promise((resolve, reject) => {
      this.logger.log(LogLevel.TRACE, `Begin Get CVE Details`);
      let timestamp = Date.now();
      let hash = nexusArtifact.component.hash;
      let componentIdentifier = this.encodeComponentIdentifier(
        nexusArtifact.component.componentIdentifier
      );
      let vulnerability_source;
      if (cve.search("sonatype") >= 0) {
        vulnerability_source = "sonatype";
      } else {
        vulnerability_source = "cve";
      }
      let url = `${this.url}/rest/vulnerability/details/${vulnerability_source}/${cve}?componentIdentifier=${componentIdentifier}&hash=${hash}&timestamp=${timestamp}`;

      fetch(
        url,
        {
          method: 'GET',
          headers: this.getHeaders(),
          agent: this.agent
        }).then(async (res) => {
          if (res.ok) {
            resolve(await res.json());
          }
          reject(res.status);
        }).catch((ex) => {
          reject(ex);
        });
    });
  }

  public async getAllVersions(nexusArtifact: any, iqApplicationPublicId: string): Promise<any[]> {
    if (!nexusArtifact || !nexusArtifact.hash) {
      return [];
    }
    return new Promise<any[]>((resolve, reject) => {
      let hash = nexusArtifact.hash;
      let comp = this.encodeComponentIdentifier(
        nexusArtifact.componentIdentifier
      );
      let d = new Date();
      let timestamp = d.getDate();
      let matchstate = "exact";
      let url =
        `${this.url}/rest/ide/componentDetails/application/` +
        `${iqApplicationPublicId}/allVersions?` +
        `componentIdentifier=${comp}&` +
        `hash=${hash}&matchState=${matchstate}&` +
        `timestamp=${timestamp}&proprietary=false`;

      fetch(
        url,
        {
          method: 'GET', 
          headers: this.getHeaders(),
          agent: this.agent
        }).then(async (res) => {
          if (res.ok) {
            resolve(await res.json());
          }
          reject(res.status);
        }).catch((ex) => {
          reject(ex);
        });
    });
  }

  public async showSelectedVersion(componentIdentifier: any, version: string) {
    return new Promise((resolve, reject) => {
      this.logger.log(LogLevel.TRACE, `Begin Show Selected Version`);
      var transmittingComponentIdentifier = { ...componentIdentifier };

      transmittingComponentIdentifier.coordinates = {
        ...componentIdentifier.coordinates
      };

      transmittingComponentIdentifier.coordinates.version = version;
      var detailsRequest = {
        components: [
          {
            hash: null,
            componentIdentifier: transmittingComponentIdentifier
          }
        ]
      };
      let url = `${this.url}/api/v2/components/details`;

      fetch(
        url,
        {
          method: 'POST',
          headers: this.getHeadersWithApplicationJsonContentType(),
          body: JSON.stringify(detailsRequest),
          agent: this.agent
        }).then(async (res) => {
          if (res.ok) {
            resolve(await res.json());
          }
          reject(res.status);
        }).catch((ex) => {
          reject(ex);
        });
    });
  }

  private encodeComponentIdentifier(componentIdentifier: string) {
    let actual = encodeURIComponent(JSON.stringify(componentIdentifier));
    this.logger.log(LogLevel.TRACE, `Actual: ${actual}`); 
    return actual;
  }

  private getHeadersWithApplicationJsonContentType(): Headers {
    const headers = this.getHeaders();

    headers.append('Content-Type', 'application/json');

    return headers;
  }

  private getHeaders(): Headers {
    const meta = RequestHelpers.getUserAgentHeader();

    const headers = new Headers(meta);
    headers.append('Authorization', this.getBasicAuth());

    return headers;
  }

  private getBasicAuth(): string {
    return `Basic ${Buffer.from(`${this.user}:${this.password}`).toString('base64')}`;
  }

  private getAgent(strictSSL: boolean): Agent {
    if (!strictSSL) {
      return new HttpsAgent({
        rejectUnauthorized: strictSSL
      });
    }
    return new Agent();
  }
}
