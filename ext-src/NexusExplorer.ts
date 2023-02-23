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
import * as path from "path";
import * as vscode from "vscode";
import { WorkspaceFoldersChangeEvent } from "vscode";
import { ComponentInfoPanel } from "./ComponentInfoPanel";
import { ComponentEntry } from "./models/ComponentEntry";
import { ComponentModel } from "./models/ComponentModel";
import { IqMultiProjectComponentModel } from "./models/IqMultiProjectComponentModel";
import { OssIndexComponentModel } from "./models/OssIndexComponentModel";
import { TreeableModel } from "./models/TreeableModel";
import { ILogger, Logger, LogLevel } from './utils/Logger';


export class NexusExplorerProvider implements vscode.TreeDataProvider<TreeableModel> {
  private editor?: vscode.TextEditor;

  private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

  constructor(
    private context: vscode.ExtensionContext,
    private componentModel: IqMultiProjectComponentModel
  ) {
    this.checkPassword();
  }

  checkPassword(): void {
    if (this.componentModel instanceof OssIndexComponentModel) {
      this.doRefresh();
    } else if (this.componentModel.requestService.isPasswordSet()) {
      this.doRefresh();
    } else {
      let options: vscode.InputBoxOptions = {
        prompt: "Nexus IQ Password: ",
        placeHolder: "password",
        password: true
      };

      vscode.window.showInputBox(options).then(value => {
        this.componentModel.requestService.setPassword(value + "");
        this.doRefresh();
      });
    }
  }

  doRefresh(): void {
    let sortPolicyDescending: boolean = true;
    this.reloadComponentModel().then(() => {
      if (this.componentModel.components.length > 0) {
        this.sortByPolicy(sortPolicyDescending);
      }
    });
  }

  doSoftRefresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  sortByName(sortNameAscending: boolean): void {
    this.componentModel.components.sort((a, b) => {
      if (sortNameAscending) {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      } else {
        return b.name.toLowerCase() > a.name.toLowerCase() ? 1 : -1;
      }
    });
    this.doSoftRefresh();
  }

  sortByPolicy(sortPolicyDescending: boolean): void {
    this.componentModel.components.sort((a, b) => {
      if (sortPolicyDescending) {
        return b.maxPolicy() - a.maxPolicy();
      } else {
        return a.maxPolicy() - b.maxPolicy();
      }
    });
    this.doSoftRefresh();
  }

  private reloadComponentModel(): Promise<any> {
    return this.componentModel.evaluateComponents();
  }

  getTreeItem(entry: TreeableModel): vscode.TreeItem {
    let treeItem: vscode.TreeItem = new vscode.TreeItem(
      entry.getLabel(),
      (entry.hasChildren() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)
    );
    treeItem.iconPath = this.context.asAbsolutePath(
      path.join("resources", entry.iconName())
    );
    if (!entry.hasChildren()) {
      treeItem.command = {
        command: "nexusExplorer.viewNode",
        title: "Select Node",
        arguments: [entry]
      };
    }
    treeItem.tooltip = entry.getTooltip();

    return treeItem;
  }

  getChildren(entry?: TreeableModel): TreeableModel[] | null {
    if (entry === undefined) {
      return this.componentModel.applications;
    } else {
      let childComponents = this.componentModel.components.filter(function (item: ComponentEntry) {
        return item.application.name == entry.getLabel()
      });
      return childComponents;
    }
  }

  select(range: vscode.Range) {
    this.editor!.selection = new vscode.Selection(range.start, range.end);
  }

  public updateComponentModel(componentModel: ComponentModel) {
    this.componentModel = componentModel as IqMultiProjectComponentModel;
  }
}

export class NexusExplorer {

  private sortPolicyDescending: boolean = true;
  private sortNameAscending: boolean = true;
  private nexusViewer: vscode.TreeView<TreeableModel>;
  private componentModel: ComponentModel;
  private nexusExplorerProvider: NexusExplorerProvider;
  private logger: ILogger;

