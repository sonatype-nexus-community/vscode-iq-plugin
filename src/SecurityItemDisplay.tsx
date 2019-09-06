import * as React from 'react';

type State = {
  securityIssue: any
}

type Props = {}

class SecurityItemDisplay extends React.Component<State, Props> {
  public render() {
    return (
      <div>
        <div>
          <h1>{this.props.securityIssue.reference}</h1>
          <h2>CVSS:{this.props.securityIssue.severity}</h2>
        </div>
        <table>
          <tr>
            <td className="label">Reference:</td>
            <td className="data">{this.props.securityIssue.reference}</td>
          </tr>
          <tr>
            <td className="label">Severity:</td>
            <td className="data">{this.props.securityIssue.severity}</td>
          </tr>
          <tr>
            <td className="label">Source:</td>
            <td className="data">{this.props.securityIssue.source}</td>
          </tr>
          <tr>
            <td className="label">Threat Category:</td>
            <td className="data">{this.props.securityIssue.threatCategory}</td>
          </tr>
          <tr>
            <td className="label">URL:</td>
            <td className="data">{this.props.securityIssue.url}</td>
          </tr>
        </table>
      </div>
    );
  }
}

export default SecurityItemDisplay;
