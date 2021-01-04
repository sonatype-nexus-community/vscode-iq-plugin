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
import { OutputChannel } from "vscode";
import * as log4js from 'log4js';
import { join } from "path";

export class Logger {
    private _outputChannel: OutputChannel;
    private _logLevel: LogLevel = LogLevel.ERROR;
    private _fileLogger: log4js.Logger;

    constructor(options: LoggerOptions) {
        this._outputChannel = options.outputChannel;
        this._fileLogger = this._getAndConfigureFileLogger(options.logFilePath);
    }

    private _getAndConfigureFileLogger(filePath: string): log4js.Logger {
        let path: string = join(filePath, '.sonatypeIQExtension.combined.log');

        log4js.addLayout('json', (config) => {
            return function(logEvent) { 
                return JSON.stringify(logEvent) + ','; 
            }
        });

        log4js.configure({
            appenders: {
                'sonatypeIQ': {
                    type: 'file',
                    maxLogSize: 2 * 1024 * 1024,
                    layout: {
                        type: 'json',
                    },
                    filename: path,
                }
            },
            categories: {
                default: {
                    appenders: ['sonatypeIQ'],
                    level: 'trace',
                }
            }
        });

        const _log: log4js.Logger = log4js.getLogger();

        this._writeToOutputChannel(LogLevel.INFO, _log.level);

        this._writeToOutputChannel(LogLevel.INFO, `More logs can be found at: '${path}'`);

        return _log;
    }

    public setLogLevel(logLevel: LogLevel) {
        this._logLevel = logLevel;
    }

    public log(level: LogLevel, message: string, ...meta: any): void {
        if (this._logLevel >= level) {
            this._writeToOutputChannel(level, message);
            this._logMessage(level, message, ...meta);
        }
    }

    private _writeToOutputChannel(level: LogLevel, message: string): void {
        this._outputChannel.appendLine(`${LogLevel[level]}: ${message}`);
    }

    private _logMessage(level: LogLevel, message: string, ...meta: any) {
        switch (level) {
            case LogLevel.ERROR: {
                this._fileLogger.error(message, ...meta);
                break;
            }
            case LogLevel.DEBUG: {
                this._fileLogger.debug(message, ...meta);
                break;
            }
            case LogLevel.TRACE: {
                this._fileLogger.trace(message, ...meta);
                break;
            }
            default: {
                this._writeToOutputChannel(level, `Unsupported LogLevel encountered`);
            }
        }
    }
}

export interface LoggerOptions {
    outputChannel: OutputChannel;
    logFilePath: string;
} 

export enum LogLevel {
    FATAL = 0,
    ERROR,
    WARN,
    INFO,
    DEBUG,
    TRACE
}
