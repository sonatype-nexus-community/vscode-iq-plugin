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

type State = {
}

type Props = {
  securityIssue: any
}

class SecurityItemDisplay extends React.Component<Props, State> {
  public render() {
    return (
      <div>
        <div>
          <h2>Issue: {this.props.securityIssue.reference}</h2>
          <h2>CVSS:{this.props.securityIssue.severity}</h2>
        </div>
        <table>
          <tr>
            <td className="label">Severity:</td>
            <td className="data">{this.props.securityIssue.severity}</td>
          </tr>
          <tr>
            <td className="label">Source:</td>
            <td className="data">{this.props.securityIssue.source}</td>
          </tr>
          <tr>
            <td className="label">Threat Category:</td>
            <td className="data">{this.props.securityIssue.threatCategory}</td>
          </tr>
          <tr>
            <td className="label">URL:</td>
            <td className="data">{this.props.securityIssue.url}</td>
          </tr>
        </table>
      </div>
    );
  }
}

export default SecurityItemDisplay;
