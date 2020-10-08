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
import { configure, getLogger, addLayout } from 'log4js';
import { homedir } from 'os';
import { join } from 'path';

export const DEBUG = 'debug';
export const ERROR = 'error';

const logPath = join(homedir(), '.ossindex');

const logPathFile = join(logPath, '.vscode-iq-plugin.combined.log');

addLayout('json', function (config) {
  return function (logEvent) {
    return JSON.stringify(logEvent) + config.separator;
  };
});

const logger = getLogger('vscode-iq-plugin');

configure({
  appenders: {
    vscodeiqplugin: {
      type: 'file',
      maxLogSize: 2 * 1024 * 1024,
      layout: {
        type: 'json',
        separator: ',',
      },
      filename: logPathFile,
    },
    out: { type: 'stdout' },
    errors: { type: 'logLevelFilter', appender: 'out', level: 'debug', maxLevel: 'debug' },
  },
  categories: {
    default: {
      appenders: ['errors', 'vscodeiqplugin'],
      level: 'debug',
    },
  },
});

export const logMessage = (message: string, level: string, ...meta: any) => {
  if (level == DEBUG) {
    logger.debug(message, ...meta);
  } else if (level == ERROR) {
    if (meta && meta[0] && meta[0].stack) {
      logger.error(message, meta[0].stack);
    } else {
      logger.error(message, ...meta);
    }
  }
};
