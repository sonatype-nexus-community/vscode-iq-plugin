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
import OssIndexComponentInfo from './OssIndexComponentInfo/OssIndexComponentInfo';
import OssIndexSecurityInfo from './OssIndexSecurityInfo/OssIndexSecurityInfo';
import { 
  NxTabs, 
  NxTab, 
  NxTabList, 
  NxTabPanel,
  NxInfoAlert } from '@sonatype/react-shared-components';

const OssIndexVersionDetails = () => {

  const [activeTabId, setActiveTabId] = useState(0);

  return (
    <NxTabs activeTab={activeTabId} onTabSelect={setActiveTabId}>
    <NxTabList>
      <NxTab>
        Component Info
      </NxTab>
      <NxTab>
        Security
      </NxTab>
      <NxTab>
        Policy
      </NxTab>
      <NxTab>
        Licensing
      </NxTab>
    </NxTabList>
    <NxTabPanel>
      <OssIndexComponentInfo />
    </NxTabPanel>
    <NxTabPanel>
      <OssIndexSecurityInfo/>
    </NxTabPanel>
    <NxTabPanel>
      <NxInfoAlert>
        IQ Server provides policy based, automated risk mitigation in your CI environment.
        <p>
          <a href="https://www.sonatype.com/product-nexus-lifecycle" target="_blank">Learn more about IQ Server</a>
        </p>
      </NxInfoAlert>
    </NxTabPanel>
    <NxTabPanel>
      <NxInfoAlert>
      IQ Server gives you visibility into the licensing of your components, and allows you to manage your legal obligations using our automated policy enforcement engine.
        <p>
          <a href="https://www.sonatype.com/product-nexus-lifecycle" target="_blank">Learn more about IQ Server</a>
        </p>
      </NxInfoAlert>
    </NxTabPanel>
  </NxTabs>
  )
}

export default OssIndexVersionDetails;
