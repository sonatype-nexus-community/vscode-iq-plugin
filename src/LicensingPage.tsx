import * as React from 'react';
import LicensingDisplay from './LicensingDisplay';

type Props = {
  licenseData: any
}

type State = {
}

class LicensingPage extends React.Component<Props, State> {
  public render() {
    return (
      <div >
        <h3>Declared Licenses</h3>
        {this.props.licenseData.declaredLicenses.map(function(license: any, index: number) {
          return <LicensingDisplay licenseData={license} />
        })}
        <h3>Observed Licenses</h3>
        {this.props.licenseData.observedLicenses.map(function(license: any, index: number) {
          return <LicensingDisplay licenseData={license} />
        })}
      </div>
    );
  }
}

export default LicensingPage;
