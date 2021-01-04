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

export class Logger {
    private _outputChannel: OutputChannel;
    private _logLevel: LogLevel = LogLevel.ERROR;

    constructor(options: LoggerOptions) {
        this._outputChannel = options.outputChannel;
    }

    public setLogLevel(logLevel: LogLevel) {
        this._logLevel = logLevel;
    }

    public log(level: LogLevel, message: string): void {
        if (this._logLevel >= level) {
            this._writeToOutputChannel(level, message);
        }
    }

    private _writeToOutputChannel(level: LogLevel, message: string): void {
        this._outputChannel.appendLine(`${LogLevel[level]}: ${message}`);
    }
}

export interface LoggerOptions {
    outputChannel: OutputChannel
} 

export enum LogLevel {
    FATAL = 0,
    ERROR,
    WARN,
    INFO,
    DEBUG,
    TRACE
}
