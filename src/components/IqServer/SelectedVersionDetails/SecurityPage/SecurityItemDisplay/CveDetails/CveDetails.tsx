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
        { context => context && context.vulnDetails && (
          <React.Fragment>
            <h6>Issue</h6>
            <p>
              { context.vulnDetails.identifier }
            </p>
            <h6>Severity</h6>
            { context.vulnDetails.severityScores.map((score) => (
              <p>
                { score.source + ": " + score.score }
              </p>
            ))}
            <h6>Weakness</h6>
            <p>
              {context.vulnDetails.weakness.cweIds.map((weakness) => (
                <React.Fragment>
                  { context.vulnDetails!.weakness.cweSource + " CWE: " }
                  <a 
                    href={ weakness.uri } 
                    target="_blank">
                      { weakness.id }
                    </a>
                </React.Fragment>
              ))}
            </p>
            <h6>Source</h6>
            <p>
              { context.vulnDetails.source.longName }
            </p>
            <h6>Categories</h6>
            { context.vulnDetails.categories.map((val) => (
              <p>
                {val}
              </p>
            ))}
            <h5>Detection</h5>
            <p>
              <ReactMarkdown children={ context.vulnDetails.detectionMarkdown } />
            </p>
            <h5>Explanation</h5>
            <p>
              <ReactMarkdown children={ context.vulnDetails.explanationMarkdown } />
            </p>
            <h5>Recommendation</h5>
            <p>
              <ReactMarkdown children={ context.vulnDetails.recommendationMarkdown } />
            </p>
            <h6>Advisories</h6>
            { context.vulnDetails.advisories.map((advisory) => (
              <p>
                { advisory.referenceType + ": " } <a href={ advisory.url } target="_blank">{ advisory.url }</a>
              </p>
            ))}
            <h6>CVSS Details</h6>
            <p>
              { context.vulnDetails.mainSeverity.source + ": " + context.vulnDetails.mainSeverity.score}
            </p>
            <p>
              CVSS Vector: { context.vulnDetails.mainSeverity.vector }
            </p>
          </React.Fragment>
        )}
      </VersionsContextConsumer>
    );
  }
}

export default CveDetails;
