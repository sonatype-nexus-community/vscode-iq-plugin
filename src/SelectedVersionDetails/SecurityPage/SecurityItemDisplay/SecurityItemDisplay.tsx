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
import { FaChevronRight } from 'react-icons/fa';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import ClassNameUtils from '../../../utils/ClassNameUtils';
import Remediation from './Remediation/Remediation';
import CveDetails from './CveDetails/CveDetails';

type State = {
}

type Props = {
  securityIssue: any,
  nexusArtifact: any,
  remediationEvent: (nexusArtifact: any, cve: string) => void
}

class SecurityItemDisplay extends React.Component<Props, State> {
  public render() {
    return (
      <Card>
        <Accordion.Toggle 
          as={Card.Header} 
          eventKey={this.props.securityIssue.reference} 
          onClick={this.props.remediationEvent.bind(this, this.props.nexusArtifact, this.props.securityIssue.reference)}
          >
          { this.props.securityIssue.reference } <FaChevronRight /> 
          <Badge 
            className={ClassNameUtils.threatClassName(this.props.securityIssue.severity)}>
              CVSS: {this.props.securityIssue.severity}
          </Badge>
        </Accordion.Toggle>
        <Accordion.Collapse eventKey={this.props.securityIssue.reference}>
          <Card.Body>
            <Table variant="dark">
              <tbody>
                <tr>
                  <td>Severity:</td>
                  <td><Badge className={ClassNameUtils.threatClassName(this.props.securityIssue.severity)}>{this.props.securityIssue.severity}</Badge></td>
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
                <tr>
                  <td colSpan={2}>
                    <CveDetails />
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <Remediation />
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  }
}

export default SecurityItemDisplay;
