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
import ComponentInfoPage from './ComponentInfoPage/ComponentInfoPage';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import SecurityPage from './SecurityPage/SecurityPage';
import LicensingPage from './LicensingPage/LicensingPage';
import PolicyPage from './PolicyPage/PolicyPage';

type Props = {
  handlePolicyViolations: () => void;
}

type State = {
}

class SelectedVersionDetails extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
  }

  public render() {
    console.log("SelectedVersionDetails page rendering")
    return (
      this.context && (
      <Tabs id="selected-version-tabs" defaultActiveKey="info" onSelect={this.props.handlePolicyViolations.bind(this)}>
        <Tab title="Component Info" eventKey="info">
          <ComponentInfoPage></ComponentInfoPage>
        </Tab>
        <Tab title="Security" eventKey="security">
          <SecurityPage></SecurityPage>
        </Tab>
        <Tab title="Policy" eventKey="policy">
          <PolicyPage></PolicyPage>
        </Tab>
        <Tab title="Licensing" eventKey="licensing">
          <LicensingPage></LicensingPage>
        </Tab>
      </Tabs>   
      )
    );
  }
}

export default SelectedVersionDetails;
