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
import { OssIndexContextConsumer} from '../../../../context/ossindex-context';

type OssCipProps = {
};

type OssCipState = {
};

class OssIndexComponentInfo extends React.Component<OssCipProps, OssCipState> {
  constructor(props: OssCipProps) {
    super(props);
  }

  public render() {
    return (
      <OssIndexContextConsumer>
        {context => context && context.component && (
          <Table>
          <thead>
            <tr>
              <th colSpan={2}>
                <h2>{context.component.ossIndexData.coordinates}</h2>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="cipInfoLabel">Package</td>
              <td>{context.component.ossIndexData.coordinates}</td>
            </tr>
            <tr>
              <td className="cipInfoLabel">Version</td>
              <td><span id="version">{context.component.version}</span></td>
            </tr>
            <tr>
              <td className="cipInfoLabel">Description</td>
              <td><span id="description">{context.component.ossIndexData.description}</span></td>
            </tr>
          </tbody>
        </Table>
        )}
      </OssIndexContextConsumer>
    );
  }
}

export default OssIndexComponentInfo;
