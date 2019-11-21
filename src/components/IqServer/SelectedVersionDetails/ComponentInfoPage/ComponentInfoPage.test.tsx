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
import ComponentInfoPage from './ComponentInfoPage';
import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
import { VersionsContextProvider } from '../../../../context/versions-context';

Enzyme.configure({ adapter: new Adapter() });

const context = { 
  component: {},
  vulnerabilities: [],
  allVersions: [],
  selectedVersionDetails: createSelectedVersionDetails(),
  selectedVersion: "",
  initialVersion: "",
  remediation: undefined,
  policyViolations: undefined,
  cvedetails: undefined,
  handleGetRemediation: thing
}

it('does something', () => {
  const wrapper = Enzyme.mount(
    <VersionsContextProvider value={context}>
      <ComponentInfoPage />
    </VersionsContextProvider>
  );

  console.log(wrapper);
});

function createSelectedVersionDetails() {
  return {
    matchState: "exact",
    catalogDate: "2016-03-17T17:52:26.967Z",
    relativePopularity: "1",
    component: {
      packageUrl: "hello",
      hash: "greeneggs",
      componentIdentifier: {
        coordinates: {
          packageId: "hello",
          version: "1.0.2"
        }
      }
    }
  }
}

function thing(o: any, s: string) {
}
