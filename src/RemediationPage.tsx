import * as React from 'react';
import VersionGraph from './VersionGraph';
import { VersionInfo } from './VersionInfo';

//import logo from './logo.svg';
type Props = {
  component: any,
  allVersions: VersionInfo[]
};
// todo declare more details on component
type State = {};

class RemediationPage extends React.Component<Props, State> {
  public render() {
    return (
      <VersionGraph allVersions={this.props.allVersions}></VersionGraph>
    );
  }
}

export default RemediationPage;
