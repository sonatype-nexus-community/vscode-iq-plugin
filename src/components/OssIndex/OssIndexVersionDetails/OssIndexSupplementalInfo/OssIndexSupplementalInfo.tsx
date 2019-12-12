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
import { OssIndexContext } from '../../../../context/ossindex-context';
import NpmList from '../../../Shared/SupplementalInfo/JavaScript/NpmList/NpmList';
import Loader from 'react-loader-spinner';

type Props = {
};

type State = {
};

class OssIndexSupplementalInfo extends React.Component<Props, State> {
  static contextType = OssIndexContext;

  constructor(props: Props) {
    super(props);
  }

  public render() {
    if (this.context.supplementalInfo == undefined ) {
      return (
        <Loader
          type="MutatingDots"
          color="#00BFFF"
          height={100}
          width={100}
        />
      )
    } else {
      if (this.context.supplementalInfo && this.context.supplementalInfo.packageType === "package-lock.json") {
        return (
          <NpmList />
        )
      } else {
        return (
          <h1>Nothing implemented for this Type</h1>
        )
      }
    }
  }
}

export default OssIndexSupplementalInfo;
