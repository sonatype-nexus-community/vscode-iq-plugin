import * as React from 'react';

//import logo from './logo.svg';
type Props = {
  allVersions: any[],
  initialVersion: string,
  selectedVersion: string,
  versionChangeHandler: (version: string) => void
};
// todo declare more details on component
type State = {
  selectedVersion: string
};

class AllVersionsPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    console.log("AllVersionPage created with properties", props);
    this.state = {
      selectedVersion: props.selectedVersion
    }
  }

  private versionChanged(newVersion: string) {
    console.log("AllVersionsPage version change received: ", newVersion);
    this.setState({selectedVersion: newVersion});
    this.props.versionChangeHandler(newVersion);
  }

  public render() {
    var _this = this;
    if (!this.props.allVersions || this.props.allVersions.length <= 0) {
      console.log("AllVersions page showing no data available", this.props);
      return(
        <h3>No data available</h3>
      );
    }
    console.log("AllVersionsPage rendering", this.props.allVersions)
    var versionRows = this.props.allVersions.map(function(row: any) {
      return (
        <VersionRow version={row.componentIdentifier.coordinates.version}
          selectedVersion={_this.state.selectedVersion}
          initialVersion={_this.props.initialVersion}
          threatLevel={row.highestSecurityVulnerabilitySeverity}
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

  public componentDidMount() {
    var initialRow:any = document.getElementsByClassName("glyphicon-check")
    if (!initialRow) {
      initialRow = document.getElementsByClassName("glyphicon-chevron-right")
    }
    for (let item of initialRow) {
      // TODO why doesn't this work?
      item.scrollIntoView();
    }
  }
}

type RowProps = {
  version: string,
  selectedVersion: string,
  initialVersion: string,
  threatLevel: number,
  versionChangeHandler: (version: string) => void
};
type RowState = {}

class VersionRow extends React.Component<RowProps, RowState> {
  public render() {
    var _this = this;
    return (
      <tr onClick={_this.handleClick.bind(_this)} className={this.threatClassName()}>
        <td><span className={this.selectedClassName()}/>{this.props.version}: {this.props.threatLevel}</td>
      </tr>
    );
  }
  private selectedClassName() {
    if (this.props.selectedVersion == this.props.version) {
      return "glyphicon glyphicon-chevron-right"
    } else if (this.props.initialVersion == this.props.version) {
      return "glyphicon glyphicon-check"
    } else {
      return "glyphicon glyphicon-unchecked"
    }
  }
  private threatClassName() {
    if (this.props.threatLevel < 1) {
      return "bg-primary"
    } else if (this.props.threatLevel < 2) {
      return "threat-low"
    } else if (this.props.threatLevel < 4) {
      return "threat-mid"
    } else if (this.props.threatLevel < 8) {
      return "threat-high"
    } else {
      return "threat-critical"
    }
  }
  private handleClick(e: any) {
    console.log("row clicked, event:", e);
    console.log("row clicked, AllVersionsPage props: ", this.props);
    this.props.versionChangeHandler(this.props.version);
  }
}

export default AllVersionsPage;
