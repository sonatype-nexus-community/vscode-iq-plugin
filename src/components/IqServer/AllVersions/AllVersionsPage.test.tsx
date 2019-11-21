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
import AllVersionsPage from './AllVersionsPage';
import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

let versionsArray = new Array();

versionsArray.push(createComponentIdentifier("1.0.0"));
versionsArray.push(createComponentIdentifier("1.0.1"));
versionsArray.push(createComponentIdentifier("1.0.2"));

const context = { allVersions: versionsArray, selectedVersion: "1.0.0", initialVersion: "1.0.1" }

it('returns selected version from getAlertClassname when versions match', () => {
  Enzyme.configure({ adapter: new Adapter() });
  const wrapper = Enzyme.shallow(<AllVersionsPage versionChangeHandler={versionChangeHandler}/>, { context });
  const instance = wrapper.instance();
  const result = instance.getAlertClassname(context, 0);
  expect(result).toBe(" selected-version");
});

it('returns current version from getAlertClassname when initial version and version match', () => {
  Enzyme.configure({ adapter: new Adapter() });
  const wrapper = Enzyme.shallow(<AllVersionsPage versionChangeHandler={versionChangeHandler}/>, { context });
  const instance = wrapper.instance();
  const result = instance.getAlertClassname(context, 1);
  expect(result).toBe(" current-version");
});

function versionChangeHandler(version: string) {
  return;
}

function createComponentIdentifier(version: string) {
  return {
    componentIdentifier: {
      coordinates: {
        version: version
      }
    }
  };
}
