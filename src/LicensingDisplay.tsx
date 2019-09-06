import * as React from 'react';


type Props = {
  licenseData: any
}
type State = {
}

class LicensingDisplay extends React.Component<Props, State> {
  public render() {
    return (
      <div >
        Id: {this.props.licenseData.licenseId} / Name: {this.props.licenseData.licenseName}
      </div>
    );
  }
}

export default LicensingDisplay;
