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
import { Table } from 'react-bootstrap';

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
      return (
        <React.Fragment>
            { this.printVulnerabitilies(this.props.vulnerabilities) }
        </React.Fragment>
      )
    } else {
      return this.noVulnerabilitiesFound();
    }
  }

  private noVulnerabilitiesFound() {
    console.debug("No vulnerabilities found");
    return (
      <h2>No Vulnerabilities Found</h2>
    );
  }

  private printVulnerabitilies(vulnerabilities: any[]) {
    console.debug("Printing vulnerability", vulnerabilities);

    return (
      <Table variant="dark">
        <thead>
          <tr>
            Vulnerability
          </tr>
        </thead>
        <tbody>
          { vulnerabilities.map(this.printVulnerability) }
        </tbody>
      </Table>
    )
  }

  private printVulnerability(vulnerability: any) {
    return (
      <tr>
        { vulnerability.description }
      </tr>
    )
  }
}

export default OssIndexSecurityInfo;
