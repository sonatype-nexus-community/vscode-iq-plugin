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
import React, { 
  useContext, 
  useState } from 'react';
import { 
  VersionsContext, 
  VersionsContextInterface } from '../../../../context/versions-context';
import { 
  NxAccordion, 
  NxPolicyViolationIndicator } from '@sonatype/react-shared-components';

const PolicyPage = () => {

  const [open, setOpen] = useState(false);

  const versionContext = useContext(VersionsContext);

  const renderPolicyViolation = (versionContext: VersionsContextInterface | undefined) => {
    if (versionContext && versionContext.policyViolations) {
      return (
        <React.Fragment>
          { versionContext.policyViolations.map((x: any) => printPolicyViolation(x)) }
        </React.Fragment>
      )
    }
    return null;
  }

  const printPolicyViolation = (policyViolation: any) => {
    return (
      <NxAccordion open={ open } onToggle={setOpen}>
        <NxAccordion.Header>
        <h2 className="nx-accordion__header-title">
            { policyViolation.policyName }
          </h2>
          <div className="nx-btn-bar">
            <NxPolicyViolationIndicator 
              policyThreatLevel={ policyViolation.policyThreatLevel } 
              />
          </div>
        </NxAccordion.Header>
          <h2 className="nx-h2">
            Threat Level: { policyViolation.policyThreatLevel }
          </h2>
            { policyViolation.constraints.map((x: any) => (
            <React.Fragment>
              <h3 className="nx-h3">Constraint: { x.constraintName }</h3>
              <h3 className="nx-h3">Reasons</h3>
              <ul className="nx-list">
                { x.conditions.map((y: any) => (
                  <li className="nx-list__item">
                    <span className="nx-list__text">
                      { y.conditionReason }
                    </span>
                  </li>
                ))}
              </ul>
            </React.Fragment>
          ))}
      </NxAccordion>
    );
  }

  return (
    renderPolicyViolation(versionContext)
  )
}

  // setSelected = (policyId: string) => {
  //   console.log(policyId);
  //   if (this.state != undefined) {
  //     if (this.state.selected.get(policyId) != undefined) {
  //       let mutatedMap = this.state.selected;
  //       mutatedMap.delete(policyId);
  //       this.setState({
  //         selected: mutatedMap
  //       });
  //     } else {
  //       let mutatedMap = this.state.selected;
  //       mutatedMap.set(policyId, "active");
  //       this.setState({
  //         selected: mutatedMap
  //       });
  //     }
  //   }
  // }

export default PolicyPage;