import * as React from 'react';
import { VictoryChart, VictoryTheme, VictoryBar } from 'victory';

class VersionGraph extends React.Component {
  // constructor() {
  //   super({}});
  //   this.state = {
  //     data: [
  //       {version: "1.1.0", popularity: 19, policyThreat: 0},
  //       {version: "1.1.1", popularity: 50, policyThreat: 0},
  //       {version: "1.1.2", popularity: 3, policyThreat: 1}
  //     ]
  //   };
  // }
  public render() {
    return (
  <VictoryChart
    theme={VictoryTheme.material}
    domainPadding={{ x: 15 }}
  >
    <VictoryBar
      barRatio={0.8}
      style={{
        data: { fill: "#c43a31" }
      }}
      // data = { this.state.versionData }
      data={[
        {version: "1.1.0", popularity: 19, policyThreat: 0},
        {version: "1.1.1", popularity: 50, policyThreat: 0},
        {version: "1.1.2", popularity: 3, policyThreat: 1}
      ]}
      x="version"
      y="popularity"
    />
  </VictoryChart>
    );
  }
}

export default VersionGraph;
