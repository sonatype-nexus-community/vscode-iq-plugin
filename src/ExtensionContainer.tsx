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
import * as React from "react";
import AllVersionsPage from "./components/IqServer/AllVersions/AllVersionsPage";
import SelectedVersionDetails from "./components/IqServer/SelectedVersionDetails/SelectedVersionDetails";
import { VersionsContextProvider } from "./context/versions-context";
import { OssIndexContextProvider } from "./context/ossindex-context";
import { ExtScanType } from "./utils/ExtScanType";
import OssIndexVersionDetails from "./components/OssIndex/OssIndexVersionDetails/OssIndexVersionDetails";
import { VulnerabilityDetails } from "./context/VulnerabilityResponse";

// add workarounds to call VSCode
declare var acquireVsCodeApi: any;
const vscode: any = acquireVsCodeApi();

type AppProps = {};

type AppState = {
  scanType?: ExtScanType;
  vulnerabilities?: any[];
  component: any;
  allVersions: any[];
  selectedVersionDetails?: any;
  selectedVersion: string;
  initialVersion: string;
  remediation?: any;
  policyViolations?: any[];
  vulnDetails?: VulnerabilityDetails | undefined;
  handleGetRemediation(o: any, s: string): void;
};

class ExtensionContainer extends React.Component<AppProps, AppState> {

  constructor(props: AppProps) {
    super(props);

    console.debug("App constructing, props:", props);

    this.state = {
      component: {},
      vulnerabilities: [],
      allVersions: [],
      selectedVersionDetails: undefined,
      selectedVersion: "",
      initialVersion: "",
      remediation: undefined,
      policyViolations: undefined,
      vulnDetails: undefined,
      handleGetRemediation: this.handleGetRemediation.bind(this)
    };
  }

  render() {
    if (!this.state.scanType) {
      return null;
    } else if (this.state.scanType === ExtScanType.OssIndex) {
      return <OssIndexContextProvider 
        value={this.state}>
        <OssIndexVersionDetails />
      </OssIndexContextProvider>
    }
    return <VersionsContextProvider 
      value={this.state}>
        <React.Fragment>
          <div className="sidenav">
            <AllVersionsPage
              versionChangeHandler={ this.handleVersionSelection }
              />
          </div>
          <div className="main">
            <SelectedVersionDetails 
              selectedVersion={this.state.selectedVersion} 
              currentVersion={this.state.initialVersion} />
          </div>
        </React.Fragment>
    </VersionsContextProvider>
  }

  componentDidMount() {
    window.addEventListener("message", event => {
      const message = event.data;

      console.debug("App received VS message", message);

      switch (message.command) {
        case "artifact":
          this.handleArtifactMessage(message.component);
          break;
        case "versionDetails":
          this.handleVersionDetailsMessage(
            message.componentDetails,
            message.vulnerabilities,
            message.scanType
            );
          break;
        case "allversions":
          this.handleAllVersionsMessage(message.allversions);
          break;
        case "remediationDetail":
          this.handleRemediationMessage(message.remediation.remediation);
          break;
        case "vulnDetails":
          this.handleVulnDetailsMessage(message.vulnDetails);
          break;
      }
    });
  }

  handleVersionSelection = (version: string): void => {
    console.debug("App received version change", version);
    this.setState({
      selectedVersionDetails: undefined,
      selectedVersion: version
    });

    vscode.postMessage({
      command: "selectVersion",
      version: version,
      package: this.state.component
    });
  }

  handleGetRemediation = (packageUrl: string, vulnID: string): void => {
    console.debug("App received remediation request", packageUrl);
    this.setState({
      remediation: undefined 
    });

    vscode.postMessage({
      command: "getRemediation",
      packageUrl: packageUrl
    });

    vscode.postMessage({
      command: "getVulnDetails",
      vulnID: vulnID
    });
  }

  handleArtifactMessage = (component: any) => {
    console.debug(
      "Artifact received, updating state & children",
      component
    );

    this.setState({
      component: component,
      allVersions: [],
      selectedVersionDetails: undefined,
      policyViolations: component.policyViolations,
      initialVersion: component.version
    });

    this.handleVersionSelection(component.version);
  }

  handleVersionDetailsMessage = (componentDetails: any, vulnerabilities: any, scanType: ExtScanType) => {
    console.debug(
      "Selected version details received",
      componentDetails
    );

    const version: string = 
      (scanType === ExtScanType.NexusIq) ? componentDetails.component.componentIdentifier.coordinates.version : componentDetails.version;

    this.setState({
      selectedVersionDetails: componentDetails,
      selectedVersion: version,
      scanType: scanType,
      vulnerabilities: vulnerabilities
    });
  }

  handleAllVersionsMessage = (allVersions: any[]) => {
    console.debug("App handling allVersions message");
    console.debug(
      "allVersions state component", 
      this.state.component
    );

    if (!this.allVersionsShallowEqual(allVersions)) {
      console.debug(
        "Received allVersions for different component, ignoring",
      );
      return;
    }
    console.debug(
      "allVersions updating state component, componentIdentifier",
      this.state.component
    );
    console.debug(
      "allVersions updating componentIdentifier",
      allVersions[0].component.componentIdentifier.coordinates
    );

    this.setState({
      allVersions: allVersions 
    });
  }

  handleRemediationMessage = (remediation: any) => {
    console.debug(
      "App handling remediationDetail message",
      remediation
    );

    this.setState({
      remediation: remediation 
    });
  }

  handleVulnDetailsMessage = (vulnDetails: VulnerabilityDetails) => {
    console.debug(
      "App handling vulnerability details message", 
      vulnDetails
    );

    this.setState({ 
      vulnDetails: vulnDetails
    });
  }

  allVersionsShallowEqual = (allVersions: any[]): boolean => {
    if (!allVersions || allVersions.length <= 0) {
      return false;
    }

    const current = this.state.component.nexusIQData.component.componentIdentifier.coordinates;
    const next = allVersions[0].component.componentIdentifier.coordinates;

    for (let key in current) {
      if (key != "version" && current[key] !== next[key]) {
        return false;
      }
    }

    return true;
  }
}

export default ExtensionContainer;
