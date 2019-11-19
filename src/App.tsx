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
import AllVersionsPage from './AllVersions/AllVersionsPage';
import SelectedVersionDetails from './SelectedVersionDetails/SelectedVersionDetails';
import { VersionsContextProvider } from './context/versions-context';
import { OssIndexContextProvider } from './context/ossindex-context';

// add workarounds to call VSCode
declare var acquireVsCodeApi: any;
const vscode: any = acquireVsCodeApi();

type AppProps = {
};

type AppState = {
  scanType: string,
  component: any,
  allVersions: any[],
  selectedVersionDetails?: any,
  selectedVersion: string,
  initialVersion: string,
  remediation?: any,
  cvedetails?: any,
  handleGetRemediation(o: any, s: string): void
};

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    console.debug("App constructing, props:", props);
    this.state = {
      scanType: "",
      component: {},
      allVersions: [],
      selectedVersionDetails: undefined,
      selectedVersion: "",
      initialVersion: "",
      remediation: undefined,
      cvedetails: undefined,
      handleGetRemediation: this.handleGetRemediation.bind(this)
    }
  }

  public handleVersionSelection(newSelection: string) {
    console.debug("App received version change", newSelection);
    this.setState({selectedVersionDetails: undefined})

    vscode.postMessage({
      command: 'selectVersion',
      version: newSelection,
      package: this.state.component
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
    if (!this.state.component || !this.state.component.nexusIQData) {
      return (
        <Loader
          type="Puff"
          color="#00BFFF"
          height="100"
          width="100"
        />
      );
    } else if ( this.state.scanType === "ossindex"){
      return (
        <OssIndexContextProvider value={this.state}>
          <h1>Hello</h1>
        </OssIndexContextProvider>
      )
    }

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
        case 'scanType':
          console.debug("ScanType recieved");
          this.setState({
            scanType: message.scanType
          });
          break;
        case 'artifact':
          console.debug("Artifact received, updating state & children", message.component);
          const component = message.component;
          this.setState({
            component: component, 
            allVersions: [], 
            selectedVersionDetails: undefined,
            initialVersion: message.component.version
          });
          this.handleVersionSelection(message.component.version)
          break;
        case 'versionDetails':
          console.log("Selected version details received", message.componentDetails);
          this.setState({selectedVersionDetails: message.componentDetails, 
            selectedVersion: message.componentDetails.component.componentIdentifier.coordinates.version
          })
          break;
        case 'allversions':
          console.debug("App handling allVersions message", message);
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
        }
    });
  }
}

export default App;
