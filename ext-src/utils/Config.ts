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
import { existsSync, readFileSync } from "fs";
import { load } from "js-yaml";
import { join } from "path";
import { PackageDependenciesHelper } from "../packages/PackageDependenciesHelper";
import { DOT_YAML_EXTENSION, DOT_YML_EXTENSION, SonatypeConfig, SONATYPE_CONFIG_FILE_NAME } from "../types/SonatypeConfig";

const NEXUS_EXPLORER_BASE = "nexusExplorer";
const NEXUS_IQ_BASE = "nexusIQ";

const NEXUS_EXPLORER_DATA_SOURCE = NEXUS_EXPLORER_BASE.concat(".", "dataSource");
const NEXUS_IQ_SERVER_URL = NEXUS_IQ_BASE.concat(".", "serverUrl");
const NEXUS_IQ_USERNAME = NEXUS_IQ_BASE.concat(".", "username");
const NEXUS_IQ_MAX_EVAL_POLL_ATTEMPTS = NEXUS_IQ_BASE.concat(".", "maximumEvaluationPollAttempts");
const NEXUS_IQ_PUBLIC_APPLICATION_ID = NEXUS_IQ_BASE.concat(".", "applicationId");
const NEXUS_IQ_USER_PASSWORD = NEXUS_IQ_BASE.concat(".", "userPassword");
const NEXUS_IQ_STRICT_SSL = NEXUS_IQ_BASE.concat(".", "strictSSL");

const OSS_INDEX_BASE = "ossindex";

const OSS_INDEX_USERNAME = OSS_INDEX_BASE.concat(".", "username");
const OSS_INDEX_TOKEN = OSS_INDEX_BASE.concat(".", "userToken");


/**
 * LoadSonatypeConfig will look for the existence of `.sonatype-config`,
 * `.sonatype-config.yaml`, or `.sonatype-config.yml`, in that order, attempt to load it into a SonatypeConfig interface
 * and return it. If nothing is found, it returns undefined.
 * 
 * @returns SonatypeConfig or undefined if no config found
 */
const LoadSonatypeConfig = (): SonatypeConfig | undefined => {
  /* 
  * TODO: this is a bit silly for three files that are more or less the same, we should switch to checking for a glob or something
  * However, left it as this for now so I could have some time to find the best library to do so, or use node.js libraries itself
  */ 
  const sonatypeConfigPath = join(PackageDependenciesHelper.getWorkspaceRoot(), SONATYPE_CONFIG_FILE_NAME);

  const sonatypeConfigWithYamlPath = join(PackageDependenciesHelper.getWorkspaceRoot(), SONATYPE_CONFIG_FILE_NAME + DOT_YAML_EXTENSION);

  const sonatypeConfigWithYmlPath = join(PackageDependenciesHelper.getWorkspaceRoot(), SONATYPE_CONFIG_FILE_NAME + DOT_YML_EXTENSION);
  
  if (existsSync(sonatypeConfigPath)) {
    const doc = load(readFileSync(sonatypeConfigPath, 'utf8')) as SonatypeConfig;

    return doc;
  }

  if (existsSync(sonatypeConfigWithYamlPath)) {
    const doc = load(readFileSync(sonatypeConfigWithYamlPath, 'utf8')) as SonatypeConfig;

    return doc;
  }

  if (existsSync(sonatypeConfigWithYmlPath)) {
    const doc = load(readFileSync(sonatypeConfigWithYmlPath, 'utf8')) as SonatypeConfig;

    return doc;
  }

  return undefined;
};

export {
    OSS_INDEX_USERNAME,
    OSS_INDEX_TOKEN,
    NEXUS_EXPLORER_DATA_SOURCE,
    NEXUS_IQ_SERVER_URL,
    NEXUS_IQ_USERNAME,
    NEXUS_IQ_MAX_EVAL_POLL_ATTEMPTS,
    NEXUS_IQ_PUBLIC_APPLICATION_ID,
    NEXUS_IQ_USER_PASSWORD,
    NEXUS_IQ_STRICT_SSL,
    LoadSonatypeConfig
};
