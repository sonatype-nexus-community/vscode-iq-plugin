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
import * as request from "request";
import * as HttpStatus from 'http-status-codes';
import { RequestService } from "./RequestService";
import { RequestHelpers } from "./RequestHelpers";
import { constants } from 'os';

export class IqRequestService implements RequestService {
  readonly evaluationPollDelayMs = 2000;
  applicationId: string = "";

  constructor(
    private url: string,
    private user: string,
    private password: string,
    private getmaximumEvaluationPollAttempts: number,
    private strictSSL: boolean = true
  ) 
  {
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
    console.debug("getApplicationId", applicationPublicId);

    return new Promise((resolve, reject) => {
      request.get(
        {
          method: "GET",
          url: `${this.url}/api/v2/applications?publicId=${applicationPublicId}`,
          headers: RequestHelpers.getUserAgentHeader(),
          strictSSL: this.strictSSL,
          auth: { user: this.user, pass: this.password }
        })
        .on('response', (res) => {
          console.log(res.statusCode);

          if (res.statusCode != HttpStatus.OK) {            
            reject(`Unable to retrieve Application ID. Could not communicate with server. Server error: ${res.statusCode}`);
            return;
          }

          res.on('data', (data) => {
            resolve(data);
            return;
          });
        }).on('error', (err) => {
          console.debug(err);
          if (err.message.includes('ECONNREFUSED')) {
            reject("Unable to reach Nexus IQ Server, please check that your config is correct, and that the server is reachable.");
            return;
          }
          reject(err.message);
          return;
        });
    });
  }

  public async submitToIqForEvaluation(
    data: any,
    applicationInternalId: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      request.post(
        {
          method: "POST",
          url: `${this.url}/api/v2/evaluation/applications/${applicationInternalId}`,
          json: data,
          strictSSL: this.strictSSL,
          headers: RequestHelpers.getUserAgentHeader(),
          auth: { user: this.user, pass: this.password }
        },
        (err: any, response: any, body: any) => {
          if (err) {
            reject(`Unable to perform IQ scan: ${err}`);
            return;
          }
          if (response.statusCode != HttpStatus.OK) {
            reject(`Unable to perform IQ scan: ${body}`);
            return;
          }

          let resultId = body.resultId;
          resolve(resultId);
          return;
        }
      );
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
    request.get(
      {
        method: "GET",
        url: `${this.url}/api/v2/evaluation/applications/${applicationInternalId}/results/${resultId}`,
        headers: RequestHelpers.getUserAgentHeader(),
        strictSSL: this.strictSSL,
        auth: { user: this.user, pass: this.password }
      },
      (error: any, response: any, body: any) => {
        if (response && response.statusCode != HttpStatus.OK) {
          reject(response.statusCode, error);
          return;
        }
        if (error) {
          reject(response.statusCode, error);
          return;
        }
        resolve(body);
      }
    );
  }

  public async getRemediation(nexusArtifact: any) {
    return new Promise((resolve, reject) => {
      console.debug("begin getRemediation", nexusArtifact);
      var requestdata = nexusArtifact.component;
      console.debug("requestdata", requestdata);
      let url = `${this.url}/api/v2/components/remediation/application/${this.applicationId}`;

      request.post(
        {
          method: "post",
          json: requestdata,
          url: url,
          headers: RequestHelpers.getUserAgentHeader(),
          strictSSL: this.strictSSL,
          auth: { user: this.user, pass: this.password }
        },
        (err, response, body) => {
          if (err) {
            reject(`Unable to retrieve Component details: ${err}`);
            return;
          }
          console.debug("response", response);
          console.debug("body", body);
          resolve(body);
        }
      );
    });
  }

  public async getCVEDetails(cve: any, nexusArtifact: any) {
    //, settings) {
    return new Promise((resolve, reject) => {
      console.log("begin GetCVEDetails", cve, nexusArtifact);
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

      request.get(
        {
          method: "GET",
          url: url,
          headers: RequestHelpers.getUserAgentHeader(),
          strictSSL: this.strictSSL,
          auth: {
            user: this.user,
            pass: this.password
          }
        },
        (err, response, body) => {
          if (err) {
            reject(`Unable to retrieve CVEData: ${err}`);
            return;
          }
          console.debug("response", response);
          console.debug("body", body);

          let resp = JSON.parse(body) as any;

          resolve(resp);
        }
      );
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

      request.get(
        {
          method: "GET",
          url: url,
          headers: RequestHelpers.getUserAgentHeader(),
          strictSSL: this.strictSSL,
          auth: {
            user: this.user,
            pass: this.password
          }
        },
        (err, response, body) => {
          if (err) {
            reject(`Unable to retrieve GetAllVersions: ${err}`);
            return;
          }
          const versionArray = JSON.parse(body) as any[];
          console.debug("getAllVersions retrieved body", versionArray);
          resolve(versionArray);
        }
      );
    });
  }

  public async showSelectedVersion(componentIdentifier: any, version: string) {
    return new Promise((resolve, reject) => {
      console.debug("begin showSelectedVersion", componentIdentifier, version);
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

      request.post(
        {
          method: "post",
          json: detailsRequest,
          url: url,
          headers: RequestHelpers.getUserAgentHeader(),
          strictSSL: this.strictSSL,
          auth: {
            user: this.user,
            pass: this.password
          }
        },
        (err, response, body) => {
          if (err) {
            reject(`Unable to retrieve selected version details: ${err}`);
            return;
          }

          resolve(body);
        }
      );
    });
  }

  private encodeComponentIdentifier(componentIdentifier: string) {
    let actual = encodeURIComponent(JSON.stringify(componentIdentifier));
    console.log("actual", actual);
    return actual;
  }
}
