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
import * as ReactDOM from 'react-dom';
import SelectedBadge from './SelectedBadge';
import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
import { FaRegSquare, FaCheckSquare, FaChevronRight } from 'react-icons/fa';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<SelectedBadge selectedVersion="" version="" initialVersion=""/>, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('returns a FaRegSquare by default', () => {
  Enzyme.configure({ adapter: new Adapter() });
  const wrapper = Enzyme.shallow(<SelectedBadge selectedVersion="1.0.0" version="0.0.1" initialVersion="1.0.2"/>);
  const instance = wrapper.instance();
  expect(instance.render()).toEqual(<FaRegSquare />);
});

it('returns a FaCheckSquare if initialVersion and version match', () => {
  Enzyme.configure({ adapter: new Adapter() });
  const wrapper = Enzyme.shallow(<SelectedBadge selectedVersion="1.0.0" version="1.0.2" initialVersion="1.0.2"/>);
  const instance = wrapper.instance();
  expect(instance.render()).toEqual(<FaCheckSquare />);
});

it('returns a FaChevronRight if selectedVersion and version match', () => {
  Enzyme.configure({ adapter: new Adapter() });
  const wrapper = Enzyme.shallow(<SelectedBadge selectedVersion="1.0.2" version="1.0.2" initialVersion="1.0.2"/>);
  const instance = wrapper.instance();
  expect(instance.render()).toEqual(<FaChevronRight />);
});
