import * as React from 'react';
import { VersionInfo } from 'ext-src/VersionInfo';

//import logo from './logo.svg';
type Props = {
  component: any,
  allVersions: VersionInfo[],
  versionChangeHandler: (version: string) => void
};
// todo declare more details on component
type State = {
  selectedVersion: string
};

class AllVersionsPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedVersion: props.component.version
    }
  }

  private versionChanged(newVersion: string) {
    console.log("AllVersionsPage version change received: ", newVersion);
    this.setState({selectedVersion: newVersion});
  }

  public render() {
    var _this = this;
    console.log("AllVersionsPage rendering", this.props.allVersions)
    if (!this.props.allVersions || this.props.allVersions.length <= 0) {
      return(
        <h3>No data available</h3>
      );
    }
    var versionRows = this.props.allVersions.map(function(row: VersionInfo) {
      console.log("AllVersions row: ", row);
      return (
        <VersionRow version={row.displayName.version}
          selectedVersion={_this.state.selectedVersion}
          initialVersion={""}
          versionChangeHandler={_this.versionChanged.bind(_this)}
          />
      );
    });

    return (
      <div>
        <table>
          {versionRows}
        </table>
      </div>
    );
  }
}

type RowProps = {
  version: string,
  selectedVersion: string,
  initialVersion: string,
  versionChangeHandler: (version: string) => void
};
type RowState = {}

class VersionRow extends React.Component<RowProps, RowState> {
  private handleClick(e: any) {
    console.log("row clicked, event:", e);
    this.props.versionChangeHandler(this.props.version);
  }
  public render() {
    var _this = this;
    var classname = this.props.version == this.props.selectedVersion ? "selected-version" :
      (this.props.version == this.props.initialVersion ? "current-version" : "")
    return (
      <tr onClick={_this.handleClick.bind(_this)} className={classname}>
        <td>{this.props.version}</td>
      </tr>
    );
  }
}

export default AllVersionsPage;
