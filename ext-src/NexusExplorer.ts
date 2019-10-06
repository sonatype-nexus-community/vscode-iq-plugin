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
import * as _ from "lodash";
import * as dependencyTree from "dependency-tree";

import {
  ComponentInfoPanel,
  ComponentEntry
} from "./ComponentInfoPanel";
import { IqComponentModel } from "./IqComponentModel";

export class NexusExplorerProvider
  implements vscode.TreeDataProvider<ComponentEntry> {
  private editor?: vscode.TextEditor;

  private _onDidChangeTreeData: vscode.EventEmitter<
    any
  > = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData
    .event;

  constructor(
    private context: vscode.ExtensionContext,
    readonly componentModel: IqComponentModel
  ) {
    this.refresh();
  }
  refresh(offset?: number): void {
    this.reloadComponentModel().then(v => {
      if (this.componentModel.components.length > 0) {
        this._onDidChangeTreeData.fire();
      }
    });
  }

  private async reloadComponentModel() {
    await this.componentModel.evaluateComponents();
  }

  getDependencies(entry: ComponentEntry) {
    var tree = dependencyTree({
      filename: path.join("", entry.name),
      directory: ".",
      nodeModulesConfig: {
        entry: "module"
      }, // optional
      filter: path => path.indexOf("node_modules") === -1, // optional
      nonExistent: [] // optional
    });
    return tree;
  }

  getTreeItem(entry: ComponentEntry): vscode.TreeItem {
    // TODO use collapsible state to handle transitive dependencies as a tree
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
    // TODO flesh out more details in the tooltip?
    treeItem.tooltip = `Name: ${entry.name}
      Version: ${entry.version}
      Hash: ${entry.hash}
      Policy: ${maxThreat}`;

    return treeItem;
  }

  getChildren(entry?: ComponentEntry): ComponentEntry[] | null {
    if (entry === undefined) {
      return this.componentModel.components;
    } else {
      // support nesting
      return null;
    }
  }

  select(range: vscode.Range) {
    this.editor!.selection = new vscode.Selection(range.start, range.end);
  }
}

export class NexusExplorer {
  private nexusViewer: vscode.TreeView<ComponentEntry>;
  private componentModel: IqComponentModel;
  private nexusExplorerProvider: NexusExplorerProvider;

  constructor(readonly context: vscode.ExtensionContext) {
    /////////CPT/////////////
    let config = vscode.workspace.getConfiguration("nexusiq.npm");
    let url = config.get("url") + "";
    let username = config.get("username") + "";
    let password = config.get("password") + "";
    let applicationPublicId = config.get("applicationPublicId") + "";
    let maximumEvaluationPollAttempts = parseInt(
      config.get("maximumEvaluationPollAttempts") + "", 10);

    /* Please note that login information is hardcoded only for this example purpose and recommended not to do it in general. */
    this.componentModel = new IqComponentModel(
      url,
      username,
      password,
      applicationPublicId,
      maximumEvaluationPollAttempts
    );

    this.nexusExplorerProvider = new NexusExplorerProvider(
      context,
      this.componentModel
    );

    this.nexusViewer = vscode.window.createTreeView("nexusExplorer", {
      treeDataProvider: this.nexusExplorerProvider
    });

    vscode.commands.registerCommand("nexusExplorer.refresh", () =>
      this.nexusExplorerProvider.refresh()
    );

    vscode.commands.registerCommand("nexusExplorer.revealResource", () =>
      this.reveal()
    );
    vscode.commands.registerCommand(
      "nexusExplorer.viewNode",
      (node: ComponentEntry) => this.viewNode(node)
    );
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
    ComponentInfoPanel.createOrShow(this.context.extensionPath, entry);
  }
}
