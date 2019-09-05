import * as React from 'react';
import SecurityItemDisplay from './SecurityItemDisplay';

type State = {
  securityData: any
}

type Props = {}

class SecurityPage extends React.Component<State, Props> {
  public render() {
    if (!this.props.securityData || !this.props.securityData.securityIssues || this.props.securityData.securityIssues.length == 0) {
      console.log("Security page rendering no content, securityData: ", this.props.securityData)
      return (
        <h1>No security issues found</h1>
      );
    }
    return (
      <div>
        {this.props.securityData.securityIssues.map(function(issue: any, index: number) {
          return <SecurityItemDisplay securityIssue={issue} />
        })}
      </div>
    );
  }
}

export default SecurityPage;
