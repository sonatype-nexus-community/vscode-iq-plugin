import * as vscode from "vscode";
//import * as json from "jsonc-parser";
import * as path from "path";
import * as fs from "fs";
import { exec } from "./exec";
import * as _ from "lodash";
//import { timingSafeEqual } from "crypto";
//import * as md5 from "md5";
import * as request from "request";
//import { removeAllListeners } from "cluster";
//import { deflateSync } from "zlib";
import * as dependencyTree from "dependency-tree";
import * as child_process from "child_process";
import {
  ComponentInfoPanel,
  ComponentEntry,
  PolicyViolation
} from "./ComponentInfoPanel";

export class NpmPackage {
  constructor(
    readonly name: string,
    readonly version: string,
    readonly dependencies: any
  ) {}

  public toString() {
    return `${this.name}@${this.version}`;
  }
}

export class MavenDependency {
  constructor(
    readonly artifactId: string,
    readonly groupId: string,
    readonly version: string,
    readonly extension: string,
    readonly hash?: string
  ) {}

  public toString() {
    return `${this.groupId}:${this.artifactId}.${this.extension}:${this.version}`;
  }
}

enum DependencyType {
  NPM = "NPM",
  Maven = "Maven",
}

class Coordinates {
  packageId?: string;
  version?: string;
  constructor (packageId: string, version: string){
    this.packageId = packageId;
    this.version = version;
  }
}

class MavenCoordinates extends Coordinates {
  artifactId: string;
  groupId: string;
  version: string;
  extension: string;

