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

import { ComponentInfoPanel } from "./ComponentInfoPanel";
import { IqComponentModel } from "./models/IqComponentModel";
import { OssIndexComponentModel } from "./models/OssIndexComponentModel";
import { ComponentModel } from "./models/ComponentModel";
import { ILogger, Logger, LogLevel } from './utils/Logger';
import { PolicyItem } from './PolicyItem';

export class NexusExplorerProvider implements vscode.TreeDataProvider<PolicyItem> {
  readonly sortOrder = ['Critical', 'Severe', 'Moderate', 'Low', 'None'];
  private editor?: vscode.TextEditor;

  private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

  data: PolicyItem[] = new Array();

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
    this.reloadComponentModel().then(() => {
      if (this.componentModel.components.length > 0) {
        this.componentModel.components.sort((a, b) => {
          return this.sortOrder.indexOf(a.label!) - this.sortOrder.indexOf(b.label!);
        });

        const nonePolicyItem = this.componentModel.components.find((val) => val.label === 'None');

        if (nonePolicyItem) nonePolicyItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

        this.componentModel.components.map((val) => {
          val.label = `${val.label} (${val.children!.length})`;
        });

        this.doSoftRefresh();
      }
    });
  }

  doSoftRefresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  private reloadComponentModel(): Promise<any> {
    return this.componentModel.evaluateComponents();
  }

  getTreeItem(entry: PolicyItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    return entry;
  }

  getChildren(entry?: PolicyItem|undefined): vscode.ProviderResult<PolicyItem[]> {
    if (entry === undefined) {
      return this.componentModel.components;
    } 
    return entry.children;
  }

  select(range: vscode.Range) {
    this.editor!.selection = new vscode.Selection(range.start, range.end);
  }

  public updateComponentModel(componentModel: ComponentModel) {
    this.componentModel = componentModel as IqComponentModel;
  }
}

export class NexusExplorer {
  
  private nexusViewer: vscode.TreeView<PolicyItem>;
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
      this.componentModel = new IqComponentModel({configuration: configuration, logger: this.logger, extensionPath: this.context.asAbsolutePath("resources")});
    } else {
      this.componentModel = new OssIndexComponentModel({configuration: configuration, logger: this.logger, extensionPath: this.context.asAbsolutePath("resources")});
    }

    this.nexusExplorerProvider = new NexusExplorerProvider(
      context,
      this.componentModel as IqComponentModel
    );

    this.nexusViewer = vscode.window.createTreeView("nexusExplorer", {
      treeDataProvider: this.nexusExplorerProvider
    });

    vscode.commands.registerCommand("nexusExplorer.refresh", () => {
      this.nexusExplorerProvider.doRefresh();
    });

    vscode.commands.registerCommand("nexusExplorer.revealResource", () => {
      this.reveal();
    });

    vscode.commands.registerCommand(
      "nexusExplorer.viewNode",
      (node: PolicyItem) => this.viewNode(node)
    );
  }

  private reveal(): Thenable<void> | undefined {
    const node = this.getNode();
    if (node) {
      return this.nexusViewer.reveal(node);
    }
    return undefined;
  }

  private getNode(): PolicyItem | undefined {
    if (this.componentModel.components.length > 0) {
      return this.componentModel.components[0];
    }
    return undefined;
  }

  private viewNode(entry: PolicyItem) {
    ComponentInfoPanel.createOrShow(
      this.context.extensionPath,
      entry,
      this.componentModel
    );
  }

  public switchComponentModel(scanType: string) {
    let configuration = vscode.workspace.getConfiguration();

    if (scanType == "iqServer") {
      this.componentModel = new IqComponentModel({configuration: configuration, logger: this.logger, extensionPath: this.context.asAbsolutePath("resources")});
    } else if (scanType == "ossindex") {
      this.componentModel = new OssIndexComponentModel({configuration: configuration, logger: this.logger, extensionPath: this.context.asAbsolutePath("resources")});
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

  public refreshIQRequestService(options: RefreshOptions) {
    if (this.componentModel instanceof IqComponentModel) {
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
