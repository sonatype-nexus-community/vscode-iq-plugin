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

type State = {
}

type Props = {
  securityIssue: any
}

class SecurityItemDisplay extends React.Component<Props, State> {
  // TODO: This is duplicated from AllVersionsPage, and we should really just have a util class for it, or something akin
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
      <Card>
        <Accordion.Toggle as={Card.Header} eventKey={this.props.securityIssue.reference}>
          {this.props.securityIssue.reference} <FaChevronRight /> <Badge variant={this.threatClassName()} className="float-right">CVSS: {this.props.securityIssue.severity}</Badge>
        </Accordion.Toggle>
        <Accordion.Collapse eventKey={this.props.securityIssue.reference}>
          <Card.Body>
            <Table variant="dark">
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
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    );
  }
}

export default SecurityItemDisplay;
