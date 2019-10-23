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
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';

type State = {
}

type Props = {
  securityIssue: any
}

class SecurityItemDisplay extends React.Component<Props, State> {
  private threatClassName() {
    if (this.props.securityIssue.severity < 1) {
      return "primary"
    } else if (this.props.securityIssue.severity < 2) {
      return "info"
    } else if (this.props.securityIssue.severity < 4) {
      return "secondary"
    } else if (this.props.securityIssue.severity < 8) {
      return "warning"
    } else {
      return "danger"
    }
  }
  
  public render() {
    return (
      <Table variant="dark">
        <thead>
          <tr>
            <th>
              Issue: <Badge variant={this.threatClassName()}>{this.props.securityIssue.reference}</Badge>
            </th>
            <th>
              CVSS: <Badge variant={this.threatClassName()}>{this.props.securityIssue.severity}</Badge>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Severity:</td>
            <td><Badge variant={this.threatClassName()}>{this.props.securityIssue.severity}</Badge></td>
          </tr>
          <tr>
            <td>Source:</td>
            <td>{this.props.securityIssue.source}</td>
          </tr>
          <tr>
            <td>Threat Category:</td>
            <td>{this.props.securityIssue.threatCategory}</td>
          </tr>
          <tr>
            <td>URL:</td>
            <td>
              { this.props.securityIssue.url != "" &&
              <a href={this.props.securityIssue.url}>{this.props.securityIssue.url}</a>
              }
            </td>
          </tr>
        </tbody>
      </Table>
    );
  }
}

export default SecurityItemDisplay;
