import * as React from 'react';
import { VictoryChart, VictoryTheme, VictoryBar, VictoryContainer, VictoryTooltip } from 'victory';
import { VersionInfo } from 'ext-src/VersionInfo';

type Props = {
  allVersions: VersionInfo[]
};
// todo declare more details on component
type State = {};

class VersionGraph extends React.Component<Props, State> {
  private fillDefault = "#03cffc";
  private fillSelected = "#033dfc";
  //private fillInitial = "#07fc03";
  public render() {
    return (
  <VictoryChart
    theme={VictoryTheme.material}
    height={200}
    width={Math.max(this.props.allVersions.length * 20, 300) + 100}
    domainPadding={{x: [5, 5], y:5}}
    containerComponent={<VictoryContainer responsive={false}/>}
  >
    <VictoryBar
      barWidth={10}
      style={{
        data: { fill: this.fillDefault }
      }}
      data = {this.props.allVersions}
      x="displayName.version"
      y="popularity"
      labels={(d) => `v: ${d.displayName.version}`}
      labelComponent={<VictoryTooltip/>}
      events={[{
        target: "data",
        eventHandlers: {
          onClick: () => {
            return [
              {
                target: "data",
                mutation: (props) => {
                  const fill = props.style && props.style.fill;
                  return fill === this.fillSelected ? null : { style: { fill: this.fillSelected } };
                }
              }
            ];
          }
        }
      }]}
    />
  </VictoryChart>
    );
  }
}

export default VersionGraph;
