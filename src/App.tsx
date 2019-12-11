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
import Loader from 'react-loader-spinner';
import AllVersionsPage from './components/IqServer/AllVersions/AllVersionsPage';
import SelectedVersionDetails from './components/IqServer/SelectedVersionDetails/SelectedVersionDetails';
import { VersionsContextProvider } from './context/versions-context';
import { OssIndexContextProvider } from './context/ossindex-context';
import { ExtScanType } from './utils/ExtScanType';
import OssIndexVersionDetails from './components/OssIndex/OssIndexVersionDetails/OssIndexVersionDetails';

// add workarounds to call VSCode
declare var acquireVsCodeApi: any;
const vscode: any = acquireVsCodeApi();

type AppProps = {
};

type AppState = {
  scanType?: ExtScanType,
  vulnerabilities?: any[],
  component: any,
  allVersions: any[],
  selectedVersionDetails?: any,
  selectedVersion: string,
  initialVersion: string,
  remediation?: any,
  policyViolations?: any[],
  cvedetails?: any,
  supplementalInfo?: any,
  handleGetRemediation(o: any, s: string): void
  handleGetSupplementalInfo(o: any): void
};

class App extends React.Component<AppProps, AppState> {
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
      cvedetails: undefined,
      supplementalInfo: undefined,
      handleGetRemediation: this.handleGetRemediation.bind(this),
      handleGetSupplementalInfo: this.handleGetSupplementalInfo.bind(this)
    }
  }

  public handleVersionSelection(newSelection: string) {
    console.debug("App received version change", newSelection);
    this.setState({selectedVersionDetails: undefined, selectedVersion: newSelection})

    vscode.postMessage({
      command: 'selectVersion',
      version: newSelection,
      package: this.state.component
    });
  }

  public handleGetSupplementalInfo(artifact: any) {
    console.debug("App received request for artifact supplemental info", artifact);
    this.setState({supplementalInfo: undefined})

    vscode.postMessage({
      command: 'getSupplementalInfo',
      artifact: artifact
    });
  }

  public handleGetRemediation(nexusArtifact: any, cve: string): void {
    console.debug("App received remediation request", nexusArtifact);
    this.setState({remediation: undefined})

    vscode.postMessage({
      command: 'getRemediation',
      nexusArtifact: nexusArtifact
    });

    vscode.postMessage({
      command: 'getCVEDetails',
      cve: cve,
      nexusArtifact: nexusArtifact
    });
  }

  public render() {
    var _this = this;
    console.log("App render called, state:", this.state);
    if (!this.state.scanType) {
      console.log("rendering loader because ")
      return (
        <Loader
          type="Puff"
          color="#00BFFF"
          height="100"
          width="100"
        />
      );
    } else if ( this.state.scanType === ExtScanType.OssIndex){
      console.log("Attempting to render OSS Index");
      return (
        <OssIndexContextProvider value={this.state}>
          <OssIndexVersionDetails handleGetSupplementalInfo={this.handleGetSupplementalInfo} />
        </OssIndexContextProvider>
      )
    }
    console.log("rendering Nexus IQ");
    return (
      <VersionsContextProvider value={this.state}>
        <div>
          <div className="sidenav">
            <h3>Versions</h3>
              <AllVersionsPage
                versionChangeHandler={_this.handleVersionSelection.bind(_this)}>
              </AllVersionsPage>
          </div>
          <div className="main">
              <SelectedVersionDetails/>
          </div>
        </div>
      </VersionsContextProvider>
    );
  }

  public componentDidMount() {
    window.addEventListener('message', event => {
      const message = event.data;
      console.debug("App received VS message", message);
      switch (message.command) {
        case 'artifact':
          console.debug("Artifact received, updating state & children", message.component);
          const component = message.component;
          this.setState({
            component: component,
            allVersions: [],
            selectedVersionDetails: undefined,
            policyViolations: component.policyViolations,
            initialVersion: message.component.version
          });
          this.handleVersionSelection(message.component.version)
          break;
        case 'versionDetails':
          console.log("Selected version details received", message.componentDetails);
          let selectedVersion: any;
          let version: string = "";
          let vulnerabilities: [] = [];
          if (message.scanType == ExtScanType.NexusIq) {
            selectedVersion = message.componentDetails;
            version = message.componentDetails.component.componentIdentifier.coordinates.version;
          }
          if (message.scanType == ExtScanType.OssIndex) {
            selectedVersion = message.componentDetails;
            version = message.componentDetails.version;
            vulnerabilities = message.vulnerabilities;
          }
          this.setState({selectedVersionDetails: selectedVersion, 
            selectedVersion: version,
            scanType: message.scanType,
            vulnerabilities: vulnerabilities
          })
          break;
        case 'allversions':
          console.debug("App handling allVersions message", message);
          console.debug("allVersions state component", this.state.component);
          if (!this.allVersionsIsForCurrentComponent(message.allversions)) {
            console.debug("Received allVersions for different component, ignoring", message);
            break;
          }
          console.debug("allVersions updtating state component, componentIdentifier", this.state.component)
          console.debug("allVersions updtating componentIdentifier", message.allversions[0].componentIdentifier.coordinates)
          this.setState({allVersions: message.allversions});
          break;
        case 'remediationDetail':
          console.debug("App handling remediationDetail message", message.remediation.remediation);
          this.setState({remediation: message.remediation.remediation});
          break;
        case 'cveDetails':
          console.debug("App handling cveDetails message", message.cvedetails);
          this.setState({cvedetails: message.cvedetails});
          break;
        case 'supplementalArtifactInfo':
          console.debug("App handling supplementalArtifactInfo message", message.supplementalInfo);
          this.setState({supplementalInfo: message.supplementalInfo});
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
    let current = this.state.component.nexusIQData.component.componentIdentifier.coordinates;
    let next = allVersions[0].componentIdentifier.coordinates;

    for (var key in current) {
      if (key != "version" && current[key] != next[key]) {
        console.debug(`next allVersion has property mismatch. Key=[${key}], current: ${current[key]}, next: ${next[key]}`);
        return false;
      }
    }
    return true;
  }
}

export default App;
