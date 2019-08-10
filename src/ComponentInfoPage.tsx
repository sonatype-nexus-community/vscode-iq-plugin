import * as React from 'react';

type CipProps = {};
// todo declare more details on component
type CipState = {component: any};

class ComponentInfoPage extends React.Component<CipProps, CipState> {
  constructor(props: CipProps) {
    super(props);
    this.state = {component: {name: "", version: ""}}
  }

  public changeComponent(component: any) {
    console.log("CIP changing component", component);
    this.setState({component: component})
  }

  public render() {
    return (
      <div className="info-display">
            <table className="optionstable">
              <div id="component_identifier">
                <tr>
                  <td className="label">Package:</td>
                  <td className="data"><span id="package">{this.state.component.name}</span></td>
                </tr>
                <tr>
                  <td className="label">Version:</td>
                  <td className="data"><span id="version">{this.state.component.version}</span></td>
                </tr>
              </div>
              <tr>
                <td className="label"><span id="hash_label">Hash:</span></td>
                <td className="data"><span id="hash"></span></td>
              </tr>
              <tr>    
                <td className="label">Match State:</td>
                <td className="data"><span id="matchstate"></span></td>
              </tr>
              <tr id="CatalogDate_Row">
                <td className="label">Catalog Date:</td>
                <td className="data"><span id="catalogdate"></span></td>
              </tr>
              <tr id="RelativePopularity_Row">
                <td className="label">Relative Popularity:</td>                
                <td className="data"><span id="relativepopularity"></span></td>
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
