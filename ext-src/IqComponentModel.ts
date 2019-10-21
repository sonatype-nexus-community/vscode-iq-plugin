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
import { Uri, window } from "vscode";
import * as HttpStatus from 'http-status-codes';

import { ComponentEntry, PolicyViolation } from "./ComponentInfoPanel";
import { ComponentContainer } from "./packages/ComponentContainer";

export class IqComponentModel {
    components: Array<ComponentEntry> = [];
    coordsToComponent: Map<string, ComponentEntry> = new Map<
      string,
      ComponentEntry
    >();
  
    // TODO make these configurable???
    readonly evaluationPollDelayMs = 2000;
  
    constructor(
      readonly url: string,
      private user: string,
      private password: string,
      private applicationPublicId: string,
      private getmaximumEvaluationPollAttempts: number
    ) {}
  
    public getContent(resource: Uri): Thenable<string> {
      // TODO get the HTML doc for webview
      return new Promise((c, e) => "my stubbed content entry");
    }
  
    public async evaluateComponents() {
      console.debug("evaluateComponents");
      await this.performIqScan();
    }
  
    private async performIqScan() {
      try {
        let componentContainer = new ComponentContainer();
        let packageMuncher = componentContainer.checkDependencyType();
  
        packageMuncher.packageForIq();
  
        let data = await packageMuncher.convertToNexusFormat();
        this.components = packageMuncher.toComponentEntries(data);
        this.coordsToComponent = packageMuncher.CoordinatesToComponents;

        if (undefined == data) {
          throw new RangeError("Attempted to generated dependency list but received an empty collection. NexusIQ will not be invoked for this project.");
        }
  
        console.debug("getting applicationInternalId", this.applicationPublicId);
        let response: string = await this.getApplicationId(this.applicationPublicId) as string;
  
        let appRep = JSON.parse(response);
        console.debug("appRep", appRep);
  
        let applicationInternalId: string = appRep.applications[0].id;
        console.debug("applicationInternalId", applicationInternalId);
  
        let resultId = await this.submitToIqForEvaluation(data, applicationInternalId);
  
        console.debug("report", resultId);
        let resultDataString = await this.asyncPollForEvaluationResults(applicationInternalId, resultId);
        let resultData = JSON.parse(resultDataString as string);
  
        console.debug(`Received results from IQ scan:`, resultData);

        for (let resultEntry of resultData.results) {
          let componentEntry: ComponentEntry | undefined;

          componentEntry = this.coordsToComponent.get(
            packageMuncher.ConvertToComponentEntry(resultEntry)
          );
        
          componentEntry!.policyViolations = new Array<PolicyViolation>(resultEntry.policyData.policyViolations);
          componentEntry!.hash = resultEntry.component.hash;
          componentEntry!.nexusIQData = resultEntry;
        }
      } catch (e) {
        window.showErrorMessage("Nexus IQ extension: " + e);
        return;
      }
  }

  private async getApplicationId(applicationPublicId: string) {
    console.debug("getApplicationId", applicationPublicId);

    return new Promise((resolve, reject) => {
      request.get(
        {
          method: "GET",
          url: `${this.url}/api/v2/applications?publicId=${applicationPublicId}`,
          auth: { user: this.user, pass: this.password }
        },
        (err: any, response: any, body: any) => {
          if (err) {            
            reject(`Unable to retrieve Application ID: ${err}`);
            return;
          }
          if (response.statusCode != HttpStatus.OK) {            
            reject(`Unable to retrieve Application ID. Could not communicate with server. Server error: ${response.statusCode}`);
            return;
          }
          resolve(body);
          return;
        }
      );
    });
  }

  private async submitToIqForEvaluation(
    data: any,
    applicationInternalId: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      request.post(
        {
          method: "POST",
          url: `${this.url}/api/v2/evaluation/applications/${applicationInternalId}`,
          json: data,
          auth: { user: this.user, pass: this.password }
        },
        (err: any, response: any, body: any) => {
          // console.log(response.statusCode, body);
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

  private async asyncPollForEvaluationResults(
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

  private pollForEvaluationResults(
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

  private getEvaluationResults(
    applicationInternalId: string,
    resultId: string,
    resolve: (body: string) => any,
    reject: (statusCode: number, message: string) => any
  ) {
    request.get(
      {
        method: "GET",
        url: `${this.url}/api/v2/evaluation/applications/${applicationInternalId}/results/${resultId}`,
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
}
