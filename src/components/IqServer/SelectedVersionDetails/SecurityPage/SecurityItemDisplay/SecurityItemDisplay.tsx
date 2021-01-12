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
import VulnDetails from './VulnDetails/VulnDetails';
import { 
  NxAccordion, 
  NxTable, 
  NxTableRow, 
  NxTableBody, 
  NxTableCell,
  NxPolicyViolationIndicator,
  ThreatLevelNumber } from '@sonatype/react-shared-components';

type SecurityItemProps = {
  securityIssue: any,
  open: boolean,
  packageUrl: string,
  remediationEvent: (packageUrl: string, vulnID: string) => void
}

const SecurityItemDisplay = (props: SecurityItemProps) => {

    return (
      <NxAccordion open={ props.open } onToggle={() => props.remediationEvent(props.packageUrl, props.securityIssue.reference) }>
        <NxAccordion.Header>
          <h2 className="nx-accordion__header-title">
            { props.securityIssue.reference }
          </h2>
          <div className="nx-btn-bar">
            <NxPolicyViolationIndicator 
              policyThreatLevel={Math.round(props.securityIssue.severity) as ThreatLevelNumber} 
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
                <span>{props.securityIssue.severity}</span>
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell>
                Source
              </NxTableCell>
              <NxTableCell>
                {props.securityIssue.source}
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell>
                Threat Category
              </NxTableCell>
              <NxTableCell>
                {props.securityIssue.threatCategory}
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell>
                URL
              </NxTableCell>
              <NxTableCell>
                { props.securityIssue.url != "" &&
                  <a href={props.securityIssue.url}>{props.securityIssue.url}</a>
                }
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell colSpan={2}>
                <VulnDetails />
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

  // dispatchRemedation = () => {
  //   this.props.remediationEvent(
  //     this.props.packageUrl, 
  //     this.props.securityIssue.reference
  //   );

  //   this.setState({
  //     open: !this.state.open
  //   });
  // }

export default SecurityItemDisplay;
