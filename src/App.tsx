import * as React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import RemediationPage from './RemediationPage';
import ComponentInfoPage from './ComponentInfoPage';
import SecurityPage from './SecurityPage';
import LicensingPage from './LicensingPage';
import { VersionInfo } from 'ext-src/VersionInfo';
import Loader from 'react-loader-spinner';

type AppProps = {
};
// todo declare more details on component
type AppState = { 
  component: any,
  allVersions: VersionInfo[]
};
class App extends React.Component<AppProps, AppState> {

  constructor(props: AppProps) {
    super(props);
    this.state = {
      component: {},
      allVersions: []
    }
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
            allVersions={this.state.allVersions}></RemediationPage>
          <h1>Component Info</h1>
          <ComponentInfoPage component={this.state.component}></ComponentInfoPage>
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
          this.setState({component: component});
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
          this.setState({allVersions: versionArray})
          break;
        }
    });
  }
}

export default App;
