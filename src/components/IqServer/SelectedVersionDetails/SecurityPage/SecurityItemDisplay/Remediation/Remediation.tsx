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
import { VersionsContext, VersionsContextInterface } from '../../../../../../context/versions-context';

const Remediation = () => {

  const versionsContext = useContext(VersionsContext);

  const renderRemediation = (versionsContext: VersionsContextInterface | undefined) => {
    if (versionsContext && versionsContext.remediation && versionsContext.remediation.versionChanges) {
      return versionsContext.remediation.versionChanges.map((version: any) => {
        <React.Fragment>
          <h2>Remediation Type: { version.type }</h2>
          Upgrade to this version: { version.data.component.componentIdentifier.coordinates.version }
        </React.Fragment>
      })
    }
    return null;
  }

  return (
    renderRemediation(versionsContext)
  )
}

export default Remediation;
