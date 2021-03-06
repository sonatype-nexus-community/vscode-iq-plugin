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
import React, {useContext, useState} from 'react';
import SecurityItemDisplay from './SecurityItemDisplay/SecurityItemDisplay';
import { VersionsContext, VersionsContextInterface } from '../../../../context/versions-context';

const SecurityPage = () => {
  const [open, setOpen] = useState("");

  const versionsContext = useContext(VersionsContext);

  const getRemediationAndOpen = (packageUrl: string, securityIssue: string): void => {
    if (open == securityIssue) {
      setOpen("");
    } else {
      if (versionsContext) {
        versionsContext.handleGetRemediation(packageUrl, securityIssue);
      }
  
      setOpen(securityIssue);
    }
  }

  const isOpen = (issue: string): boolean => {
    return issue == open;
  }

  const renderAccordion = (versionsContext: VersionsContextInterface | undefined) => {
    if (versionsContext 
      && versionsContext.selectedVersionDetails 
      && versionsContext.selectedVersionDetails.securityData 
      && versionsContext.selectedVersionDetails.securityData.securityIssues) {
        return versionsContext.selectedVersionDetails.securityData.securityIssues.map((issue: any) => {
          return <SecurityItemDisplay
            open = { isOpen(issue.reference) }
            packageUrl = { versionsContext.selectedVersionDetails.component.packageUrl }
            securityIssue = { issue }
            remediationEvent = { getRemediationAndOpen }
          />
        });
    }
    return null;
  }

  return (
    renderAccordion(versionsContext!)
  );
}

export default SecurityPage;
