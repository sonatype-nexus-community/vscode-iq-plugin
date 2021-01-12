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
import Remediation from './Remediation/Remediation';
import CveDetails from './CveDetails/CveDetails';
import { 
  NxAccordion, 
  NxTable, 
  NxTableRow, 
  NxTableBody, 
  NxTableCell,
  NxPolicyViolationIndicator,
  ThreatLevelNumber } from '@sonatype/react-shared-components';

type State = {
  open: boolean
}

type Props = {
  securityIssue: any,
  packageUrl: string,
  remediationEvent: (packageUrl: string, vulnID: string) => void
}

class SecurityItemDisplay extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      open: false
    }
  }

  dispatchRemedation = () => {
    this.props.remediationEvent(
      this.props.packageUrl, 
      this.props.securityIssue.reference
    );

    this.setState({
      open: !this.state.open
    });
  }

  public render() {
    return (
      <NxAccordion open={ this.state.open } onToggle={ this.dispatchRemedation }>
        <NxAccordion.Header>
          <h2 className="nx-accordion__header-title">
            { this.props.securityIssue.reference }
          </h2>
          <div className="nx-btn-bar">
            <NxPolicyViolationIndicator 
              policyThreatLevel={Math.round(this.props.securityIssue.severity) as ThreatLevelNumber} 
              />
          </div>
        </NxAccordion.Header>
        <NxTable>
          <NxTableBody>
            <NxTableRow>
              <NxTableCell>
                Severity
              </NxTableCell>
              <NxTableCell>
                <span>{this.props.securityIssue.severity}</span>
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell>
                Source
              </NxTableCell>
              <NxTableCell>
                {this.props.securityIssue.source}
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell>
                Threat Category
              </NxTableCell>
              <NxTableCell>
                {this.props.securityIssue.threatCategory}
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell>
                URL
              </NxTableCell>
              <NxTableCell>
                { this.props.securityIssue.url != "" &&
                  <a href={this.props.securityIssue.url}>{this.props.securityIssue.url}</a>
                }
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell colSpan={2}>
                <CveDetails />
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell colSpan={2}>
                <Remediation />
              </NxTableCell>
            </NxTableRow>
          </NxTableBody>
        </NxTable>
      </NxAccordion>
    );
  }
}

export default SecurityItemDisplay;
