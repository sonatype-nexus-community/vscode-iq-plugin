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
import React, { useState } from 'react';
import ComponentInfoPage from './ComponentInfoPage/ComponentInfoPage';
import SecurityPage from './SecurityPage/SecurityPage';
import LicensingPage from './LicensingPage/LicensingPage';
import PolicyPage from './PolicyPage/PolicyPage';
import { 
  NxTabs, 
  NxTab, 
  NxTabList, 
  NxTabPanel } from '@sonatype/react-shared-components';

type SelectedVersionProps = {
  selectedVersion: string,
  currentVersion: string
}

const SelectedVersionDetails = (props: SelectedVersionProps) => {
  const [activeTabId, setActiveTabId] = useState(0);

  return (
    <NxTabs activeTab={activeTabId} onTabSelect={setActiveTabId}>
      <NxTabList>
        <NxTab>
          Component Info
        </NxTab>
        { props.currentVersion === props.selectedVersion && (
          <NxTab>
            Policy
          </NxTab>
        )}
        <NxTab>
          Security
        </NxTab>
        <NxTab>
          Licensing
        </NxTab>
      </NxTabList>
      <NxTabPanel>
        <ComponentInfoPage></ComponentInfoPage>
      </NxTabPanel>
      { props.currentVersion === props.selectedVersion && (
        <NxTabPanel>
          <PolicyPage></PolicyPage>
        </NxTabPanel>
      )}
      <NxTabPanel>
        <SecurityPage></SecurityPage>
      </NxTabPanel>
      <NxTabPanel>
        <LicensingPage></LicensingPage>
      </NxTabPanel>
    </NxTabs>
  );
};

export default SelectedVersionDetails;
