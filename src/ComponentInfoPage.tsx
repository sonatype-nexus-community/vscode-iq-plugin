import * as React from 'react';
import Loader from 'react-loader-spinner';

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
    console.log("CIP changing component", component);
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
    console.log("ComponentInfoPage rendering, props: ", this.props);
    var coordinates = this.props.selectedVersionDetails.component.componentIdentifier.coordinates;
    console.log("ComponentInfoPage coordinates: ", coordinates);

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
