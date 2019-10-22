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
import LicensingPage from './LicensingPage';
import ComponentInfoPage from './ComponentInfoPage';
import SecurityPage from './SecurityPage';

type Props = {
  selectedVersionDetails?: any
}

type State = {
}

class SelectedVersionDetails extends React.Component<Props, State> {
  public render() {
    if (!this.props.selectedVersionDetails) {
      console.debug("SelectedVersionDetails page rendering no content, props: ", this.props)
      return (
        <h1>Select a version to render details</h1>
      );
    }
    console.debug("SelectedVersionDetails page rendering, props: ", this.props)
    return (
      <div>
            <h1>Component Info</h1>
            <ComponentInfoPage selectedVersionDetails={this.props.selectedVersionDetails!}></ComponentInfoPage>
            <h1>Security</h1>
            <SecurityPage securityData={this.props.selectedVersionDetails.securityData}></SecurityPage>
            <h1>Licensing</h1>
            <LicensingPage licenseData={this.props.selectedVersionDetails.licenseData}></LicensingPage>
      </div>
    );
  }
}

export default SelectedVersionDetails;
