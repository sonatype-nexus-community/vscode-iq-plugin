import * as React from 'react';
import { VersionInfo } from 'ext-src/VersionInfo';

//import logo from './logo.svg';
type Props = {
  component: any,
  allVersions: VersionInfo[],
  versionChangeHandler: (version: VersionInfo) => void
};
// todo declare more details on component
type State = {
  selectedVersion: VersionInfo
};

class AllVersionsPage extends React.Component<Props, State> {
  public render() {
    console.log("AllVersionsPage rendering", this.props.allVersions)
    if (!this.props.allVersions || this.props.allVersions.length <= 0) {
      return(
        <h3>No data available</h3>
      );
    }
    return (
      <div>
        <table>
        {
          this.props.allVersions.map(function(row: VersionInfo) {
            console.log("AllVersions row: ", row);
            return (
              <tr>
                <td>{row.displayName.version}</td>
              </tr>
            );
          })
        }
        </table>
      </div>
    );
  }
}

export default AllVersionsPage;
