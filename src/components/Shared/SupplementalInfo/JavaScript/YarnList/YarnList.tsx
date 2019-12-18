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

class YarnList extends React.Component<Props, State> {
  static contextType = OssIndexContext;

  constructor(props: Props) {
    super(props);
  }

  public render() {
    let component = this.getUpgradeMessage(this.context.supplementalInfo.depGraph, this.context.component.name);
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
        { component }
      </React.Fragment>
    )
  }

  private getUpgradeMessage(stdout: string, name: string) {
    let dependency: string = name;
    if (stdout) {
      stdout.split("\n").forEach((x) => {
        if (x.includes("depends on it")) {
          let newStr = x
            .replace("\" depends on it", "")
            .replace("- \"", "");

          dependency = newStr;
        }
      });
    }
    if (dependency == name) {
      return (
        <React.Fragment>
          <p>
            To update <span style={spanPreStyle}>{name}</span>, you can attempt to upgrade <span style={spanPreStyle}>{dependency}</span>, using the following command.
          </p>
          <p>
            <span style={spanPreStyle}>yarn upgrade {dependency} --latest</span>
          </p>
        </React.Fragment>
      )
    } else {
      return (
        <React.Fragment>
          <p>
            To update <span style={spanPreStyle}>{dependency}</span>, you can attempt to upgrade using the following command.
          </p>
          <p>
            <span style={spanPreStyle}>yarn upgrade {dependency} --latest</span>
          </p>
        </React.Fragment>
      )
    }
  }
}

export default YarnList;
