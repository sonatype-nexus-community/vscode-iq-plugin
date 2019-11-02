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
import { Uri, window, extensions, version } from "vscode";
import * as HttpStatus from 'http-status-codes';

import { ComponentEntry, PolicyViolation } from "./ComponentInfoPanel";
import { ComponentContainer } from "./packages/ComponentContainer";

export class IqComponentModel {
    components: Array<ComponentEntry> = [];
    coordsToComponent: Map<string, ComponentEntry> = new Map<
      string,
      ComponentEntry
    >();
    applicationId: string = "";
  
    // TODO make these configurable???
    readonly evaluationPollDelayMs = 2000;
  
    constructor(
      readonly url: string,
      private user: string,
      private password: string,
      private applicationPublicId: string,
      private getmaximumEvaluationPollAttempts: number
    ) {}

    public setPassword(password: string) {
      this.password = password;
    }

    public isPasswordSet(): boolean {
      if(this.password == "") {
        return false;
      }
      return true;
    }
  
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

        let data: any;

        if (componentContainer.PackageMuncher != undefined) {
          await componentContainer.PackageMuncher.packageForIq();
  
          data = await componentContainer.PackageMuncher.convertToNexusFormat();
          this.components = componentContainer.PackageMuncher.toComponentEntries(data);
          this.coordsToComponent = componentContainer.PackageMuncher.CoordinatesToComponents;
        } else {
          throw new TypeError("Unable to instantiate Package Muncher");
        }

        if (undefined == data) {
          throw new RangeError("Attempted to generated dependency list but received an empty collection. NexusIQ will not be invoked for this project.");
        }
  
        console.debug("getting applicationInternalId", this.applicationPublicId);
        let response: string = await this.getApplicationId(this.applicationPublicId) as string;
  
        let appRep = JSON.parse(response);
        console.debug("appRep", appRep);
  
        this.applicationId = appRep.applications[0].id;
        console.debug("applicationInternalId", this.applicationId);
  
        let resultId = await this.submitToIqForEvaluation(data, this.applicationId);
  
        console.debug("report", resultId);
        let resultDataString = await this.asyncPollForEvaluationResults(this.applicationId, resultId);
        let resultData = JSON.parse(resultDataString as string);
  
        console.debug(`Received results from IQ scan:`, resultData);

        for (let resultEntry of resultData.results) {
          let componentEntry: ComponentEntry | undefined;

          componentEntry = this.coordsToComponent.get(
            componentContainer.PackageMuncher.ConvertToComponentEntry(resultEntry)
          );
        
          componentEntry!.policyViolations = resultEntry.policyData.policyViolations as Array<PolicyViolation>;
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
          headers: this.getUserAgentHeader(),
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
          headers: this.getUserAgentHeader(),
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
        headers: this.getUserAgentHeader(),
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
          headers: this.getUserAgentHeader(),
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

  public async GetCVEDetails(cve: any, nexusArtifact: any) {
    //, settings) {
    return new Promise((resolve, reject) => {
      console.log("begin GetCVEDetails", cve, nexusArtifact);
      let timestamp = Date.now();
      let hash = nexusArtifact.components[0].hash;
      let componentIdentifier = this.encodeComponentIdentifier(
        nexusArtifact.components[0].componentIdentifier
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
          headers: this.getUserAgentHeader(),
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

          resolve(body);
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
          headers: this.getUserAgentHeader(),
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
          headers: this.getUserAgentHeader(),
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

  private getUserAgentHeader() {
    return { 'User-Agent': `Nexus_IQ_Visual_Studio_Code/${this.getExtensionVersion()} (Visual Studio Code: ${version})` };
  }

  private getExtensionVersion() {
    let extension = extensions.getExtension('cameronsonatype.vscode-iq-plugin');
    if (extension != undefined) {
      return extension.packageJSON.version;
    } else {
      return "0.0.0"
    }
  }
}
