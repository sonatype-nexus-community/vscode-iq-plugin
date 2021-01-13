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
import Loader from "react-loader-spinner";
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

  public handleGetRemediation(packageUrl: string, vulnID: string): void {
    console.debug("App received remediation request", packageUrl);
    this.setState({ remediation: undefined });

    vscode.postMessage({
      command: "getRemediation",
      packageUrl: packageUrl
    });

    vscode.postMessage({
      command: "getVulnDetails",
      vulnID: vulnID
    });
  }

  public render() {
    console.log("App render called, state:", this.state);
    if (!this.state.scanType) {
      console.log("rendering loader because ");
      return <Loader type="Puff" color="#00BFFF" height="100" width="100" />;
      // return <SonatypeLoader />;
    } else if (this.state.scanType === ExtScanType.OssIndex) {
      console.log("Attempting to render OSS Index");
      return (
        <OssIndexContextProvider value={this.state}>
          <OssIndexVersionDetails />
        </OssIndexContextProvider>
      );
    }
    console.log("rendering Nexus IQ");
    return (
      <VersionsContextProvider value={this.state}>
        <div>
          <div className="sidenav">
            <h3>Versions</h3>
            <AllVersionsPage
              versionChangeHandler={this.handleVersionSelection}
            ></AllVersionsPage>
          </div>
          <div className="main">
            <SelectedVersionDetails />
          </div>
        </div>
      </VersionsContextProvider>
    );
  }

  public componentDidMount() {
    window.addEventListener("message", event => {
      const message = event.data;
      console.debug("App received VS message", message);
      switch (message.command) {
        case "artifact":
          console.debug(
            "Artifact received, updating state & children",
            message.component
          );
          const component = message.component;
          this.setState({
            component: component,
            allVersions: [],
            selectedVersionDetails: undefined,
            policyViolations: component.policyViolations,
            initialVersion: message.component.version
          });
          this.handleVersionSelection(message.component.version);
          break;
        case "versionDetails":
          console.log(
            "Selected version details received",
            message.componentDetails
          );
          let selectedVersion: any;
          let version: string = "";
          let vulnerabilities: [] = [];
          if (message.scanType == ExtScanType.NexusIq) {
            selectedVersion = message.componentDetails;
            version =
              message.componentDetails.component.componentIdentifier.coordinates
                .version;
          }
          if (message.scanType == ExtScanType.OssIndex) {
            selectedVersion = message.componentDetails;
            version = message.componentDetails.version;
            vulnerabilities = message.vulnerabilities;
          }
          this.setState({
            selectedVersionDetails: selectedVersion,
            selectedVersion: version,
            scanType: message.scanType,
            vulnerabilities: vulnerabilities
          });
          break;
        case "allversions":
          console.debug("App handling allVersions message", message);
          console.debug("allVersions state component", this.state.component);
          if (!this.allVersionsIsForCurrentComponent(message.allversions)) {
            console.debug(
              "Received allVersions for different component, ignoring",
              message
            );
            break;
          }
          console.debug(
            "allVersions updating state component, componentIdentifier",
            this.state.component
          );
          console.debug(
            "allVersions updating componentIdentifier",
            message.allversions[0].component.componentIdentifier.coordinates
          );
          this.setState({ allVersions: message.allversions });
          break;
        case "remediationDetail":
          console.debug(
            "App handling remediationDetail message",
            message.remediation.remediation
          );
          this.setState({ remediation: message.remediation.remediation });
          break;
        case "vulnDetails":
          console.debug("App handling vulnerability details message", message.vulnDetails);
          this.setState({ 
            vulnDetails: message.vulnDetails
          });
          break;
      }
    });
  }

  private allVersionsIsForCurrentComponent(allVersions: any): boolean {
    if (!allVersions || allVersions.length <= 0) {
      // no version array provided
      console.debug(`allVersions 0 length: ${allVersions}`);
      return false;
    }
    let current = this.state.component.nexusIQData.component.componentIdentifier
      .coordinates;
    let next = allVersions[0].component.componentIdentifier.coordinates;

    for (var key in current) {
      if (key != "version" && current[key] != next[key]) {
        console.debug(
          `next allVersion has property mismatch. Key=[${key}], current: ${current[key]}, next: ${next[key]}`
        );
        return false;
      }
    }
    return true;
  }
}

export default ExtensionContainer;