  constructor(readonly context: vscode.ExtensionContext) {
    let configuration = vscode.workspace.getConfiguration();
    const _channel = vscode.window.createOutputChannel(`Sonatype IQ Extension`);
    context.subscriptions.push(_channel);

    this.logger = new Logger({ outputChannel: _channel, logFilePath: context.globalStoragePath });
    this.logger.setLogLevel(LogLevel[configuration.get("nexusExplorer.loggingLevel", "ERROR")]);

    if (
      configuration.get("nexusExplorer.dataSource", "ossindex") + "" ==
      "iqServer"
    ) {
      this.componentModel = new IqMultiProjectComponentModel({ configuration: configuration, logger: this.logger });
    } else {
      this.componentModel = new OssIndexComponentModel({ configuration: configuration, logger: this.logger });
    }

    this.nexusExplorerProvider = new NexusExplorerProvider(
      context,
      this.componentModel as IqMultiProjectComponentModel
    );

    this.nexusViewer = vscode.window.createTreeView("nexusExplorer", {
      treeDataProvider: this.nexusExplorerProvider
    });

    vscode.commands.registerCommand("nexusExplorer.refresh", () => {
      this.sortPolicyDescending = true;
      this.sortNameAscending = true;
      this.nexusExplorerProvider.doRefresh();
    });

    vscode.commands.registerCommand("nexusExplorer.sortByPolicy", () => {
      this.sortByPolicy();
    });

    vscode.commands.registerCommand("nexusExplorer.sortByName", () => {
      this.sortByName();
    });

    vscode.commands.registerCommand("nexusExplorer.revealResource", () => {
      this.reveal();
    });
    vscode.commands.registerCommand(
      "nexusExplorer.viewNode",
      (node: ComponentEntry) => this.viewNode(node)
    );

    vscode.workspace.onDidChangeWorkspaceFolders((e: WorkspaceFoldersChangeEvent) => {
      this.logger.log(LogLevel.DEBUG, `Workspace folders have been changed (${e.added.length} added, ${e.removed.length} removed)!`);
      this.componentModel.evaluateWorkspaceFolders();
      this.nexusExplorerProvider.doRefresh();
    })
  }

  private sortByName() {
    this.nexusExplorerProvider.sortByName(this.sortNameAscending);
    this.sortNameAscending = !this.sortNameAscending;
    this.sortPolicyDescending = true;
  }

  private sortByPolicy() {
    this.nexusExplorerProvider.sortByPolicy(this.sortPolicyDescending);
    this.sortPolicyDescending = !this.sortPolicyDescending;
    this.sortNameAscending = true;
  }

  private reveal(): Thenable<void> | undefined {
    const node = this.getNode();
    if (node) {
      return this.nexusViewer.reveal(node);
    }
    return undefined;
  }

  private getNode(): ComponentEntry | undefined {
    if (this.componentModel.components.length > 0) {
      return this.componentModel.components[0];
    }
    return undefined;
  }

  private viewNode(entry: ComponentEntry) {
    ComponentInfoPanel.createOrShow(
      this.context.extensionPath,
      entry,
      this.componentModel,
      this.logger
    );
  }

  public rescanWorkspace() {
    this.componentModel.updateConfiguration({ configuration: vscode.workspace.getConfiguration(), logger: this.logger });
    this.componentModel.evaluateWorkspaceFolders();
    this.nexusExplorerProvider.doRefresh();
  }

  public switchComponentModel(scanType: string) {
    let configuration = vscode.workspace.getConfiguration();

    if (scanType == "iqServer") {
      this.componentModel = new IqMultiProjectComponentModel({ configuration: configuration, logger: this.logger });
    } else if (scanType == "ossindex") {
      this.componentModel = new OssIndexComponentModel({ configuration: configuration, logger: this.logger });
    }

    this.nexusExplorerProvider.updateComponentModel(this.componentModel);

    this.nexusExplorerProvider.doRefresh();
  }

  public updateIQAppID(applicationID: string) {
    if (this.componentModel instanceof IqMultiProjectComponentModel) {
      this.componentModel.evaluateWorkspaceFolders();
      this.nexusExplorerProvider.doRefresh();
    }
  }

  public refreshIQRequestService(options: RefreshOptions) {
    if (this.componentModel instanceof IqMultiProjectComponentModel) {
      if (options) {
        this.componentModel.requestService.setOptions(options);

        this.nexusExplorerProvider.doRefresh();
      }
    }
  }
}

export interface RefreshOptions {
  url: string,
  username: string,
  token: string
}
