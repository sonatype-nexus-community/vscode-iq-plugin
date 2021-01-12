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
import React, { useContext } from 'react';
import { 
  OssIndexContextInterface, 
  OssIndexContext } from '../../../../context/ossindex-context';
import OssIndexVulnerability from './OssIndexVulnerability/OssIndexVulnerability';

const OssIndexSecurityInfo = () => {

  const ossIndexContext = useContext(OssIndexContext);

  const noVulnerabilitiesFound = () => {
    return (
      <h2>No Vulnerabilities Found</h2>
    );
  }

  const renderVulnerabilities = (ossIndexContext: OssIndexContextInterface | undefined) => {
    if (ossIndexContext && ossIndexContext.vulnerabilities && ossIndexContext.vulnerabilities.length > 0) {
      return (
        <React.Fragment>
          <h3>Vulnerabilities</h3>
          { ossIndexContext.vulnerabilities.map((vuln) => {
            return <OssIndexVulnerability vulnerability={vuln} />
          })}
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
