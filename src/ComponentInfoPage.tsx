import * as React from 'react';
//import './styles.css';
//import styles from './ComponentInfoPage.css';

type CipProps = {
  component: any
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
    return (
      <div className="info-display">
            <table className="optionstable">
                <tr>
                  <td className="label">Package:</td>
                  <td className="data"><span id="package">{this.props.component.name}</span></td>
                </tr>
                <tr>
                  <td className="label">Version:</td>
                  <td className="data"><span id="version">{this.props.component.version}</span></td>
                </tr>
              <tr>
                <td className="label"><span id="hash_label">Hash:</span></td>
                <td className="data"><span id="hash">{this.props.component.hash}</span></td>
              </tr>
              <tr>    
                <td className="label">Match State:</td>
                <td className="data"><span id="matchstate"></span></td>
              </tr>
              <tr id="CatalogDate_Row">
                <td className="label">Catalog Date:</td>
                <td className="data"><span id="catalogdate">{this.props.component.nexusIQData.catalogDate}</span></td>
              </tr>
              <tr id="RelativePopularity_Row">
                <td className="label">Relative Popularity:</td>                
                <td className="data"><span id="relativepopularity">{this.props.component.nexusIQData.relativepopularity}</span></td>
              </tr>
              <tr>
                <td className="label">Highest CVSS Score:</td>                
                <td className="data"><span id="Highest_CVSS_Score" className="maxIssue"></span><span id="Num_CVSS_Issues" className="numissues"></span></td>
              </tr>							
              <tr>
                <td className="label">Data Source:</td>                
                <td className="data"><span id="datasource"></span></td>
              </tr>
            </table>									
      </div>
    );
  }
}

export default ComponentInfoPage;
