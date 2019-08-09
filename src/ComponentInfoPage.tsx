import * as React from 'react';

class ComponentInfoPage extends React.Component {
  public render() {
    return (
      <div className="info-display">
            <table className="optionstable">
              <div id="component_identifier">
                <tr>
                  <td className="label">Package:</td>
                  <td className="data"><span id="package">Component name</span></td>
                </tr>
                <tr>
                  <td className="label">Version:</td>
                  <td className="data"><span id="version">1.2.3.4</span></td>
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
