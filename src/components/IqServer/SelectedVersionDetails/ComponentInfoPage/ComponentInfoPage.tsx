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
import { VersionsContextConsumer } from '../../../../context/versions-context';
import { 
  NxTable, 
  NxTableHead, 
  NxTableRow, 
  NxTableCell, 
  NxTableBody } 
  from '@sonatype/react-shared-components';

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
          <NxTable>
            <NxTableHead>
              <NxTableRow>
                <NxTableCell colSpan={2}>
                  <h2>{ context.selectedVersionDetails.component.packageUrl }</h2>
                </NxTableCell>
              </NxTableRow>
            </NxTableHead>
            <NxTableBody>
              <NxTableRow>
                <NxTableCell>
                  Package
                </NxTableCell>
                <NxTableCell>
                  { context.selectedVersionDetails.component.componentIdentifier.coordinates.packageId }
                </NxTableCell>
              </NxTableRow>
              <NxTableRow>
                <NxTableCell>
                  Hash
                </NxTableCell>
                <NxTableCell>
                  { context.selectedVersionDetails.component.hash }
                </NxTableCell>
              </NxTableRow>
              <NxTableRow>
                <NxTableCell>
                  Version
                </NxTableCell>
                <NxTableCell>
                  <span id="version">
                    { context.selectedVersionDetails.component.componentIdentifier.coordinates.version }
                  </span>
                </NxTableCell>
              </NxTableRow>
              <NxTableRow>
                <NxTableCell>
                  Match State
                </NxTableCell>
                <NxTableCell>
                  { context.selectedVersionDetails.matchState }
                </NxTableCell>
              </NxTableRow>
              <NxTableRow>
                <NxTableCell>
                  Catalog Date
                </NxTableCell>
                <NxTableCell>
                  <span id="catalogdate">
                    { this.formatDate(context.selectedVersionDetails.catalogDate) }
                  </span>
                </NxTableCell>
              </NxTableRow>
              <NxTableRow>
                <NxTableCell>
                  Relative Popularity
                </NxTableCell>
                <NxTableCell>
                  <span id="relativepopularity">
                    { context.selectedVersionDetails.relativePopularity }
                  </span>
                </NxTableCell>
              </NxTableRow>
            </NxTableBody>
          </NxTable>
        )}
      </VersionsContextConsumer>	
    );
  }
}

export default ComponentInfoPage;
