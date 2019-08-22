import * as React from 'react';
import { VersionInfo } from 'ext-src/VersionInfo';
import VersionGraph from './VersionGraph';

//import logo from './logo.svg';
type Props = {
  component: any,
  allVersions: VersionInfo[]
};
// todo declare more details on component
type State = {};

class RemediationPage extends React.Component<Props, State> {
  private containerStyle = {
    overflowX: 'scroll' as 'scroll'
  }
  public render() {
    return (
      <div style={this.containerStyle}>
        <VersionGraph allVersions={this.props.allVersions}></VersionGraph>
      </div>
    );
  }
}

export default RemediationPage;
