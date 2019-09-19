import * as React from 'react';
import LicensingPage from './LicensingPage';
import ComponentInfoPage from './ComponentInfoPage';
import SecurityPage from './SecurityPage';

type Props = {
  selectedVersionDetails?: any
}

type State = {
}

class SelectedVersionDetails extends React.Component<Props, State> {
  public render() {
    if (!this.props.selectedVersionDetails) {
      console.log("SelectedVersionDetails page rendering no content, props: ", this.props)
      return (
        <h1>Select a version to render details</h1>
      );
    }
    console.log("SelectedVersionDetails page rendering, props: ", this.props)
    return (
      <div >
            <h1>Component Info</h1>
            <ComponentInfoPage selectedVersionDetails={this.props.selectedVersionDetails!}></ComponentInfoPage>
            <h1>Security</h1>
            <SecurityPage securityData={this.props.selectedVersionDetails.securityData}></SecurityPage>
            <h1>Licensing</h1>
            <LicensingPage licenseData={this.props.selectedVersionDetails.licenseData}></LicensingPage>
      </div>
    );
  }
}

export default SelectedVersionDetails;
