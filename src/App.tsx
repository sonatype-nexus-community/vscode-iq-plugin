import * as React from 'react';
import Loader from 'react-loader-spinner';
import { VersionInfo } from 'ext-src/VersionInfo';
import AllVersionsPage from './AllVersionsPage';
import SelectedVersionDetails from './SelectedVersionDetails';

// add workarounds to call VSCode
declare var acquireVsCodeApi: any;
const vscode: any = acquireVsCodeApi();


type AppProps = {
};
// todo declare more details on component
type AppState = {
  component: any,
  allVersions: VersionInfo[],
  selectedVersionDetails?: any
};
class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    console.log("App constructing, props:", props);
    this.state = {
      component: {},
      allVersions: [],
      selectedVersionDetails: undefined
    }
  }

  public handleVersionSelection(newSelection: string) {
    console.log("App received version change", newSelection);
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
          <AllVersionsPage
              component={this.state.component}
              allVersions={this.state.allVersions}
              versionChangeHandler={_this.handleVersionSelection.bind(_this)}></AllVersionsPage>
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
      console.log("App received VS message", message);
      switch (message.command) {
        case 'artifact':
          console.log("Artifact received, updating state & children", message.component);
          const component = message.component;
          //this.setState({component: component, selectedVersionDetails: component.nexusIQData});
          this.setState({component: component, selectedVersionDetails: undefined});
          this.handleVersionSelection(message.component.version)
          break;
        case 'versionDetails':
          console.log("Selected version details received", message.componentDetails);
          this.setState({selectedVersionDetails: message.componentDetails})
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
          console.log("App handling allVersions message", message);
          let versionArray = message.allversions as VersionInfo[];
          this.setState({allVersions: versionArray});
          break;
        }
    });
  }
}

export default App;
