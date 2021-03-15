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
import { RequestService } from "./RequestService";
import { RequestHelpers } from "./RequestHelpers";
import { Agent as HttpsAgent, RequestOptions }  from "https";
import { Agent } from 'http';
import { ILogger, LogLevel } from '../utils/Logger';
import { ThirdPartyAPIResponse } from './ThirdPartyApiResponse';
import { ComponentDetails } from './ComponentDetails';
import { ReportResponse } from './ReportResponse';
import { PackageURL } from 'packageurl-js';
import { VulnerabilityResponse } from './VulnerabilityResponse';
import { RemediationResponse } from './RemediationResponse';
import { ApplicationResponse } from './ApplicationReponse';
import { RefreshOptions } from '../NexusExplorer';

export class IqRequestService implements RequestService {
  readonly evaluationPollDelayMs = 2000;
  private agent: Agent = this.getAgent(false, false);
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
    this.setUrl(url);

    this.logger.log(LogLevel.INFO, `Created new IQ Request Service at: `, url);
  }

  public setOptions(options: RefreshOptions) {
    if (options.url) {
      this.setUrl((process.env.IQ_SERVER ? process.env.IQ_SERVER : options.url));
    }
    if (options.username) {
      this.user = (process.env.IQ_USERNAME ? process.env.IQ_USERNAME : options.username);
    }
    if (options.token) { 
      this.password = (process.env.IQ_TOKEN ? process.env.IQ_TOKEN : options.token);
    }
  }

  private setUrl(url: string) {
    this.logger.log(LogLevel.TRACE, `Setting IQ url to: `, this.url);

    this.url = url.replace(/\/$/, "");

    this.agent = this.getAgent(
      this.strictSSL, 
      this.url.startsWith('https')
    );
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
    if (applicationPublicId === '') {
      throw Error(`You must provide a non empty public application ID in your Sonatype IQ Server Config`);
    }

    this.logger.log(LogLevel.TRACE, `Getting application ID from public ID: ${applicationPublicId}`);

    let url = `${this.url}/api/v2/applications?publicId=${applicationPublicId}`;
    return new Promise((resolve, reject) => {
      fetch(
        url, 
        {
          method: 'GET',
          headers: this.getHeaders(),
          agent: this.agent
        }).then(async (res) => {
          if (res.ok) {
            let appRep: ApplicationResponse = await res.json();

            if (appRep && appRep.applications.length > 0) {
              resolve(appRep.applications[0].id);
              return;
            } else {
              this.logger.log(
                LogLevel.ERROR,
                `No valid application found using the public ID: ${applicationPublicId}`, 
                url,
                appRep
              );
              reject(`No valid application found using the public ID: ${applicationPublicId}`);
              return;
            }
          }

          let body = await res.text();
          this.logger.log(
            LogLevel.TRACE, 
            `Non 200 response from getting application ID`, url, body, res.status
            );
          reject(res.status);
          return;
        }).catch((ex) => {
          this.logger.log(
            LogLevel.ERROR, 
            `Error getting application ID from public ID`, url, ex
            );
          reject(ex);
        });
    });
  }

  public async submitToThirdPartyAPI(
    sbom: string,
    applicationInternalId: string
  ): Promise<string> {
    let url: string = `${this.url}/api/v2/scan/applications/${applicationInternalId}/sources/vscode-iq-extension?stageId=develop`

    return new Promise((resolve, reject) => {
      fetch(
        url,
        {
          method: 'POST',
          body: sbom,
          agent: this.agent,
          headers: this.getHeadersWithApplicationXmlContentType()
        }).then(async (res) => {
          if (res.ok) {
            let body = await res.json();
            resolve(body.statusUrl);
            return;
          }
          let body = await res.text();
          this.logger.log(
            LogLevel.TRACE, 
            `Non 200 response from IQ Server on submitting to 3rd Party API`, 
            body, 
            res.status
            );
          reject(res.status);
          return;
        }).catch((ex) => {
          this.logger.log(
            LogLevel.ERROR, 
            `Error submitting to 3rd Party API`, ex
            );
          reject(ex);
        });
    });
  }

  public async asyncPollForEvaluationResults(
    statusURL: string
  ): Promise<ThirdPartyAPIResponse> {
    return new Promise((resolve, reject) => {
      this.pollForEvaluationResults(
        statusURL,
        body => resolve(body),
        (statusCode, message) =>
          reject(
            `Could not fetch evaluation result, code ${statusCode}, message ${message}`
          )
      );
    });
  }

  public pollForEvaluationResults(
    statusURL: string,
    success: (body: ThirdPartyAPIResponse) => any,
    failed: (statusCode: number, message: string) => any
  ) {
    let _this = this;
    let pollAttempts = 0;

    let successHandler = function(value: ThirdPartyAPIResponse) {
      success(value);
    };
    let errorHandler = function(statusCode: number, message: string) {
      if (statusCode === 404) {
        // report still being worked on, continue to poll
        pollAttempts += 1;
        // TODO use the top-level class constant, but references are failing
        if (pollAttempts >= _this.getmaximumEvaluationPollAttempts) {
          failed(statusCode, "Poll limit exceeded, try again later");
        } else {
          setTimeout(() => {
            _this.getEvaluationResults(
              statusURL,
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
      statusURL,
      successHandler,
      errorHandler
    );
  }

  public getReportResults(reportID: string, applicationPublicId: string): Promise<ReportResponse> {
    let url = `${this.url}/api/v2/applications/${applicationPublicId}/reports/${reportID}/policy`;
    
    return new Promise((resolve, reject) => {
      fetch(
        url,
        {
          method: 'GET',
          agent: this.agent,
          headers: this.getHeaders()
        }).then(async (res) => {
          if (res.ok) {
            let body: ReportResponse = await res.json();
            resolve(body);
            return;
          }
          let body = await res.text();
          this.logger.log(LogLevel.ERROR, `Issue getting report result`, url, body);
          reject(res.status);
          return;
        }).catch((ex) => {
          reject(ex);
        })
    });
  }

  public getEvaluationResults(
    statusURL: string,
    resolve: (body: ThirdPartyAPIResponse) => any,
    reject: (statusCode: number, message: string) => any
  ) {
    fetch(
      `${this.url}/${statusURL}`, 
      {
        method: 'GET',
        headers: this.getHeaders(),
        agent: this.agent
      }).then(async (res) => {
        if (res.status == 404 || res.status == 500) {
          reject(404, 'Polling');
          return;
        }
        let json: ThirdPartyAPIResponse = await res.json();
        resolve(json);
        return;
      }).catch((ex) => {
        reject(ex, 'big issue');
      });
  }

  public async getRemediation(purl: string): Promise<RemediationResponse> {
    this.logger.log(LogLevel.TRACE, `Begin Get Remediation: ${purl}`);

    return new Promise((resolve, reject) => {
      const request = { packageUrl: purl };

      let url = `${this.url}/api/v2/components/remediation/application/${this.applicationId}?stageId=develop`;

      fetch(
        url, 
        {
          method: 'POST',
          headers: this.getHeadersWithApplicationJsonContentType(),
          body: JSON.stringify(request),
          agent: this.agent
        }).then(async (res) => {
          if (res.ok) {
            let remediation: any = await res.json();
            resolve(remediation);
            return;
          }
          let body = await res.text();
          this.logger.log(
            LogLevel.ERROR,
            `Non 200 response attempting to get remediation details: ${purl}`,
            request,
            body,
            url
          );
          reject(res.status);
          return;
        }).catch((ex) => {
          this.logger.log(
            LogLevel.ERROR,
            `General error attempting to get remediation details: ${purl}`,
            request,
            ex,
            url
          );
          reject(ex);
        });
    });
  }

  public async getVulnerabilityDetails(vulnID: string): Promise<VulnerabilityResponse> {
    let url = `${this.url}/api/v2/vulnerabilities/${vulnID}`;

    return new Promise((resolve, reject) => {
      fetch(
        url,
        {
          method: 'GET',
          agent: this.agent,
          headers: this.getHeaders()
        }).then(async (res) => {
          if (res.ok) {
            let body: VulnerabilityResponse = await res.json();
            resolve(body);
            return;
          }
          let body = await res.text();
          this.logger.log(
            LogLevel.ERROR, 
            `Non 200 response attempting to get vuln details: ${vulnID}`,
            body,
            url);
          reject(res.status);
          return;
        }).catch((ex) => {
          this.logger.log(
            LogLevel.ERROR, 
            `General error attempting to get vuln details: ${vulnID}`,
            ex,
            url);
          reject(ex);
        })
    })
  }

  public async getAllVersions(purl: PackageURL): Promise<Array<string>> {
    let url = `${this.url}/api/v2/components/versions`;
    
    let request = {
      packageUrl: purl.toString().replace("%2F", "/")
    };

    return new Promise((resolve, reject) => {
      fetch(
        url,
        {
          method: 'POST',
          body: JSON.stringify(request),
          agent: this.agent,
          headers: this.getHeadersWithApplicationJsonContentType()
        }).then(async (res) => {
          if (res.ok) {
            let versions: Array<string> = await res.json();
            resolve(versions);
            return;
          }
          let body = await res.text();
          this.logger.log(
            LogLevel.ERROR, 
            `Non 200 response received getting versions array from IQ Server`, 
            request,
            res.status,
            body);
          reject(res.status);
          return;
        }).catch((ex) => {
          this.logger.log(
            LogLevel.ERROR, 
            `General error getting versions array from IQ Server`, 
            request,
            ex);
          reject(ex);
        });
    });
  }

  public async getAllVersionDetails(versions: Array<string>, purl: PackageURL): Promise<ComponentDetails> {
    this.logger.log(LogLevel.TRACE, 
      `Begin Get All Version Details: ${purl.toString()}`, 
      purl, 
      versions);

    let url = `${this.url}/api/v2/components/details`;

    return new Promise((resolve, reject) => {
      let request: ComponentDetailsRequest = { components: []};
      versions.forEach((version) => {
        purl.version = version;
        request.components.push({ packageUrl: purl.toString().replace("%2F", "/") });
      });

      let body = JSON.stringify(request);

      fetch(
        url,
        {
          method: 'POST',
          body: body,
          agent: this.agent,
          headers: this.getHeadersWithApplicationJsonContentType()
        }).then(async (res) => {
          if (res.ok) {
            let comps: ComponentDetails = await res.json();
            resolve(comps);
            return;
          }
          let body = await res.text();
          this.logger.log(
            LogLevel.ERROR, 
            `Non 200 response received getting component versions details from IQ Server`, 
            request,
            res.status,
            body);
          reject(res.status);
          return;
        }).catch((ex) => {
          this.logger.log(
            LogLevel.ERROR, 
            `General error getting component versions details from IQ Server`, 
            request,
            ex);
          reject(ex);
        });
    });
  }

  public async showSelectedVersion(purl: string): Promise<ComponentDetails> {
    this.logger.log(LogLevel.TRACE, 
      `Begin Show Selected Version: ${purl}`);

    return new Promise((resolve, reject) => {
      let url = `${this.url}/api/v2/components/details`;

      let request: ComponentDetailsRequest = {components: []};
      request.components.push({packageUrl: purl});

      fetch(
        url,
        {
          method: 'POST',
          headers: this.getHeadersWithApplicationJsonContentType(),
          body: JSON.stringify(request),
          agent: this.agent
        }).then(async (res) => {
          if (res.ok) {
            let comp: ComponentDetails = await res.json();
            resolve(comp);
            return;
          }
          let body = await res.text();
          this.logger.log(
            LogLevel.ERROR, 
            `Non 200 response received getting component version details from IQ Server`, 
            request,
            res.status,
            body);
          reject(res.status);
          return;
        }).catch((ex) => {
          this.logger.log(
            LogLevel.ERROR, 
            `General error getting component version details from IQ Server`, 
            request,
            ex);
          reject(ex);
        });
    });
  }

  private getHeadersWithApplicationXmlContentType(): Headers {
    const headers = this.getHeaders();

    headers.append('Content-Type', 'application/xml');

    return headers;
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

  private getAgent(strictSSL: boolean, isHttps: boolean): Agent {
    if (!strictSSL && isHttps) {
      return new HttpsAgent({
        rejectUnauthorized: strictSSL
      });
    }
    if (isHttps) {
      return new HttpsAgent();
    }
    return new Agent();
  }
}

export interface ComponentDetailsRequest {
  components: any[]
}
