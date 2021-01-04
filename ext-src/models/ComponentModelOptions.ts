import { WorkspaceConfiguration } from "vscode";
import { Logger } from "../utils/Logger";

export interface ComponentModelOptions {
    configuration: WorkspaceConfiguration;
    logger: Logger;
}
