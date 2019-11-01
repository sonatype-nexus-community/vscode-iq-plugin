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
import SecurityItemDisplay from './SecurityItemDisplay/SecurityItemDisplay';
import Accordion from 'react-bootstrap/Accordion';
import { VersionsContextConsumer } from '../../context/versions-context';

type State = {
}

type Props = {}

class SecurityPage extends React.Component<State, Props> {
  public render() {
    return (
      <VersionsContextConsumer>
        {context => context && context.selectedVersionDetails && (
          <Accordion>
            {context.selectedVersionDetails.securityData.securityIssues.map(function(issue: any) {
              return <SecurityItemDisplay securityIssue={issue} />
            })}
          </Accordion>
        )}
      </VersionsContextConsumer>
    );
  }
}

export default SecurityPage;
