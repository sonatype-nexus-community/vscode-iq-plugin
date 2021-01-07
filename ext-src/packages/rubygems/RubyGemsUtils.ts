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

import { PackageDependenciesHelper } from "../PackageDependenciesHelper";
import { RubyGemsPackage } from './RubyGemsPackage';
import * as gem from 'gemfile';
import * as path from "path";

export class RubyGemsUtils {
  public async getDependencyArray(): Promise<Array<RubyGemsPackage>> {
    try {
      let gems = gem.parseSync(path.join(PackageDependenciesHelper.getWorkspaceRoot(), 'Gemfile.lock'));

      if (gems.GEM && gems.GEM.specs) {
        let res: Array<RubyGemsPackage> = new Array();
        Object.keys(gems.GEM.specs).forEach((key) => {
          let version: string = gems.GEM.specs[key].version as string;
          if (version) {
            res.push(new RubyGemsPackage(key, version));
          }
        });
        return Promise.resolve(res);
      }
  
      return Promise.reject("No dependencies found, your Gemfile.lock may have no specs in it");
    } catch (ex) {
      return Promise.reject(`Uh oh, spaghetti-o, an exception occurred while getting RubyGems dependencies, exception: ${ex}`);
    }
  }
}
