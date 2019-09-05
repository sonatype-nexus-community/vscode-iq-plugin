import * as React from 'react';
import Loader from 'react-loader-spinner';
import { VersionInfo } from 'ext-src/VersionInfo';

type CipProps = {
  component: any,
  version: VersionInfo
};
// todo declare more details on component
type CipState = {};

class ComponentInfoPage extends React.Component<CipProps, CipState> {
  constructor(props: CipProps) {
    super(props);
  }

  public changeComponent(component: any) {
    console.log("CIP changing component", component);
    this.setState({component: component})
  }

  public render() {
    if (!this.props.component || !this.props.component.nexusIQData) {
      return (
        <Loader
          type="Puff"
          color="#00BFFF"
          height="100"
          width="100"
        />
      );
    }

    return (
      <div className="info-display">
        <h2>{this.props.component.name} @ {this.props.component.version}</h2>
            <table className="optionstable">
                <tr>
                  <td className="label">Package:</td>
                  <td className="data"><span id="package">{this.props.version.displayName.packageId}</span></td>
                </tr>
                <tr>
                  <td className="label">Version:</td>
                  <td className="data"><span id="version">{this.props.version.displayName.version}</span></td>
                </tr>
              <tr>
                <td className="label"><span id="hash_label">Hash:</span></td>
                <td className="data"><span id="hash">{this.props.version.hash}</span></td>
              </tr>
              <tr>    
                <td className="label">Match State:</td>
                <td className="data"><span id="matchstate"></span></td>
              </tr>
              <tr id="CatalogDate_Row">
                <td className="label">Catalog Date:</td>
                <td className="data"><span id="catalogdate">{this.props.version.catalogDate}</span></td>
              </tr>
              <tr id="RelativePopularity_Row">
                <td className="label">Relative Popularity:</td>                
                <td className="data"><span id="relativepopularity">{this.props.version.popularity}</span></td>
              </tr>
              <tr>
                <td className="label">Highest CVSS Score:</td>                
                <td className="data"><span id="Highest_CVSS_Score" className="maxIssue"></span>{this.props.version.highestCvssScore}<span id="Num_CVSS_Issues" className="numissues"></span></td>
              </tr>							
              <tr>
                <td className="label">Data Source:</td>                
                <td className="data"><span id="datasource">{this.props.version.dataSource}</span></td>
              </tr>
            </table>									
      </div>
    );
  }
}

export default ComponentInfoPage;
