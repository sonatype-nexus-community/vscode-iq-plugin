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
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import { VersionsContextConsumer } from '../../../context/versions-context';
import ClassNameUtils from '../../../utils/ClassNameUtils';
import SelectedBadge from './SelectedBadge/SelectedBadge';
import Loader from 'react-loader-spinner';

type Props = {
  versionChangeHandler: (version: string) => void
};

type State = {
  selectedVersion: string
};

class AllVersionsPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedVersion: ""
    }
  }

  private handleClick(e: any) {
    console.debug("row clicked, event:", e);
    this.setState({selectedVersion: e});
    this.props.versionChangeHandler(e);
  }

  public render() {
    var _this = this;

    return (
      <VersionsContextConsumer>
        {context => {
          if (!context!.allVersions || context!.allVersions.length == 0 ) {
            return _this.buildLoader(context);
          }
          return _this.buildAllVersionsList(context);
        }}
      </VersionsContextConsumer>
    );
  }

  public componentDidMount() {
    console.debug("AllVersionsPage componentDidMount, state", this.state)
    this.scrollToCurrentVersion()
  }

  public componentDidUpdate() {
    console.debug("AllVersionsPage componentDidUpdate, state", this.state)
    this.scrollToCurrentVersion()
  }

  private buildLoader(context: any) {
    return (
      <Loader
        type="MutatingDots"
        color="#00BFFF"
        height={100}
        width={100}
      />
    );
  }

  private buildAllVersionsList(context: any) {
    console.debug(`buildAllVersions called, selected: ${context!.selectedVersion}`)
    var _this = this;
    return (
      <React.Fragment>
        {Object.keys(context!.allVersions).map(row => (
          <Alert 
              className={this.getAlertClassname(context, row)}
              onClick={_this.handleClick.bind(_this, context!.allVersions[row].componentIdentifier.coordinates.version)}>
            <SelectedBadge 
              version={context!.allVersions[row].componentIdentifier.coordinates.version} 
              selectedVersion={context!.selectedVersion} 
              initialVersion={context!.initialVersion} /> { context!.allVersions[row].componentIdentifier.coordinates.version }
            <Badge 
              className={ClassNameUtils.threatClassName(context!.allVersions[row].highestSecurityVulnerabilitySeverity)}>
                CVSS: {context!.allVersions[row].highestSecurityVulnerabilitySeverity}
            </Badge>
          </Alert>
      ))}
      </React.Fragment>
    )
  }

  private scrollToCurrentVersion() {
    let selectedElement = document.getElementsByClassName("selected-version");
    console.debug("scrollToCurrentVersion found selected version", selectedElement);
    if (selectedElement && selectedElement.length > 0 && !this.isElementInViewport(selectedElement[0])) {
      selectedElement[0].scrollIntoView();
    }
  }

  private isElementInViewport(element: Element) {
    var bounding = element.getBoundingClientRect();
    return (
        bounding.top >= 0 &&
        bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight)
    );
  }

  private getAlertClassname(context: any, row: any): string {
    var className: string = ""
    if (context!.allVersions[row].componentIdentifier.coordinates.version == context!.selectedVersion) {
      className += " selected-version";
    }
    if (context!.allVersions[row].componentIdentifier.coordinates.version == context!.initialVersion) {
      className += " current-version";
    }
    return className
  }
}

export default AllVersionsPage;
