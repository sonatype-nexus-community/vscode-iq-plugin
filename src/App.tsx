import * as React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import RemediationPage from './RemediationPage';
import ComponentInfoPage from './ComponentInfoPage';
import SecurityPage from './SecurityPage';
import LicensingPage from './LicensingPage';
import Loader from 'react-loader-spinner';
import { VersionInfo } from 'ext-src/VersionInfo';

type AppProps = {
};
// todo declare more details on component
type AppState = { 
  component: any,
  allVersions: VersionInfo[],
  selectedVersion?: VersionInfo
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

  public handleVersionSelection(newSelection: VersionInfo) {
    this.setState({selectedVersion: newSelection})
  }

  public render() {
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
      <Tabs id="remediation-tab">
        <TabList>
          <Tab>Component Info</Tab>
          <Tab>Security</Tab>
          <Tab>Licensing</Tab>
        </TabList>
        <TabPanel>
          <h1>Remediation</h1>
          <RemediationPage
            component={this.state.component}
            allVersions={this.state.allVersions}
            versionChangeHandler={this.handleVersionSelection}></RemediationPage>
          <h1>Component Info</h1>
          <ComponentInfoPage component={this.state.component}
            version={this.state.selectedVersion!}></ComponentInfoPage>
        </TabPanel>
        <TabPanel>
          <h1>Security</h1>
          <SecurityPage></SecurityPage>
        </TabPanel>
        <TabPanel>
          <h1>Licensing</h1>
          <LicensingPage></LicensingPage>
        </TabPanel>
      </Tabs>
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
