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
import { FaChevronRight, FaCheckSquare, FaRegSquare } from 'react-icons/fa';

type Props = {
  selectedVersion: string,
  version: string,
  initialVersion: string
}

type State = {
}

class SelectedBadge extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  public render() {
    if (this.props.selectedVersion == this.props.version) {
      return (
        <FaChevronRight />
      )
    } else if (this.props.initialVersion == this.props.version) {
      return (
        <FaCheckSquare />
      )
    } else {
      return (
        <FaRegSquare />
      )
    }
  }
}

export default SelectedBadge;
