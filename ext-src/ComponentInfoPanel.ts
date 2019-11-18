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
import { IqComponentModel } from "./IqComponentModel";

export class ConstraintReason {
  constructor(readonly reason: string) {}
}
export class ConstraintViolation {
  constructor(
    readonly constraintId: string,
    constraintName: string,
    readonly reasons: Array<ConstraintReason>
  ) {}
}

export class PolicyViolation {
  constructor(
    readonly policyId: string,
    readonly policyName: string,
    readonly threatLevel: number,
    readonly constraintViolations: Array<ConstraintViolation>
  ) {}
}

export class ComponentEntry {
  constructor(readonly name: string, readonly version: string) {}
  scope: string = "";
  failure: string = "";
  policyViolations: Array<PolicyViolation> = [];
  hash: string = "";
  nexusIQData: any = undefined;
  public toString(): string {
    return `${this.name} @ ${this.version}`;
  }
  public maxPolicy(): number {
    let maxThreatLevel = 0;
    if (!this.policyViolations) {
      return maxThreatLevel;
    }
    if (this.policyViolations && this.policyViolations.length > 0) {
      maxThreatLevel = this.policyViolations.reduce(
        (prevMax: number, a: PolicyViolation) => {
          console.log(a);
          return a.threatLevel > prevMax ? a.threatLevel : prevMax;
        },
        0
      );
    }
    return maxThreatLevel;
  }
  public iconName(): string {
    if (!this.policyViolations || !this.nexusIQData) {
      return "loading.gif";
    }
    let maxThreatLevel = this.maxPolicy();

    // TODO what is the right way to display threat level graphically?
    if (maxThreatLevel >= 8) {
      return `threat-critical.png`;
    } else if (maxThreatLevel >= 7) {
      return `threat-severe.png`;
    } else if (maxThreatLevel >= 5) {
      return `threat-moderate.png`;
    } else if (maxThreatLevel >= 1) {
      return `threat-low.png`;
    } else {
      return `threat-none.png`;
    }
  }
}

