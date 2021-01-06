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
import { VersionsContext } from '../../../../context/versions-context';
import { Accordion, Card } from 'react-bootstrap';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

type Props = {
};
// todo declare more details on component
type State = {
  selected: Map<string, string>
};

class PolicyPage extends React.Component<Props, State> {
  static contextType = VersionsContext;

  constructor(props: Props) {
    super(props);

    this.state = {
      selected: new Map<string, string>()
    }
  }

  public render() {
    console.debug("Policy Page rendering");
    return (
        <React.Fragment>
            {this.context && this.context.policyViolations && (
              this.context.policyViolations.map((x: any, y: any) => this.printPolicyViolation(x, y), this)
              )
            }
        </React.Fragment>
    );
  }

  switchIcon = (policyId: string) => {
    if (this.state != undefined) {
      if (this.state.selected.get(policyId)) {
        return (
          <FaChevronDown />
        )
      } 
    }
    return (
      <FaChevronRight />
    )
  }

  setSelected = (policyId: string) => {
    console.log(policyId);
    if (this.state != undefined) {
      if (this.state.selected.get(policyId) != undefined) {
        let mutatedMap = this.state.selected;
        mutatedMap.delete(policyId);
        this.setState({
          selected: mutatedMap
        });
      } else {
        let mutatedMap = this.state.selected;
        mutatedMap.set(policyId, "active");
        this.setState({
          selected: mutatedMap
        });
      }
    }
  }

  printPolicyViolation = (policyViolation: any, index: number) => {
    const icon = this.switchIcon(index.toString());
    return (
      <Accordion>
        <Card>
          <Accordion.Toggle 
            as={ Card.Header }
            eventKey={ index.toString() } 
            onClick={() => this.setSelected(index.toString())}>
              Policy Violation: { policyViolation.policyName }
            { icon }
          </Accordion.Toggle>
          <Accordion.Collapse eventKey={ index.toString() }>
            <Card.Body>
              Threat Level: { policyViolation.policyThreatLevel }
              { policyViolation.constraints.map((x: any) => (
                <td>
                  <h5>Constraint: { x.constraintName }</h5>
                  <h5>Reasons:</h5>
                  <ol>
                    { x.conditions.map((y: any) => (
                      <li>
                        { y.conditionReason }
                      </li>
                    ))}
                  </ol>
                </td>
              ))}
            </Card.Body>
          </Accordion.Collapse >
        </Card>
      </Accordion>
    );
  }
}

export default PolicyPage;