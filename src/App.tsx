import * as React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import RemediationPage from './RemediationPage';
import ComponentInfoPage from './ComponentInfoPage';
import SecurityPage from './SecurityPage';
import LicensingPage from './LicensingPage';


//import logo from './logo.svg';

type AppProps = {};
// todo declare more details on component
type AppState = { component: any};
class App extends React.Component<AppProps, AppState> {

  constructor(props: AppProps) {
    super(props);
    this.state = {component: {}}
  }
  public render() {
    return (
      <Tabs id="remediation-tab">
        <TabList>
          <Tab>Remediation</Tab>
          <Tab>Component Info</Tab>
          <Tab>Security</Tab>
          <Tab>Licensing</Tab>
        </TabList>
        <TabPanel>
          <h1>Remediation</h1>
          <RemediationPage></RemediationPage>
        </TabPanel>
        <TabPanel>
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
          console.log("Artifact received, updating state & children");
          const component = message.component;
          this.setState({component: component});
          // TODO why doesn't data propagate fully???
          // const cipPageRef = this.cipPage.current;
          // if (cipPageRef == null) {
          //   console.log("CIP Page not initialized");
          // } else {
          //   cipPageRef.changeComponent(component);
          // }
          break;
      }
    });
  }
}

export default App;
