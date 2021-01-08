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
import ReactMarkdown from 'react-markdown';
import { VersionsContextConsumer } from '../../../../../../context/versions-context';

type Props = {
}

type State = {
}

class CveDetails extends React.Component<Props, State> {
  public render() {
    return (
      <VersionsContextConsumer>
        {context => context && context.vulnDetails && (
          <React.Fragment>
            <h4>Detection</h4>
            <p>
              <ReactMarkdown children={context.vulnDetails.detectionMarkdown} />
            </p>
            <h4>Explanation</h4>
            <p>
              <ReactMarkdown children={context.vulnDetails.explanationMarkdown} />
            </p>
            <h4>Recommendation</h4>
            <p>
              <ReactMarkdown children={context.vulnDetails.recommendationMarkdown} />
            </p>
          </React.Fragment>
        )}
      </VersionsContextConsumer>
    );
  }
}

export default CveDetails;
