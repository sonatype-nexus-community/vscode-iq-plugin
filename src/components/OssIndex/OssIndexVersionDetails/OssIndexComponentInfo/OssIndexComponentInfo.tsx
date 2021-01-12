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
import React, { useContext } from 'react';
import { NxTable, NxTableHead, NxTableBody, NxTableRow, NxTableCell} from '@sonatype/react-shared-components';
import { OssIndexContext, OssIndexContextInterface} from '../../../../context/ossindex-context';

const OssIndexComponentInfo = () => {

  const ossIndexContext = useContext(OssIndexContext);

  const renderComponentInfo = (ossIndexContext: OssIndexContextInterface | undefined) => {
    if (ossIndexContext && ossIndexContext.component) {
      return <NxTable>
        <NxTableHead>
          <NxTableRow>
            <NxTableCell colSpan={2}>
              { ossIndexContext.component.ossIndexData.coordinates }
            </NxTableCell>
          </NxTableRow>
        </NxTableHead>
        <NxTableBody>
          <NxTableRow>
            <NxTableCell>
              Package
            </NxTableCell>
            <NxTableCell>
              { ossIndexContext.component.name }
            </NxTableCell>
          </NxTableRow>
          <NxTableRow>
            <NxTableCell>
              Version
            </NxTableCell>
            <NxTableCell>
              { ossIndexContext.component.version }
            </NxTableCell>
          </NxTableRow>
          <NxTableRow>
            <NxTableCell>
              Description
            </NxTableCell>
            <NxTableCell>
              { ossIndexContext.component.ossIndexData.description }
            </NxTableCell>
          </NxTableRow>
        </NxTableBody>
      </NxTable>
    }
    return null;
  }

  return (
    renderComponentInfo(ossIndexContext)
  )
}

export default OssIndexComponentInfo;
