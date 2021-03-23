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
export interface SonatypeConfig {
  iq: IQOptions | undefined
  application: ApplicationOptions | undefined
}

export interface IQOptions {
  PublicApplication: string | undefined
  Stage: string | undefined
  Server: string | undefined
}

export interface ApplicationOptions {
  IncludeDev: boolean | undefined
}

const STAGE_ACCEPTABLE_VALUES = ["develop", "build", "release", "stage-release", "operate"];

const SONATYPE_CONFIG_FILE_NAME = '.sonatype-config';

const DOT_YAML_EXTENSION = '.yaml';

const DOT_YML_EXTENSION = '.yml';

const DEFAULT_STAGE_VALUE = 'develop';

export { STAGE_ACCEPTABLE_VALUES, SONATYPE_CONFIG_FILE_NAME, DEFAULT_STAGE_VALUE, DOT_YAML_EXTENSION, DOT_YML_EXTENSION };
