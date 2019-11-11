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
import { VersionsContext } from '../../context/versions-context';

type Props = {
};
// todo declare more details on component
type State = {
};

class PolicyPage extends React.Component<Props, State> {
  static contextType = VersionsContext;

  constructor(props: Props) {
    super(props);
  }

  public render() {
    console.debug("Policy Page rendering");
    return (
        <React.Fragment>
            {this.context && this.context.policyViolations && (
              this.context.policyViolations.map(function(policyViolation: any) {
              <h2 key={policyViolation.policyId}>
                {policyViolation.policyName}
              </h2>
            })
          )}
        </React.Fragment>
    );
  }
}

export default PolicyPage;
