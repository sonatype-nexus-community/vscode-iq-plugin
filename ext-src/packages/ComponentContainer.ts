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
import { PackageDependencies } from "./PackageDependencies";
import { MavenDependencies } from "./maven/MavenDependencies";
import { NpmDependencies } from "./npm/NpmDependencies";
import { GolangDependencies } from "./golang/GolangDependencies";
import { PyPIDependencies } from "./pypi/PyPIDependencies";
import { RubyGemsDependencies } from "./rubygems/RubyGemsDependencies"; 
import { PoetryDependencies } from "./poetry/PoetryDependencies";
import { ComposerDependencies } from './composer/ComposerDependencies';
import { CargoDependencies } from './cargo/CargoDependencies';
import { ILogger } from "../utils/Logger";
import { ConanDependencies } from "./conan/ConanDependencies";
import { GradleDependencies } from "./gradle/GradleDependencies";
import { LoadSonatypeConfig } from "../utils/Config";
import { SonatypeConfig } from "../types/SonatypeConfig";

export class ComponentContainer {
  Possible: Array<PackageDependencies> = [];
  Valid: Array<PackageDependencies> = [];
  PackageMuncher: PackageDependencies | undefined;

  constructor(readonly logger: ILogger) {
    const doc: SonatypeConfig | undefined = LoadSonatypeConfig();

    let includeDev: boolean = true;

    if (doc && doc.application && doc.application.IncludeDev !== undefined) {
      includeDev = doc.application.IncludeDev;
    }

    // To add a new format, you just need to push another implementation to this list
    this.Possible.push(new MavenDependencies({logger, includeDev}));
    this.Possible.push(new NpmDependencies({logger, includeDev}));
    this.Possible.push(new GolangDependencies({logger, includeDev}));
    this.Possible.push(new PyPIDependencies({logger, includeDev}));
    this.Possible.push(new RubyGemsDependencies({logger, includeDev}));
    this.Possible.push(new PoetryDependencies({logger, includeDev}));
    this.Possible.push(new ComposerDependencies({logger, includeDev}));
    this.Possible.push(new CargoDependencies({logger, includeDev}));
    this.Possible.push(new ConanDependencies({logger, includeDev}));
    this.Possible.push(new GradleDependencies({logger, includeDev}));

    this.Possible.forEach(i => {
      if(i.checkIfValid()) {
        this.Valid.push(i);
      }
    });

    if (this.Valid.length != 0) {
      console.debug("Package Muncher(s) set");
    } else {
      throw new Error("No supported scan type exists for the open workspace");
    }
  }
}
