import * as React from 'react';
import { VersionInfo } from 'ext-src/VersionInfo';
import VersionGraph from './VersionGraph';

//import logo from './logo.svg';
type Props = {
  component: any,
  allVersions: VersionInfo[],
  versionChangeHandler: (version: VersionInfo) => void
};
// todo declare more details on component
type State = {
  selectedVersion: VersionInfo
};

class RemediationPage extends React.Component<Props, State> {
  private containerStyle = {
    overflowX: 'scroll' as 'scroll'
  }
  public render() {
    return (
      <div style={this.containerStyle}>
        <VersionGraph
          allVersions={this.props.allVersions} 
          versionChangeHandler={this.props.versionChangeHandler}
        />
      </div>
    );
  }
}

export default RemediationPage;
