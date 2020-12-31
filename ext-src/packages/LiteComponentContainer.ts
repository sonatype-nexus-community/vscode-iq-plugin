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

import { LitePackageDependencies } from "./LitePackageDependencies";
import { NpmLiteDependencies } from "./npm/NpmLiteDependencies";
import { PyPiLiteDependencies } from "./pypi/PyPiLiteDependencies";
import { PoetryLiteDependencies } from "./poetry/PoetryLiteDependencies";
import { GolangLiteDependencies } from "./golang/GolangLiteDependencies";
import { MavenLiteDependencies } from "./maven/MavenLiteDependencies";
import { RubyGemLiteDependencies } from "./rubygems/RubyGemsLiteDependencies";
import { RLiteDependencies } from "./r/RLiteDependencies";
import { ComposerLiteDependencies } from "./composer/ComposerLiteDependencies";

export class LiteComponentContainer {
  Possible: Array<LitePackageDependencies> = [];
  Valid: Array<LitePackageDependencies> = [];
  PackageMuncher: LitePackageDependencies | undefined;

  constructor() {
    // To add a new format, you just need to push another implementation to this list
    this.Possible.push(new RubyGemLiteDependencies());
    this.Possible.push(new NpmLiteDependencies());
    this.Possible.push(new PyPiLiteDependencies());
    this.Possible.push(new GolangLiteDependencies());
    this.Possible.push(new MavenLiteDependencies());
    this.Possible.push(new RLiteDependencies());
    this.Possible.push(new PoetryLiteDependencies());
    this.Possible.push(new ComposerLiteDependencies());

    this.Possible.forEach(i => {
      if(i.checkIfValid()) {
        this.Valid.push(i);
      }
    });

    if (this.Valid.length != 0) {
      console.debug("Package Muncher(s) set");
    } else {
      throw new TypeError("No valid implementation exists for workspace");
    }
  }
}
