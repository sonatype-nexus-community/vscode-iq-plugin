import * as React from 'react';
import { VictoryChart, VictoryTheme, VictoryBar, VictoryContainer, VictoryTooltip } from 'victory';
import { VersionInfo } from './VersionInfo';

type Props = {
  allVersions: VersionInfo[]
};
// todo declare more details on component
type State = {};

class VersionGraph extends React.Component<Props, State> {
  public render() {
    return (
  <VictoryChart
    theme={VictoryTheme.material}
    domainPadding={{ x: 15 }}
    height={400}
    width={Math.max(this.props.allVersions.length * 10, 300) + 100}
    containerComponent={<VictoryContainer responsive={false}/>}
  >
    <VictoryBar
      barRatio={0.8}
      style={{
        data: { fill: "#c43a31", strokeWidth: 2 }
      }}
      // data = { this.state.versionData }
      data = {this.props.allVersions}
      x="displayName.version"
      y="popularity"
      labels={(d) => `label: ${d}`}
      labelComponent={<VictoryTooltip/>}
    />
  </VictoryChart>
    );
  }
}

export default VersionGraph;
