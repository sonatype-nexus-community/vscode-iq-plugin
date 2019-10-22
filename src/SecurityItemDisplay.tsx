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

type State = {
}

type Props = {
  securityIssue: any
}

class SecurityItemDisplay extends React.Component<Props, State> {
  public render() {
    return (
      <Table>
        <thead>
          <tr>
            <th>
              Issue: {this.props.securityIssue.reference}
            </th>
            <th>
              CVSS: {this.props.securityIssue.severity}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Severity:</td>
            <td>{this.props.securityIssue.severity}</td>
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
            <td>{this.props.securityIssue.url}</td>
          </tr>
        </tbody>
      </Table>
    );
  }
}

export default SecurityItemDisplay;
