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
import { FaChevronRight, FaCheckSquare, FaRegSquare } from 'react-icons/fa';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import { VersionsContextConsumer } from '../context/versions-context';
import ClassNameUtils from '../utils/ClassNameUtils';

type Props = {
  versionChangeHandler: (version: string) => void
};

type State = {
  selectedVersion: string
};

class AllVersionsPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedVersion: ""
    }
  }

  private versionChanged(newVersion: string) {
    console.log("AllVersionsPage version change received: ", newVersion);
    this.setState({selectedVersion: newVersion});
    this.props.versionChangeHandler(newVersion);
  }

  public render() {
    var _this = this;

    return (
      <VersionsContextConsumer>
        {context => (
          <React.Fragment>
            {Object.keys(context!.allVersions).map(row => (
              <VersionRow version={context!.allVersions[row].componentIdentifier.coordinates.version}
                threatLevel={context!.allVersions[row].highestSecurityVulnerabilitySeverity}
                versionChangeHandler={_this.versionChanged.bind(_this)}
              />
            ))}
          </React.Fragment>
        )}
      </VersionsContextConsumer>
    );
  }
}

type RowProps = {
  version: string,
  threatLevel: number,
  versionChangeHandler: (version: string) => void
};
type RowState = {}

class VersionRow extends React.Component<RowProps, RowState> {
  public render() {
    var _this = this;
    return (
      <VersionsContextConsumer>
        { context =>
          <Alert variant="primary" onClick={_this.handleClick.bind(_this)}>
            {this.selectedClassName(context!.selectedVersion, this.props.version, context!.initialVersion)} {this.props.version} <Badge variant={ClassNameUtils.threatClassName(this.props.threatLevel)} className="float-right">CVSS: {this.props.threatLevel}</Badge>
          </Alert>
        }
      </VersionsContextConsumer>   
    );
  }

  private selectedClassName(selectedVersion: string, version: string, initialVersion: string) {
    if (selectedVersion == version) {
      return (
        <FaChevronRight />
      )
    } else if (initialVersion == version) {
      return (
        <FaCheckSquare />
      )
    } else {
      return (
        <FaRegSquare />
      )
    }
  }

  private handleClick(e: any) {
    console.debug("row clicked, event:", e);
    console.debug("row clicked, AllVersionsPage props: ", this.props);
    this.props.versionChangeHandler(this.props.version);
  }
}

export default AllVersionsPage;
