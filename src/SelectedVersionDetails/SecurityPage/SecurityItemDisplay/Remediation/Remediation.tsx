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
import { VersionsContextConsumer } from '../../../../context/versions-context';

type Props = {
}

type State = {
}

class Remediation extends React.Component<Props, State> {
  public render() {
    console.debug("Remediation section rendering");
    return (
      <VersionsContextConsumer>
        { context => context && context.remediation && (
          Object.keys(context.remediation.versionChanges).map(val => (
            <React.Fragment>
              <h2>Remediation Type: {context.remediation.versionChanges[val].type}</h2>
              Upgrade to this version: {context.remediation.versionChanges[val].data.component.componentIdentifier.coordinates.version}
            </React.Fragment>
            )
          )           
        )}
      </VersionsContextConsumer>
    );
  }
}

export default Remediation;
