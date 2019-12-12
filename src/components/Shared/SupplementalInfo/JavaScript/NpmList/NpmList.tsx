/*
 * Copyright (c) 2019-present Sonatype, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from 'react';
import { OssIndexContext } from '../../../../../context/ossindex-context';
import CSS from 'csstype';

const spanPreStyle: CSS.Properties = {
  display: 'inline',
  unicodeBidi: 'embed',
  fontFamily: 'monospace',
  whiteSpace: 'pre'
}

type Props = {
};

type State = {
};

class NpmList extends React.Component<Props, State> {
  static contextType = OssIndexContext;

  constructor(props: Props) {
    super(props);
  }

  public render() {
    let component: string = this.context.supplementalInfo.depGraph.split("\n")[1].split(" ")[1].split("@")[0];
    return (
      <React.Fragment>
        {this.context && this.context.supplementalInfo && (
            this.context.supplementalInfo.depGraph.split("\n").map((x: string) => {
              return (
                <span style={spanPreStyle}>
                  { x }
                  <br />
                </span>
              )
            })
          )
        }
      <p>
        This library was brought in to your application by <span style={spanPreStyle}>{component}</span>
      </p>
      { this.getUpgradeMessage(name, component) }
      <span style={spanPreStyle}>npm update {component}</span>
      </React.Fragment>
    )
  }

  private getUpgradeMessage(name: string, otherName: string) {
    if (name === otherName) {
      return (
        <p>
          To update <span style={spanPreStyle}>{name}</span>, you can attempt to upgrade <span style={spanPreStyle}>{otherName}</span>, using the following command.
        </p>
      )
    } else {
      return (
        <p>
          To update <span style={spanPreStyle}>{otherName}</span>, you can attempt to upgrade using the following command.
        </p>
      )
    }
  }
}

export default NpmList;
