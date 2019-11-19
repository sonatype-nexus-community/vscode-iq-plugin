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
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import OssIndexComponentInfo from './OssIndexComponentInfo/OssIndexComponentInfo';
import OssIndexSecurityInfo from './OssIndexSecurityInfo/OssIndexSecurityInfo';
import { OssIndexContextConsumer } from 'src/context/ossindex-context';

type Props = {
}

type State = {
}

class OssIndexVersionDetails extends React.Component<Props, State> {
  public render() {
    console.log("OssIndexSelectedVersionDetails page rendering")
    return (
      <Tabs id="selected-version-tabs" defaultActiveKey="info">
        <Tab title="Component Info" eventKey="info">
          <OssIndexComponentInfo />
        </Tab>
        <Tab title="Security" eventKey="security">
          <OssIndexContextConsumer>
            {context => context && context.vulnerabilities && (
              <OssIndexSecurityInfo vulnerabilities={context.vulnerabilities}/>
            )}
          </OssIndexContextConsumer>
        </Tab>
        <Tab title="Licensing" eventKey="licensing">
          <h2>Nothing here</h2>
        </Tab>
      </Tabs>     
    );
  }
}

export default OssIndexVersionDetails;
