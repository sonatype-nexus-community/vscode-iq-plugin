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
import LicensingDisplay from './LicensingDisplay/LicensingDisplay';
import { VersionsContextConsumer } from '../../../../context/versions-context';
import { 
  NxTable, 
  NxTableHead, 
  NxTableRow, 
  NxTableCell, 
  NxTableBody } 
  from '@sonatype/react-shared-components';

type Props = {
}

type State = {
}

class LicensingPage extends React.Component<Props, State> {
  public render() {
    return (
      <VersionsContextConsumer>
        {context => context && context.selectedVersionDetails && (
          <React.Fragment>
            <NxTable>
              <NxTableHead>
                <NxTableRow>
                  <NxTableCell colSpan={2}>
                    Declared Licenses
                  </NxTableCell>
                </NxTableRow>
              </NxTableHead>
              <NxTableBody>
                { context.selectedVersionDetails.licenseData.declaredLicenses.map(function(license: any) {
                  return <LicensingDisplay licenseData={license} />
                })}
              </NxTableBody>
            </NxTable>
            <NxTable>
              <NxTableHead>
                <NxTableRow>
                  <NxTableCell colSpan={2}>
                    Observed Licenses
                  </NxTableCell>
                </NxTableRow>
              </NxTableHead>
              <NxTableBody>
                { context.selectedVersionDetails.licenseData.observedLicenses.map(function(license: any) {
                  return <LicensingDisplay licenseData={license} />
                })}
              </NxTableBody>
            </NxTable>
          </React.Fragment>
        )}
      </VersionsContextConsumer>
    );
  }
}

export default LicensingPage;
