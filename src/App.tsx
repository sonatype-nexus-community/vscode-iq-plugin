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
import AllVersionsPage from './AllVersionsPage';
import SelectedVersionDetails from './SelectedVersionDetails';
import { VersionsContextProvider } from './context/versions-context';

// add workarounds to call VSCode
declare var acquireVsCodeApi: any;
const vscode: any = acquireVsCodeApi();

type AppProps = {
};

type AppState = {
  component: any,
  allVersions: any[],
  selectedVersionDetails?: any,
  selectedVersion: string,
  initialVersion: string
};

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    console.debug("App constructing, props:", props);
    this.state = {
      component: {},
      allVersions: [],
      selectedVersionDetails: undefined,
      selectedVersion: "",
      initialVersion: ""
    }
  }

  public handleVersionSelection(newSelection: string) {
    console.debug("App received version change", newSelection);
    // TODO query for version data to populate details
    this.setState({selectedVersionDetails: undefined})

    vscode.postMessage({
      command: 'selectVersion',
      version: newSelection,
      package: this.state.component
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
    }
    return (
      <div>
        <div className="sidenav">
          <h1>Versions</h1>
          <VersionsContextProvider value={this.state}>
            <AllVersionsPage
              versionChangeHandler={_this.handleVersionSelection.bind(_this)}>
            </AllVersionsPage>
          </VersionsContextProvider>
        </div>
        <div className="main">
          <SelectedVersionDetails
            selectedVersionDetails={this.state.selectedVersionDetails}
          />
        </div>
      </div>
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
          this.setState({component: component, allVersions: [], selectedVersionDetails: undefined});
          this.handleVersionSelection(message.component.version)
          break;
        case 'versionDetails':
          console.log("Selected version details received", message.componentDetails);
          this.setState({selectedVersionDetails: message.componentDetails, 
            selectedVersion: message.componentDetails.component.componentIdentifier.coordinates.version,
            initialVersion: message.componentDetails.component.componentIdentifier.coordinates.version
          })
          break;
        case 'allversions':
          console.debug("App handling allVersions message", message);
          this.setState({allVersions: message.allversions});
          break;
        }
    });
  }
}

export default App;
