import * as React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import RemediationPage from './RemediationPage';
import ComponentInfoPage from './ComponentInfoPage';
import SecurityPage from './SecurityPage';
import LicensingPage from './LicensingPage';


//import logo from './logo.svg';

class App extends React.Component {
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
          <ComponentInfoPage></ComponentInfoPage>
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
}

export default App;
