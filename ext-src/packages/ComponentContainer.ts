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
import { Application } from "../models/Application";
import { SonatypeConfig } from "../types/SonatypeConfig";
import { LoadSonatypeConfig } from "../utils/Config";
import { ILogger, LogLevel } from "../utils/Logger";
import { CargoDependencies } from "./cargo/CargoDependencies";
import { ComposerDependencies } from "./composer/ComposerDependencies";
import { ConanDependencies } from "./conan/ConanDependencies";
import { GolangDependencies } from "./golang/GolangDependencies";
import { GradleDependencies } from "./gradle/GradleDependencies";
import { MavenDependencies } from "./maven/MavenDependencies";
import { NpmDependencies } from "./npm/NpmDependencies";
import { PackageDependencies } from "./PackageDependencies";
import { PoetryDependencies } from "./poetry/PoetryDependencies";
import { PyPIDependencies } from "./pypi/PyPIDependencies";
import { RubyGemsDependencies } from "./rubygems/RubyGemsDependencies";

export class ComponentContainer {
  Possible: Array<PackageDependencies> = [];
  Valid: Array<PackageDependencies> = [];
  PackageMuncher: PackageDependencies | undefined;
  // workspaceFolder: string = 'TBC';

  constructor(readonly logger: ILogger, private applications: Array<Application>) {
    const doc: SonatypeConfig | undefined = LoadSonatypeConfig(this.applications[0]);

    let includeDev: boolean = true;

    if (doc && doc.application && doc.application.IncludeDev !== undefined) {
      includeDev = doc.application.IncludeDev;
    }

    // To add a new format, you just need to push another implementation to this list
    this.applications.forEach((app) => {
      this.Possible.push(new MavenDependencies({ logger, includeDev }, app));
      this.Possible.push(new NpmDependencies({ logger, includeDev }, app));
      this.Possible.push(new GolangDependencies({ logger, includeDev }, app));
      this.Possible.push(new PyPIDependencies({ logger, includeDev }, app));
      this.Possible.push(new RubyGemsDependencies({ logger, includeDev }, app));
      this.Possible.push(new PoetryDependencies({ logger, includeDev }, app));
      this.Possible.push(new ComposerDependencies({ logger, includeDev }, app));
      this.Possible.push(new CargoDependencies({ logger, includeDev }, app));
      this.Possible.push(new ConanDependencies({ logger, includeDev }, app));
      this.Possible.push(new GradleDependencies({ logger, includeDev }, app));
    })

    this.Possible.forEach(i => {
      if (i.checkIfValid()) {
        this.Valid.push(i);
      }
    });

    if (this.Valid.length != 0) {
      logger.log(LogLevel.DEBUG, `${this.Valid.length} package muncher(s) set`);
    } else {
      logger.log(LogLevel.WARN, `No package munchers appear valid`);
      throw new Error("No supported scan type exists for the open workspace");
    }
  }
}
