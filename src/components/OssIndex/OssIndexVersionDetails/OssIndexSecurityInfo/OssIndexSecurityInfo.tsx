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
import React, { useContext, useState } from 'react';
import { 
  NxAccordion, 
  NxPolicyViolationIndicator, 
  ThreatLevelNumber, 
  NxTable, 
  NxTableRow,
  NxTableBody, 
  NxTableCell } from '@sonatype/react-shared-components';
import { 
  OssIndexContextInterface, 
  OssIndexContext } from '../../../../context/ossindex-context';

const OssIndexSecurityInfo = () => {

  const [open, setOpen] = useState(false);

  const ossIndexContext = useContext(OssIndexContext);

  const noVulnerabilitiesFound = () => {
    return (
      <h2>No Vulnerabilities Found</h2>
    );
  }

  const printVulnerabitilies = (vulnerabilities: any[]) => {
    return (
      vulnerabilities.map(printVulnerability)
    )
  }

  const printVulnerability = (vulnerability: any) => {
    return (
      <NxAccordion open={open} onToggle={setOpen}>
        <NxAccordion.Header>
        <h2 className="nx-accordion__header-title">
          { vulnerability.title }
        </h2>
        <div className="nx-btn-bar">
          <NxPolicyViolationIndicator 
            policyThreatLevel={Math.round(vulnerability.cvssScore) as ThreatLevelNumber} 
            />
        </div>
        </NxAccordion.Header>
        <NxTable>
          <NxTableBody>
            <NxTableRow>
              <NxTableCell>
                { vulnerability.description }
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell>
                CVSS Score: { vulnerability.cvssScore }  
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell>
                CVSS Vector: { vulnerability.cvssVector }
              </NxTableCell>
            </NxTableRow>
            <NxTableRow>
              <NxTableCell>
                Click here for more info: <a href={ vulnerability.reference } target="_blank">{ vulnerability.reference }</a>
              </NxTableCell>
            </NxTableRow>
          </NxTableBody>
        </NxTable>
      </NxAccordion>
    )
  }

  const renderVulnerabilities = (ossIndexContext: OssIndexContextInterface | undefined) => {
    if (ossIndexContext && ossIndexContext.vulnerabilities && ossIndexContext.vulnerabilities.length > 0) {
      return (
        <React.Fragment>
            <h3>Vulnerabilities</h3>
            { printVulnerabitilies(ossIndexContext.vulnerabilities) }
        </React.Fragment>
      )
    }
    return noVulnerabilitiesFound();
  }

  return (
    renderVulnerabilities(ossIndexContext)
  )
}

export default OssIndexSecurityInfo;
