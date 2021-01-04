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
