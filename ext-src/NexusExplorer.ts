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
import * as fs from "fs";
import * as _ from "lodash";
import * as request from "request";
import * as dependencyTree from "dependency-tree";

import {
  ComponentInfoPanel,
  ComponentEntry,
  PolicyViolation
} from "./ComponentInfoPanel";
import { PackageDependencies } from "./packages/PackageDependencies";
import { MavenDependencies } from "./packages/maven/MavenDependencies";
import { NpmDependencies } from "./packages/npm/NpmDependencies";
import { MavenCoordinate } from "./packages/maven/MavenCoordinate";
import { NpmCoordinate } from "./packages/npm/NpmCoordinate";

enum DependencyType {
  NPM = "NPM",
  Maven = "Maven",
}

export class IqComponentModel {
  components: Array<ComponentEntry> = [];
  coordsToComponent: Map<string, ComponentEntry> = new Map<
    string,
    ComponentEntry
  >();

  // TODO make these configurable???
  //
  readonly evaluationPollDelayMs = 2000;

  constructor(
    readonly url: string,
    private user: string,
    private password: string,
    private applicationPublicId: string,
    private getmaximumEvaluationPollAttempts: number
  ) {}

  public getContent(resource: vscode.Uri): Thenable<string> {
    // TODO get the HTML doc for webview
    return new Promise((c, e) => "my stubbed content entry");
  }

  public async evaluateComponents() {
    console.debug("evaluateComponents");
    await this.performIqScan();
  }

  private determineWorkspaceDependencyType(workspaceRoot: string): DependencyType {
    const packageJsonPath = path.join(workspaceRoot, "package.json");
    const pomFilePath = path.join(workspaceRoot, "pom.xml");

    const packageJsonExists: boolean = this.pathExists(packageJsonPath);
    const pomFileExists: boolean =  this.pathExists(pomFilePath); 

    if (packageJsonExists){
      return DependencyType.NPM;
    }
    else if (pomFileExists) {
      return DependencyType.Maven;
    }
    else{
      throw new TypeError("Workspace has no package.json or pom.xml");
    }
  }

  private async packageForIQ(workspaceRoot: string, type: DependencyType): Promise<PackageDependencies> {
    switch (type) {
      case DependencyType.Maven:
        let mavenDependencies = new MavenDependencies();
        mavenDependencies.packageForIq(workspaceRoot);
        return mavenDependencies;
      case DependencyType.NPM:
        let npmDependencies = new NpmDependencies();
        npmDependencies.packageForIq(workspaceRoot);
        return npmDependencies;
      default:
        throw new TypeError("Functionality not implemented");
    }
  }

  private async packageAndConvertToNexusFormat(dependencyType: DependencyType, workspaceRoot: string) {
    let data = undefined;
    let items = await this.packageForIQ(workspaceRoot, dependencyType);
    data = items.convertToNexusFormat();
    this.components = items.toComponentEntries(data);

    return data;
  }

  private async performIqScan() {
    try {
      const workspaceRoot = vscode.workspace.rootPath;
      if (workspaceRoot === undefined) {
        throw new TypeError("No workspace opened");
      }

      const dependencyType = this.determineWorkspaceDependencyType(workspaceRoot);

      console.debug("Project dependency type:" + dependencyType)

      let data = this.packageAndConvertToNexusFormat(dependencyType, workspaceRoot);

      if (undefined == data) {
        throw new RangeError("Attempted to generated dependency list but received an empty collection. NexusIQ will not be invoked for this project.");
      }

      console.debug("getting applicationInternalId", this.applicationPublicId);
      let response = await this.getApplicationId(this.applicationPublicId);

      let appRep = JSON.parse(response as string);
      console.debug("appRep", appRep);

      let applicationInternalId = appRep.applications[0].id;
      console.debug("applicationInternalId", applicationInternalId);

      let resultId = await this.submitToIqForEvaluation(
        data,
        applicationInternalId as string
      );

      console.debug("report", resultId);
      let resultDataString = await this.asyncPollForEvaluationResults(
        applicationInternalId as string,
        resultId as string
      );
      let resultData = JSON.parse(resultDataString as string);

      console.debug(`Received results from IQ scan:`, resultData);
      for (let resultEntry of resultData.results) {

        let componentEntry: ComponentEntry | undefined = undefined;
        if (dependencyType === DependencyType.NPM) {
          let coordinates = resultEntry.component.componentIdentifier
            .coordinates as NpmCoordinate;
          componentEntry = this.coordsToComponent.get(
            coordinates.asCoordinates()
          );
        }
        else if (dependencyType === DependencyType.Maven){
          let coordinates = resultEntry.component.componentIdentifier
            .coordinates as MavenCoordinate;
          componentEntry = this.coordsToComponent.get(
            coordinates.asCoordinates()
          );
        }
        componentEntry!.policyViolations = resultEntry.policyData
          .policyViolations as Array<PolicyViolation>;
        componentEntry!.hash = resultEntry.component.hash;
        componentEntry!.nexusIQData = resultEntry;
      }
    } catch (e) {
      vscode.window.showErrorMessage("Nexus IQ extension: " + e);
      return;
    }
  }
  private async getApplicationId(applicationPublicId: string) {
    console.log("getApplicationId", applicationPublicId);
    return new Promise((resolve, reject) => {
      request.get(
        {
          method: "GET",
          url: `${
            this.url
          }/api/v2/applications?publicId=${applicationPublicId}`,
          auth: { user: this.user, pass: this.password }
        },
        (err:any, response:any, body:any) => {
          if (err) {
            reject(`Unable to retrieve Application ID: ${err}`);
            return;
          }
          resolve(body);
          return;
        }
      );
    });
  }

