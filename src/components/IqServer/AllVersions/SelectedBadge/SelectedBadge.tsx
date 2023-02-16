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
import { NxFontAwesomeIcon } from '@sonatype/react-shared-components';
import { faChevronRight, faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import {IconDefinition} from '@fortawesome/fontawesome-svg-core';

type SelectedBadgeProps = {
  selectedVersion: string,
  version: string,
  initialVersion: string
}

const SelectedBadge = (props: SelectedBadgeProps) => {

  const renderBadge = (props: SelectedBadgeProps) => {
    if (props.selectedVersion == props.version) {
      return (
        <NxFontAwesomeIcon icon={faChevronRight as IconDefinition} />
      )
    } else if (props.initialVersion == props.version) {
      return (
        <NxFontAwesomeIcon icon={faCheckSquare as IconDefinition} />
      )
    }
    return (
      <NxFontAwesomeIcon icon={faSquare as IconDefinition} />
    )
  }

  return (
    renderBadge(props)
  )
}

export default SelectedBadge;
