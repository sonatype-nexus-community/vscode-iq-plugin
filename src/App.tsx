import * as React from 'react';
import Loader from 'react-loader-spinner';
import { VersionInfo } from 'ext-src/VersionInfo';
import AllVersionsPage from './AllVersionsPage';
import SelectedVersionDetails from './SelectedVersionDetails';

// add workarounds to call VSCode
declare var acquireVsCodeApi: any;
// interface VScode {
//   postMessage(message: any): void;
// }
const vscode: any = acquireVsCodeApi();


type AppProps = {
};
// todo declare more details on component
type AppState = {
  component: any,
  allVersions: VersionInfo[],
  selectedVersion?: VersionInfo,
  selectedVersionNumber?: string
};
class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      component: {},
      allVersions: [],
      selectedVersion: undefined
    }
  }

  public handleVersionSelection(newSelection: string) {
    console.log("App received version change", newSelection);
    // TODO query for version data to populate details
    //this.setState({selectedVersionNumber: newSelection, selectedVersion: undefined})

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
          <AllVersionsPage
              component={this.state.component}
              allVersions={this.state.allVersions}
              versionChangeHandler={_this.handleVersionSelection.bind(_this)}></AllVersionsPage>
        </div>
        <div className="main">
          <SelectedVersionDetails
            selectedVersion={this.state.selectedVersion}
            component={this.state.component}
          />
        </div>
      </div>
    );
  }

  public componentDidMount() {
    window.addEventListener('message', event => {
      const message = event.data;
      console.log("received message", message);
      switch (message.command) {
        case 'artifact':
          console.log("Artifact received, updating state & children", message.component);
          const component = message.component;
          const versionInfo = {
            popularity: component.nexusIQData.popularity,
            threatLevel: 0,
            displayName: {
              packageId: component.name,
              version: component.version
            }
          };
          this.setState({component: component, selectedVersion: versionInfo});
          break;
        // case 'settings':
        //     console.log("Settings received, updating state & children");
        //     const settings = message.settings;
        //     this.setState({settings: {
        //       serverName: settings.serverName,
        //       appInternalId: settings.appInternalId,
        //       username: settings.username,
        //       password: settings.password
        //     }});
        //     break;
        case 'allversions':
          console.log("AllVersions received, showing version graph", message.allversions);
          let versionArray = message.allversions as VersionInfo[];
          this.setState({allVersions: versionArray, selectedVersion: versionArray[0]});
          break;
        }
    });
  }
}

export default App;
