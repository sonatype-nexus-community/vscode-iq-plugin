import * as React from 'react';
import Loader from 'react-loader-spinner';
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
  allVersions: any[],
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
              allVersions={this.state.allVersions}
              initialVersion={this.state.component.version}
              selectedVersion={this.state.component.version}
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
          this.setState({component: component, allVersions: [], selectedVersionDetails: undefined});
          this.handleVersionSelection(message.component.version)
          break;
        case 'versionDetails':
          console.log("Selected version details received", message.componentDetails);
          this.setState({selectedVersionDetails: message.componentDetails})
          break;
        case 'allversions':
          console.log("App handling allVersions message", message);
          this.setState({allVersions: message.allversions});
          break;
        }
    });
  }
}

export default App;