  private async submitToIqForEvaluation(data: any, applicationInternalId: string) {
    return new Promise((resolve, reject) => {
      request.post(
        {
          method: "POST",
          url: `${
            this.url
          }/api/v2/evaluation/applications/${applicationInternalId}`,
          json: data,
          auth: { user: this.user, pass: this.password }
        },
        (err:any, response:any, body:any) => {
          if (err) {
            reject(`Unable to perform IQ scan: ${err}`);
            return;
          }
          let resultId = body.resultId;
          resolve(resultId);
          return;
        }
      );
    });
  }

  private async asyncPollForEvaluationResults(
    applicationInternalId: string,
    resultId: string
  ) {
    return new Promise((resolve, reject) => {
      this.pollForEvaluationResults(
        applicationInternalId,
        resultId,
        body => resolve(body),
        (statusCode, message) =>
          reject(
            `Could not fetch evaluation result, code ${statusCode}, message ${message}`
          )
      );
    });
  }

  private pollForEvaluationResults(
    applicationInternalId: string,
    resultId: string,
    success: (body: string) => any,
    failed: (statusCode: number, message: string) => any
  ) {
    let _this = this;
    let pollAttempts = 0;

    let successHandler = function(value: string) {
      success(value);
    };
    let errorHandler = function(statusCode: number, message: string) {
      if (statusCode === 404) {
        // report still being worked on, continue to poll
        pollAttempts += 1;
        // TODO use the top-level class constant, but references are failing
        if (pollAttempts >= _this.getmaximumEvaluationPollAttempts) {
          failed(statusCode, "Poll limit exceeded, try again later");
        } else {
          setTimeout(() => {
            _this.getEvaluationResults(
              applicationInternalId,
              resultId,
              successHandler,
              errorHandler
            );
          }, _this.evaluationPollDelayMs);
        }
      } else {
        failed(statusCode, message);
      }
    };
    this.getEvaluationResults(
      applicationInternalId,
      resultId,
      successHandler,
      errorHandler
    );
  }

  private getEvaluationResults(
    applicationInternalId: string,
    resultId: string,
    resolve: (body: string) => any,
    reject: (statusCode: number, message: string) => any
  ) {
    request.get(
      {
        method: "GET",
        url: `${
          this.url
        }/api/v2/evaluation/applications/${applicationInternalId}/results/${resultId}`,
        auth: { user: this.user, pass: this.password }
      },
      (error:any, response:any, body:any) => {
        if (response && response.statusCode != 200) {
          reject(response.statusCode, error);
          return;
        }
        if (error) {
          reject(response.statusCode, error);
          return;
        }
        resolve(body);
      }
    );
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
      return true;
    } catch (err) {
      return false;
    }
  }
}

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
    // this.reloadComponentModel();
    // this.autoRefresh = vscode.workspace.getConfiguration('nexusExplorer').get('autorefresh');
    // vscode.workspace.onDidChangeConfiguration(() => {
    // 	this.autoRefresh = vscode.workspace.getConfiguration('nexusExplorer').get('autorefresh');
    // });
  }

  // sortByVulnerability(offset?: number): void {
  // 	this.reloadComponentModel().then(v => {
  // 		if (this.componentModel.components.length > 0) {
  // 			console.log('Sort By Vulnerability');
  // 			//make a copy of the nodes and then sort the items
  // 			//using the policy provider
  // 		}
  // 	});
  // }

  refresh(offset?: number): void {
    this.reloadComponentModel().then(v => {
      if (this.componentModel.components.length > 0) {
        //this._onDidChangeTreeData.fire(this.getTreeItem(this.getChildren()[0]));
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
      //   requireConfig: "path/to/requirejs/config", // optional
      //   webpackConfig: "path/to/webpack/config", // optional
      //   tsConfig: "path/to/typescript/config", // optional
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
    // let tree = this.getDependencies(entry);
    // TODO flesh out more details in the tooltip?
    treeItem.tooltip = `Name: ${entry.name}
Version: ${entry.version}
Hash: ${entry.hash}
Policy: ${maxThreat}

`;
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
  //private componentModel : IqStaticComponentModel;
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

    /////////////////////////
    //let applicationId = config.get("applicationId") + '';//.toString();
    // let applicationId = "XXXXXX";//await this.getApplicationId(applicationPublicId);

    /* Please note that login information is hardcoded only for this example purpose and recommended not to do it in general. */
    this.componentModel = new IqComponentModel(
      url,
      username,
      password,
      applicationPublicId,
      maximumEvaluationPollAttempts
    );
    //this.componentModel = new IqStaticComponentModel();
    this.nexusExplorerProvider = new NexusExplorerProvider(
      context,
      this.componentModel
    );

    this.nexusViewer = vscode.window.createTreeView("nexusExplorer", {
      treeDataProvider: this.nexusExplorerProvider
    });

    //this.reveal();

    //vscode.window.registerTreeDataProvider('nexusExplorer', this.nexusExplorerProvider);
    vscode.commands.registerCommand("nexusExplorer.refresh", () =>
      this.nexusExplorerProvider.refresh()
    );
    // vscode.commands.registerCommand('nexusExplorer.sortByVulnerability', () => this.nexusExplorerProvider.sortByVulnerability());

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
