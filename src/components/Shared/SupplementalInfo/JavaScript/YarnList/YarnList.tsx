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
import _ from 'lodash';

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
    let dependencies: string[][] = new Array();
    if (stdout) {
      stdout.split("\n").forEach((x) => {
        if (x.includes("depends on it")) {
          let newStr: string[] = x
            .trim()
            .replace("\" depends on it", "")
            .replace("- \"", "")
            .replace("info This module exists because \"", "")
            .split("#");

          dependencies.push(newStr);
        }
      });
      dependencies = _.uniqBy(dependencies, (x) => {
        return x;
      });
    }
    if (dependencies.length >= 1) {
      return (
        dependencies.map((x) => {
          let mainDependency = x[0].replace("@", "");
          return (
            <React.Fragment>
              <p>
              To update <span style={spanPreStyle}>{name}</span>, you can attempt to upgrade <span style={spanPreStyle}>{mainDependency}</span>, using the following command.
              </p>
              <p>
                <span style={spanPreStyle}>yarn upgrade {mainDependency} --latest</span>
              </p>
              <span style={spanPreStyle}>
                {x.map((y, i) => {
                  return <React.Fragment>{"--".repeat(i) + y.replace("@", "")}<br/></React.Fragment>
                })}
              </span>
            </React.Fragment>
          )
        })
      )
    } else {
      return (
        <React.Fragment>
          <p>
            To update <span style={spanPreStyle}>{name}</span>, you can attempt to upgrade using the following command.
          </p>
          <p>
            <span style={spanPreStyle}>yarn upgrade {name} --latest</span>
          </p>
        </React.Fragment>
      )
    }
  }
}

export default YarnList;
