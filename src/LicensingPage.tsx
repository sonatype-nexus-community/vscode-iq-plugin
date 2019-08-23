import * as React from 'react';

class LicensingPage extends React.Component {
  public render() {
    return (
      <div >
      <table className="optionstable" id="licensetable">
        <tr>
          <td colSpan={2}><strong>DeclaredLicenses</strong></td>
          <td></td>
        </tr>            
          
        <div id="declaredlicenses">
        <tr>
          <td>License Id: <a id="declaredlicenses_licenseLink" href="test.html" target="_blank">LicenseLink</a></td>
          <td>License Name: <span id="declaredlicenses_licenseName"></span></td>
        </tr>  
        </div>
        <tr>
          <td colSpan={2}>
              <p><strong>Observed Licenses</strong></p>
          </td>
        </tr>                
        <div id="observedlicenses">                     
        <tr>
          <td>License Id: <span id="observedLicenses_licenseId"></span></td>
          <td><div id="observedLicenses_licenseLink"></div>License Name: <span id="observedLicenses_licenseName"></span></td>
        </tr>
        </div>
      </table>            
    </div>
    );
  }
}

export default LicensingPage;