export class ComponentInfoPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ComponentInfoPanel | undefined;
  private iqComponentModel: IqComponentModel;

  // TODO get this from configuration or constructor
  private static iqApplicationId: string;
  private static iqApplicationPublicId: string;
  private static _settings: any;
  private static _ossSettings: any;

  component?: ComponentEntry;

  public static readonly viewType = "iqComponentInfoPanel";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionPath: string,
    newComponent: ComponentEntry,
    iqComponenentModel: IqComponentModel
  ) {

    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (ComponentInfoPanel.currentPanel) {
      ComponentInfoPanel.currentPanel._panel.reveal(column);
      ComponentInfoPanel.currentPanel.showComponent(newComponent);
      return;
    }

    // Otherwise, create a new panel.
    // TODO set title based on current selection
    const panel = vscode.window.createWebviewPanel(
      ComponentInfoPanel.viewType,
      "IQ Component Info",
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        localResourceRoots: [
          vscode.Uri.file(path.join(extensionPath, "resources")),
          vscode.Uri.file(path.join(extensionPath, "build"))
        ]
      }
    );

    ComponentInfoPanel.currentPanel = new ComponentInfoPanel(
      panel,
      extensionPath,
      iqComponenentModel
    );
    ComponentInfoPanel.currentPanel.showComponent(newComponent);
  }

  private static getSettings() {
    let iqConfig = vscode.workspace.getConfiguration("nexusiq");
    ComponentInfoPanel.iqApplicationId =  "";
    ComponentInfoPanel.iqApplicationPublicId =
      iqConfig.get("applicationPublicId") + "";

    ComponentInfoPanel._settings = {
      iqApplicationId: ComponentInfoPanel.iqApplicationId,
      iqApplicationPublicId: ComponentInfoPanel.iqApplicationPublicId
    };
  }

  private constructor(panel: vscode.WebviewPanel, extensionPath: string, iqComponentModel: IqComponentModel) {
    this._panel = panel;
    this._extensionPath = extensionPath;
    ComponentInfoPanel.getSettings();
    this.iqComponentModel = iqComponentModel;
    this.loadHtmlForWebview();

    const pageSettings = {
      appInternalId: ComponentInfoPanel._settings.iqApplicationId,
      username: ComponentInfoPanel._settings.iqUser,
      password: ComponentInfoPanel._settings.iqPassword,
      ossIndexUsername: ComponentInfoPanel._ossSettings.username,
      ossIndexPassword: ComponentInfoPanel._ossSettings.password
    };

    this._panel.webview.postMessage({
      command: "settings",
      settings: pageSettings
    });

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this.updateViewForThisComponent();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        console.log("onDidReceiveMessage", message);
        switch (message.command) {
          case "selectVersion":
            console.debug("selectVersion received, message:", message);
            this.showSelectedVersion(message.package.nexusIQData.component.componentIdentifier, message.version);
            return;
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
          case "getCVEDetails":
            this.showCVE(message.cve, message.nexusArtifact);
            return;
          case "Evaluate":
            vscode.window.showInformationMessage(
              JSON.stringify(message.artifact)
            );
            return;
          case "getRemediation":
            this.showRemediation(message.nexusArtifact);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private async showSelectedVersion(componentIdentifier: string, version: string) {
    console.log("showSelectedVersion", componentIdentifier);
    let body: any = await this.iqComponentModel.requestService.showSelectedVersion(componentIdentifier, version);
    
    this._panel.webview.postMessage({
      command: "versionDetails",
      componentDetails: body.componentDetails[0]
    });
  }

  private async showRemediation(nexusArtifact: any) {
    console.debug("showRemediation", nexusArtifact);
    let remediation = await this.iqComponentModel.requestService.getRemediation(nexusArtifact, ComponentInfoPanel.iqApplicationId);
    
    console.debug("posting message: remediation", remediation);
    this._panel.webview.postMessage({
      command: "remediationDetail",
      remediation: remediation
    });
  }

  private async showCVE(cve: any, nexusArtifact: any) {
    console.debug("showCVE", cve, nexusArtifact);
    let cvedetails = await this.iqComponentModel.requestService.getCVEDetails(cve, nexusArtifact);
    
    console.debug("posting message: cveDetails", cvedetails);
    this._panel.webview.postMessage({
      command: "cveDetails",
      cvedetails: cvedetails
    });
  }

  public dispose() {
    ComponentInfoPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private showComponent(newComponent: ComponentEntry) {
    if (
      !this.component ||
      !(
        this.component.name === newComponent.name &&
        this.component.version === newComponent.version
      )
    ) {
      this.component = newComponent;
      this.updateViewForThisComponent();

      // TODO CVE, remediation, security
    }
  }

  private updateViewForThisComponent() {
    console.debug(`Update called`);
    if (this.component) {
      this._panel.title = `IQ Scan: ${this.component.name}@${this.component.version}`;
      console.debug("posting message: artifact", this.component);

      this.showAllVersions();
      this._panel.webview.postMessage({
        command: "artifact",
        component: this.component
      });
    }
  }

  private async showAllVersions() {
    console.debug("showAllVersions", this.component);
    let allversions = await this.iqComponentModel.requestService.getAllVersions(this.component!.nexusIQData.component, ComponentInfoPanel.iqApplicationPublicId);
    
    console.debug("posting message: allversions", allversions);
    this._panel.webview.postMessage({
      command: "allversions",
      allversions: allversions
    });
  }

  private loadHtmlForWebview() {
    console.debug("loadHtmlForWebview", this.component);
    const settingsString = JSON.stringify(ComponentInfoPanel._settings);

    const onDiskPath = vscode.Uri.file(
      path.join(this._extensionPath, "resources")
    );
    const resourceSrc = onDiskPath.with({ scheme: "vscode-resource" });

    const manifest = require(path.join(
      this._extensionPath,
      "build",
      "asset-manifest.json"
    ));
    const mainScript = manifest["main.js"];
    const mainStyle = manifest["main.css"];

    const scriptPathOnDisk = vscode.Uri.file(
      path.join(this._extensionPath, "build", mainScript)
    );
    const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });

    const stylePathOnDisk = vscode.Uri.file(
      path.join(this._extensionPath, "build", mainStyle)
    );
    const styleUri = stylePathOnDisk.with({ scheme: "vscode-resource" });

    // Use a nonce to whitelist which scripts can be run
    const nonce = this.getNonce();

    let htmlBody = `<!DOCTYPE html>
				<head>
						<meta charset="utf-8">
						<meta http-equiv="X-UA-Compatible" content="IE=edge">
						<meta name="description" content="">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="Content-Security-Policy" content="default-src * vscode-resource:; script-src * vscode-resource:; connect-src 'self'; style-src * vscode-resource:; media-src * vscode-resource:">
						<link rel="stylesheet" href="${resourceSrc}/css/react-tabs.css">
            <link rel="stylesheet" href="${resourceSrc}/css/styles.css">
            <link rel="stylesheet" href="${styleUri}">
						<title>Component Info</title>
				</head>
				<body>
						
						<input type="hidden" id="settings" name="settings" value='${settingsString}'>
						<input type="hidden" id="resourceSrc" name="resourceSrc" value='${resourceSrc}'>
						<div id="root" />
						<script nonce="${nonce}" src="${scriptUri}"></script>
				</body>
		</html>`;
    this._panel.webview.html = htmlBody;
  }

  private getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
