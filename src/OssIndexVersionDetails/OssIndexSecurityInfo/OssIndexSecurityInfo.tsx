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

type OssCipProps = {
  vulnerabilities: any[]
};
// todo declare more details on component
type OssCipState = {
};

class OssIndexSecurityInfo extends React.Component<OssCipProps, OssCipState> {
  constructor(props: OssCipProps) {
    super(props);
  }

  public render() {
    if (this.props.vulnerabilities && this.props.vulnerabilities.length > 0) {
      Object.keys(this.props.vulnerabilities).forEach(x => {
        return this.printVulnerability(this.props.vulnerabilities[x])
      })
    }
    return this.noVulnerabilitiesFound();
  }

  private noVulnerabilitiesFound() {
    console.debug("No vulnerabilities found");
    return (
      <h2>No Vulnerabilities Found</h2>
    );
  }

  private printVulnerability(vulnerability: any) {
    console.debug("Printing vulnerability", vulnerability)
    return (
      <Table variant="dark">
        <thead>
          <tr>
            <th colSpan={2}>
              {vulnerability.title}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Description:</td>
            <td>{vulnerability.description}</td>
          </tr>
          <tr>
            <td>CVSS Score:</td>
            <td><span id="cvssScore">{vulnerability.cvssScore}</span></td>
          </tr>
          <tr>
            <td>CVSS Vector:</td>
            <td><span id="cvssVector">{vulnerability.cvssVector}</span></td>
          </tr>
          <tr>
            <td>Link For Info:</td>
            <td>{vulnerability.reference}</td>
          </tr>
        </tbody>
      </Table>
    )
  }
}

export default OssIndexSecurityInfo;
