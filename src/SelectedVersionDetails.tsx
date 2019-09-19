import * as React from 'react';
import LicensingPage from './LicensingPage';
import { VersionInfo } from 'ext-src/VersionInfo';
import ComponentInfoPage from './ComponentInfoPage';
import SecurityPage from './SecurityPage';

type Props = {
  component?: any,
  selectedVersion?: VersionInfo
}

type State = {
}

class SelectedVersionDetails extends React.Component<Props, State> {
  public render() {
    return (
      <div >
            <h1>Component Info</h1>
            <ComponentInfoPage component={this.props.component}
              version={this.props.selectedVersion!}></ComponentInfoPage>
            <h1>Security</h1>
            <SecurityPage securityData={this.props.component.nexusIQData.securityData}></SecurityPage>
            <h1>Licensing</h1>
            <LicensingPage licenseData={this.props.component.nexusIQData.licenseData}></LicensingPage>
      </div>
    );
  }
}

export default SelectedVersionDetails;
