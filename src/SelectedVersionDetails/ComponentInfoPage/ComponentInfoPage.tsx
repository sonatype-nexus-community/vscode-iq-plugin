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
import Table from 'react-bootstrap/Table';
import { VersionsContextConsumer } from '../../context/versions-context';

type CipProps = {
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
    return (
      <VersionsContextConsumer>
        {context => context && context.selectedVersionDetails && (
          <Table variant="dark">
          <thead>
            <tr>
              <th colSpan={2}>
                {context.selectedVersionDetails.component.packageUrl}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Package:</td>
              <td>{context.selectedVersionDetails.component.componentIdentifier.coordinates.packageId}</td>
            </tr>
            <tr>
              <td>Version:</td>
              <td><span id="version">{context.selectedVersionDetails.component.componentIdentifier.coordinates.version}</span></td>
            </tr>
            <tr>
              <td>Hash:</td>
              <td>{context.selectedVersionDetails.component.hash}</td>
            </tr>
            <tr>
              <td>Match State:</td>
              <td>{context.selectedVersionDetails.matchState}</td>
            </tr>
            <tr>
              <td>Catalog Date:</td>
              <td><span id="catalogdate">{ this.formatDate(context.selectedVersionDetails.catalogDate) }</span></td>
            </tr>
            <tr>
              <td>Relative Popularity:</td>                
              <td><span id="relativepopularity">{context.selectedVersionDetails.relativePopularity}</span></td>
            </tr>
          </tbody>
        </Table>		
        )}
      </VersionsContextConsumer>	
    );
  }
}

export default ComponentInfoPage;
