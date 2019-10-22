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
import './ComponentInfoPage.css';

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
      <div className="info-display">
        <h2>{this.props.selectedVersionDetails.component.packageUrl}</h2>
            <table className="optionstable">
                <tr>
                  <td className="label">Package:</td>
                  <td className="data"><span id="package">{coordinates.packageId}</span></td>
                </tr>
                <tr>
                  <td className="label">Version:</td>
                  <td className="data"><span id="version">{coordinates.version}</span></td>
                </tr>
              <tr>
                <td className="label"><span id="hash_label">Hash:</span></td>
                <td className="data"><span id="hash">{this.props.selectedVersionDetails.hash}</span></td>
              </tr>
              <tr>    
                <td className="label">Match State:</td>
                <td className="data"><span id="matchstate"></span></td>
              </tr>
              <tr id="CatalogDate_Row">
                <td className="label">Catalog Date:</td>
                <td className="data"><span id="catalogdate">{this.props.selectedVersionDetails.catalogDate}</span></td>
              </tr>
              <tr id="RelativePopularity_Row">
                <td className="label">Relative Popularity:</td>                
                <td className="data"><span id="relativepopularity">{this.props.selectedVersionDetails.rlativePopularity}</span></td>
              </tr>
              {/* <tr>
                <td className="label">Highest CVSS Score:</td>                
                <td className="data"><span id="Highest_CVSS_Score" className="maxIssue"></span>{this.props.version.highestCvssScore}<span id="Num_CVSS_Issues" className="numissues"></span></td>
              </tr>							
              <tr>
                <td className="label">Data Source:</td>                
                <td className="data"><span id="datasource">{this.props.version.dataSource}</span></td>
              </tr> */}
            </table>									
      </div>
    );
  }
}

export default ComponentInfoPage;
