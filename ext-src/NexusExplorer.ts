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
import * as vscode from "vscode";
import * as path from "path";

import { ComponentInfoPanel } from "./ComponentInfoPanel";
import { IqComponentModel } from "./models/IqComponentModel";
import { OssIndexComponentModel } from "./models/OssIndexComponentModel";
import { ComponentModel } from "./models/ComponentModel";
import { ComponentEntry } from "./models/ComponentEntry";
import { ILogger, Logger, LogLevel } from './utils/Logger';
import {NEXUS_IQ_SERVER_URL} from "./utils/Config";

export class NexusExplorerProvider implements vscode.TreeDataProvider<ComponentEntry> {
  private editor?: vscode.TextEditor;

  private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

  constructor(
    private context: vscode.ExtensionContext,
    private componentModel: IqComponentModel
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

  getTreeItem(entry: ComponentEntry): vscode.TreeItem {
    let treeItem: vscode.TreeItem = new vscode.TreeItem(
      entry.toString(),
      vscode.TreeItemCollapsibleState.None
    );
    treeItem.iconPath = this.context.asAbsolutePath(
      path.join("resources", entry.iconName())
    );
    treeItem.command = {
      command: "nexusExplorer.viewNode",
      title: "Select Node",
      arguments: [entry]
    };
    let maxThreat = entry.maxPolicy();
    treeItem.tooltip = `Name: ${entry.name}\nVersion: ${entry.version}\nHash: ${entry.hash}\nPolicy: ${maxThreat}`;

    return treeItem;
  }

  getChildren(entry?: ComponentEntry): ComponentEntry[] | null {
    if (entry === undefined) {
      return this.componentModel.components;
    } else {
      return null;
    }
  }

  select(range: vscode.Range) {
    this.editor!.selection = new vscode.Selection(range.start, range.end);
  }

  public updateComponentModel(componentModel: ComponentModel) {
    this.componentModel = componentModel as IqComponentModel;
  }
}

export class NexusExplorer {
  
  private sortPolicyDescending: boolean = true;
  private sortNameAscending: boolean = true;
  private nexusViewer: vscode.TreeView<ComponentEntry>;
  private componentModel: ComponentModel;
  private nexusExplorerProvider: NexusExplorerProvider;
  private logger: ILogger;

  constructor(readonly context: vscode.ExtensionContext) {

    let configuration = vscode.workspace.getConfiguration();
    const _channel = vscode.window.createOutputChannel(`Sonatype IQ Extension`);
    context.subscriptions.push(_channel);

    this.logger = new Logger({outputChannel: _channel, logFilePath: context.globalStoragePath});
    this.logger.setLogLevel(LogLevel[configuration.get("nexusExplorer.loggingLevel", "ERROR")]);

    if (
      configuration.get("nexusExplorer.dataSource", "ossindex") + "" ==
      "iqServer"
    ) {
      this.componentModel = new IqComponentModel({configuration: configuration, logger: this.logger});
    } else {
      this.componentModel = new OssIndexComponentModel({configuration: configuration, logger: this.logger});
    }

    this.nexusExplorerProvider = new NexusExplorerProvider(
      context,
      this.componentModel as IqComponentModel
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
      this.componentModel
    );
  }

  public switchComponentModel(scanType: string) {
    let configuration = vscode.workspace.getConfiguration();

    if (scanType == "iqServer") {
      this.componentModel = new IqComponentModel({configuration: configuration, logger: this.logger});
    } else if (scanType == "ossindex") {
      this.componentModel = new OssIndexComponentModel({configuration: configuration, logger: this.logger});
    }

    this.nexusExplorerProvider.updateComponentModel(this.componentModel);

    this.nexusExplorerProvider.doRefresh();
  }

  public updateIQAppID(applicationID: string) {
    if (this.componentModel instanceof IqComponentModel) {
      this.componentModel.applicationPublicId = applicationID;

      this.nexusExplorerProvider.doRefresh();
    }
  }

  // public updateIQUrl(url: string) {
  //   if (this.componentModel instanceof IqComponentModel) {
  //     this.componentModel.url = url;
  //     this.componentModel.requestService.setUrl(url);

  //     this.nexusExplorerProvider.doRefresh();
  //   }
  // }

  // public updateIQUser(user: string) {
  //   if (this.componentModel instanceof IqComponentModel) {
  //     this.componentModel.username = user;
  //     this.componentModel.requestService.setUser(user);

  //     this.nexusExplorerProvider.doRefresh();
  //   }
  // }

  // public updateIQPassword(password: string) {
  //   if (this.componentModel instanceof IqComponentModel) {
  //     this.componentModel.password = password;
  //     this.componentModel.requestService.setPassword(password);

  //     this.nexusExplorerProvider.doRefresh();
  //   }
  // }

  public refreshIQRequestService(url?: string, user?: string, password?: string) {
    if (this.componentModel instanceof IqComponentModel) {
      if (url) {
        this.componentModel.url = url;
        this.componentModel.requestService.setUrl(url);
      }
      if (user) {
        this.componentModel.username = user;
        this.componentModel.requestService.setUser(user);
      }
      if (password) {
        this.componentModel.password = password;
        this.componentModel.requestService.setPassword(password);
      }

      this.nexusExplorerProvider.doRefresh();
    }
  }
}
