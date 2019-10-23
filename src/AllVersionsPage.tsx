/*
 * Copyright (c) 2019-present Sonatype, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from 'react';
import { FaChevronRight, FaCheckSquare, FaSquare } from 'react-icons/fa';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';

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
    console.debug("AllVersionPage created with properties", props);
    this.state = {
      selectedVersion: props.selectedVersion
    }
  }

  private versionChanged(newVersion: string) {
    console.debug("AllVersionsPage version change received: ", newVersion);
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
      <React.Fragment>
        {versionRows}
      </React.Fragment>
    );
  }

  public componentDidMount() {
    // TODO: No longer using Glyphicons, probably need to clean this up
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
        <Alert variant={this.threatClassName()} onClick={_this.handleClick.bind(_this)}>
          {this.selectedClassName()} {this.props.version} <Badge variant={this.threatClassName()} className="float-right">CVSS: {this.props.threatLevel}</Badge>
        </Alert>
    );
  }
  private selectedClassName() {
    if (this.props.selectedVersion == this.props.version) {
      return (
        <FaChevronRight />
      )
    } else if (this.props.initialVersion == this.props.version) {
      return (
        <FaCheckSquare />
      )
    } else {
      return (
        <FaSquare />
      )
    }
  }
  private threatClassName() {
    if (this.props.threatLevel < 1) {
      return "primary"
    } else if (this.props.threatLevel < 2) {
      return "info"
    } else if (this.props.threatLevel < 4) {
      return "secondary"
    } else if (this.props.threatLevel < 8) {
      return "warning"
    } else {
      return "danger"
    }
  }

  private handleClick(e: any) {
    console.debug("row clicked, event:", e);
    console.debug("row clicked, AllVersionsPage props: ", this.props);
    this.props.versionChangeHandler(this.props.version);
  }
}

export default AllVersionsPage;
