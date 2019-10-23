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
import Loader from 'react-loader-spinner';
import Table from 'react-bootstrap/Table';

type CipProps = {
  selectedVersionDetails: any
};
// todo declare more details on component
type CipState = {};

class ComponentInfoPage extends React.Component<CipProps, CipState> {
  constructor(props: CipProps) {
    super(props);
  }

  public changeComponent(component: any) {
    console.debug("CIP changing component", component);
    this.setState({component: component})
  }

  public formatDate(date: string) {
    var dateTime = new Date(date);
    return dateTime.toDateString();
  }

  public render() {
    if (!this.props.selectedVersionDetails) {
      return (
        <Loader
          type="Puff"
          color="#00BFFF"
          height="100"
          width="100"
        />
      );
    }
    console.debug("ComponentInfoPage rendering, props: ", this.props);
    var coordinates = this.props.selectedVersionDetails.component.componentIdentifier.coordinates;
    console.debug("ComponentInfoPage coordinates: ", coordinates);

    return (
        <Table variant="dark">
          <thead>
            <tr>
              <th colSpan={2}>
                {this.props.selectedVersionDetails.component.packageUrl}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Package:</td>
              <td>{coordinates.packageId}</td>
            </tr>
            <tr>
              <td>Version:</td>
              <td><span id="version">{coordinates.version}</span></td>
            </tr>
            <tr>
              <td>Hash:</td>
              <td>{this.props.selectedVersionDetails.component.hash}</td>
            </tr>
            <tr>
              <td>Match State:</td>
              <td>{this.props.selectedVersionDetails.matchState}</td>
            </tr>
            <tr>
              <td>Catalog Date:</td>
              <td><span id="catalogdate">{ this.formatDate(this.props.selectedVersionDetails.catalogDate) }</span></td>
            </tr>
            <tr>
              <td>Relative Popularity:</td>                
              <td><span id="relativepopularity">{this.props.selectedVersionDetails.relativePopularity}</span></td>
            </tr>
          </tbody>
        </Table>								
    );
  }
}

export default ComponentInfoPage;