  constructor (artifactId: string, groupId: string, version: string, extension: string){
    super(groupId + ":" + artifactId, version);
    this.artifactId = artifactId;
    this.groupId = groupId;
    this.version = version;
    this.extension = extension;
  }
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
  ) {
    
  }

  public getContent(resource: vscode.Uri): Thenable<string> {
    // TODO get the HTML doc for webview
    return new Promise((c, e) => "my stubbed content entry");
  }

  public async evaluateComponents() {
    console.log("evaluateComponents");
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

  private async packageNpmForIq(workspaceRoot: string): Promise<Array<NpmPackage>> {
    try {
      const npmShrinkwrapFilename = path.join(
        workspaceRoot,
        "npm-shrinkwrap.json"
      );
      if (!fs.existsSync(npmShrinkwrapFilename)) {
        let { stdout, stderr } = await exec("npm shrinkwrap", {
          cwd: workspaceRoot
        });
        let npmShrinkWrapFile = "npm-shrinkwrap.json";
        let shrinkWrapSucceeded =
          stdout || stderr.search(npmShrinkWrapFile) > -1;
        if (!shrinkWrapSucceeded) {
          return Promise.reject("Unable to run npm shrinkwrap");
        }
      }
      //read npm-shrinkwrap.json
      let obj = JSON.parse(fs.readFileSync(npmShrinkwrapFilename, "utf8"));
      return this.flattenAndUniqDependencies(obj);
    } catch (e) {
      return Promise.reject(
        "npm shrinkwrap failed, try running it manually to see what went wrong:" +
          e.message
      );
    }
  }

  private async packageMavenForIq(workspaceRoot: string): Promise<Array<MavenDependency>>{
    try {
      //read pom.xml
      const pomFile = path.join(workspaceRoot, "pom.xml");

      /*
       * Need to use dependency tree operation because:
       * 1. Standard POM may lack dependency versions due to usage of property variables or inherited versions from parent POM
       * 2. Standard POM does not include transitive dependencies
       * 3. Effective POM may contain unused dependencies
       */
      const dependencyTree: string = await this.getDependencyTree(pomFile, workspaceRoot);

      // For example output, see: https://maven.apache.org/plugins/maven-dependency-plugin/examples/resolving-conflicts-using-the-dependency-tree.html
      const dependencies: string =  dependencyTree.replace(/[\| ]*[\\+][\\-]/g, "");  // cleanup each line to remove the "|", "+-", "\-" tree syntax
      console.debug(dependencies)
      console.debug("------------------------------------------------------------------------------")
      let dependencyList: MavenDependency[] = [];

      // Dependencies are returned from the above operation as newline-separated strings of the format group:artifact:extension:version:scope
      // Example: org.springframework.boot:spring-boot-starter:jar:2.0.3.RELEASE:compile
      for (let dep of dependencies.split("\n")){
        console.debug(dep)
        if (dep.trim()) {  //ignore empty lines
          const dependencyParts: string[] = dep.trim().split(":");
          const group: string = dependencyParts[0];
          const artifact: string = dependencyParts[1];
          const extension: string = dependencyParts[2];
          const version: string = dependencyParts[3];
          const scope: string = dependencyParts[4];

          if ("test" != scope) {  //dependencies used only during unit testing are generally ignored since they aren't included in the runtime artifact
            // artifactId, extension, and version are required fields. If a single dependency is missing any of the three, IQ will return a 400 response for the whole list
            if (artifact && extension && version) {
              const dependencyObject: MavenDependency = new MavenDependency(artifact, group, version, extension);
              dependencyList.push(dependencyObject);
            }
            else {
              console.warn("Skipping dependency: " + dep + " due to missing data (artifact, version, and/or extension)")
            }
          }
        }
      }

      return dependencyList;
    } catch (e) {
      return Promise.reject(
        "mvn dependency:tree failed, try running it manually to see what went wrong:" +
          e.message
      );
      throw e;
    }
  }

  private convertToNexusNpmFormat(dependencies: Array<any>) {
    return {
      components: _.map(dependencies, d => ({
        hash: d.hash,
        componentIdentifier: {
          format: "npm",
          coordinates: {
            packageId: d.name,
            version: d.version
          }
        }
      }))
    };
  }

  
  private convertToNexusMavenFormat(dependencies: Array<MavenDependency>) {
    return {
      components: _.map(dependencies, d => ({
        hash: d.hash,
        componentIdentifier: {
          format: "maven",
          coordinates: {
            artifactId: d.artifactId,
            groupId: d.groupId,
            version: d.version,
            extension: d.extension
          }
        }
      }))
    };
  }

  private toCoordValueTypeNpm(coordinate: Coordinates): string {
    return `${coordinate.packageId} - ${coordinate.version}`;
  }

  private toCoordValueTypeMaven(coordinate: MavenCoordinates): string {
    return `${coordinate.groupId}:${coordinate.artifactId} - ${coordinate.version}`;
  }

  private async performIqScan() {
    try {
      const workspaceRoot = vscode.workspace.rootPath;
      if (workspaceRoot === undefined) {
        throw new TypeError("No workspace opened");
      }

      const dependencyType = this.determineWorkspaceDependencyType(workspaceRoot);

      console.log("Project dependency type:" + dependencyType)

      let data = undefined;
      if (dependencyType === DependencyType.NPM) {
        let items = await this.packageNpmForIq(workspaceRoot);
        data = this.convertToNexusNpmFormat(items);
        // TODO in refresh?
        this.components = [];
        for (let entry of data.components) {
          let componentEntry = new ComponentEntry(
            entry.componentIdentifier.coordinates.packageId,
            entry.componentIdentifier.coordinates.version
          );
          this.components.push(componentEntry);
          let coordinates = entry.componentIdentifier.coordinates as Coordinates;
          this.coordsToComponent.set(
            this.toCoordValueTypeNpm(coordinates),
            componentEntry
          );
        }

      }
      else if(dependencyType === DependencyType.Maven){
        let items = await this.packageMavenForIq(workspaceRoot);
        data = this.convertToNexusMavenFormat(items);
        console.debug(data)

        this.components = [];
        for (let entry of data.components) {
          const packageId = entry.componentIdentifier.coordinates.groupId +":"+ entry.componentIdentifier.coordinates.artifactId;

          let componentEntry = new ComponentEntry(
            packageId,
            entry.componentIdentifier.coordinates.version
          );
          this.components.push(componentEntry);
          let coordinates = entry.componentIdentifier.coordinates as MavenCoordinates;
          // coordinates.packageId = packageId;
          this.coordsToComponent.set(
            this.toCoordValueTypeMaven(coordinates),
            componentEntry
          );
        }
      }

      if (undefined == data) {
        throw new RangeError("Attempted to generated dependency list but received an empty collection. NexusIQ will not be invoked for this project.");
      }

      console.log("getting applicationInternalId", this.applicationPublicId);
      let response = await this.getApplicationId(this.applicationPublicId);
      let appRep = JSON.parse(response as string);
      console.log("appRep", appRep);
      let applicationInternalId = appRep.applications[0].id; //'a6e65ec70f4a478f8e2198612917cd38';
      console.log("applicationInternalId", applicationInternalId);

      let resultId = await this.submitToIqForEvaluation(
        data,
        applicationInternalId as string
      );
      console.log("report", resultId);
      let resultDataString = await this.asyncPollForEvaluationResults(
        applicationInternalId as string,
        resultId as string
      );
      let resultData = JSON.parse(resultDataString as string);
      // parse result data
      console.log(`Received results from IQ scan:`, resultData);
      for (let resultEntry of resultData.results) {

        let componentEntry: ComponentEntry | undefined = undefined;
        if (dependencyType === DependencyType.NPM) {
          let coordinates = resultEntry.component.componentIdentifier
            .coordinates as Coordinates;
          componentEntry = this.coordsToComponent.get(
            this.toCoordValueTypeNpm(coordinates)
          );
        }
        else if (dependencyType === DependencyType.Maven){
          let coordinates = resultEntry.component.componentIdentifier
            .coordinates as MavenCoordinates;
          componentEntry = this.coordsToComponent.get(
            this.toCoordValueTypeMaven(coordinates)
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

  private flattenAndUniqDependencies(npmShrinkwrapContents: any): NpmPackage[] {
    console.log("flattenAndUniqDependencies");
    //first level in npm-shrinkwrap is our project package, we go a level deeper not to include it in the results
    // TODO: handle case where npmShrinkwrapContents does not have a 'dependencies' element defined (eg: simple projects)
    if (npmShrinkwrapContents.dependencies === undefined) {
      return new Array();
    }
    let flatDependencies = this.flattenDependencies(
      this.extractInfo(npmShrinkwrapContents.dependencies)
    );
    flatDependencies = _.uniqBy(flatDependencies, x => x.toString());
    return flatDependencies;
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
      return true;
    } catch (err) {
      return false;
    }
  }

  //extracts array with name, version, dependencies from a dictionary
  private extractInfo(array: any): NpmPackage[] {
    return Object.keys(array).map(
      k => new NpmPackage(k, array[k].version, array[k].dependencies)
    );
  }

  private flattenDependencies(dependencies: any): NpmPackage[] {
    let result = new Array<NpmPackage>();
    for (let dependency of dependencies) {
      result.push(dependency);
      if (dependency.dependencies) {
        result = result.concat(
          this.flattenDependencies(this.extractInfo(dependency.dependencies))
        );
      }
    }
    return result;
  }

  private async getDependencyTree(pomPath: string, workspaceRoot: string): Promise<string> {
    const outputPath: string = path.join(workspaceRoot, "dependency_tree.txt");
    await this.generateDependecyTree(pomPath, outputPath, workspaceRoot);
    const dependencyTree: string = fs.readFileSync(outputPath).toString();
    return dependencyTree;
  }

  private async generateDependecyTree(pomPath: string, outputPath: string, workspaceRoot: string): Promise<any> {
    return new Promise<{}>((
      resolve: (value: any) => void, 
      reject: (e: Error) => void): void => {
        console.log("Generating dependency tree");
        const proc = child_process.spawn('mvn', ['dependency:tree', '-Dverbose', `-DoutputFile="${outputPath}"`, `-f "${pomPath}"`], {
          cwd: workspaceRoot,
          env: {
            PATH: process.env.PATH
          },
          shell: true   
        });
        proc.on("error", (err: Error) => {
            reject(new Error(`Error occurred in generating dependency tree. Please check that maven is on your PATH. ${err.message}`));
        });
        proc.on("exit", (code: number, signal: string) => {
            if (code !== null) {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(new Error(`Dependency tree process terminated with code ${code}.`));
                }
            } else {
                reject(new Error(`Dependency tree process killed by signal ${signal}.`));
            }
        });
        proc.stdout.on("data", (chunk: Buffer) => {
          console.debug(chunk.toString());
        });
        proc.stderr.on("data", (chunk: Buffer) => {
          console.error(chunk.toString());
        });
    });
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
