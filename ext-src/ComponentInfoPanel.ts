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
import { PackageURL } from 'packageurl-js';
import * as path from "path";
import * as vscode from "vscode";
import { ComponentEntry, NexusIQData } from "./models/ComponentEntry";
import { ComponentModel } from "./models/ComponentModel";
import { IqMultiProjectComponentModel } from "./models/IqMultiProjectComponentModel";
import { OssIndexComponentModel } from "./models/OssIndexComponentModel";
import { ReportComponent } from "./services/ReportResponse";
import { ScanType } from "./types/ScanType";
import { ILogger, LogLevel } from './utils/Logger';

export class ComponentInfoPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: ComponentInfoPanel | undefined;
  private componentModel: ComponentModel;

  // TODO get this from configuration or constructor
  private static iqApplicationId: string;
  private static iqApplicationPublicId: string;
  private static _settings: any;

  component?: ComponentEntry;

  public static readonly viewType = "iqComponentInfoPanel";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionPath: string,
    newComponent: ComponentEntry,
    componenentModel: ComponentModel,
    logger: ILogger
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
    logger.log(LogLevel.TRACE, `IQ Component Info Panel created`, panel.options)

    ComponentInfoPanel.currentPanel = new ComponentInfoPanel(
      panel,
      extensionPath,
      componenentModel,
      logger
    );
    ComponentInfoPanel.currentPanel.showComponent(newComponent);
  }

  private static getSettings() {
    let iqConfig = vscode.workspace.getConfiguration("nexusiq");
    ComponentInfoPanel.iqApplicationId = "";
    ComponentInfoPanel.iqApplicationPublicId =
      iqConfig.get("applicationPublicId") + "";

    ComponentInfoPanel._settings = {
      iqApplicationId: ComponentInfoPanel.iqApplicationId,
      iqApplicationPublicId: ComponentInfoPanel.iqApplicationPublicId
    };
  }

  private constructor(panel: vscode.WebviewPanel, extensionPath: string, componentModel: ComponentModel, readonly logger: ILogger) {
    this._panel = panel;
    this._extensionPath = extensionPath;
    ComponentInfoPanel.getSettings();
    this.componentModel = componentModel;
    this.loadHtmlForWebview();

    const pageSettings = {
      appInternalId: ComponentInfoPanel._settings.iqApplicationId,
      username: ComponentInfoPanel._settings.iqUser,
      password: ComponentInfoPanel._settings.iqPassword
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
        // console.log("onDidReceiveMessage", message);
        this.logger.log(LogLevel.TRACE, `WebView received message with command: ${message.command}`)
        switch (message.command) {
          case "selectVersion":
            console.debug("selectVersion received, message:", message);
            this.showSelectedVersion(message);
            return;
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
          case "getVulnDetails":
            this.showVulnerability(message.vulnID);
            return;
          case "Evaluate":
            vscode.window.showInformationMessage(
              JSON.stringify(message.artifact)
            );
            return;
          case "getRemediation":
            this.showRemediation(message.packageUrl);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private async showSelectedVersion(message: any) {
    // console.log("showSelectedVersion", message);
    if (this.componentModel instanceof IqMultiProjectComponentModel) {
      let iqData: NexusIQData = message.package.nexusIQData;
      let purl: PackageURL = PackageURL.fromString(iqData.component.packageUrl);
      purl.version = message.version;

      let decodedPurl = unescape(purl.toString());
      var iqComponentModel = this.componentModel as IqMultiProjectComponentModel
      let body = await iqComponentModel.requestService.showSelectedVersion(decodedPurl);

      // Dirty ugly hack because IQ Server removes + signs from versions for whatever reason
      if (iqData.component.componentIdentifier.format === 'golang') {
        body.componentDetails = this.dealWithGolang(body.componentDetails);
      }

      this._panel.webview.postMessage({
        command: "versionDetails",
        componentDetails: body.componentDetails[0],
        scanType: ScanType.NexusIq
      });
    } else if (this.componentModel instanceof OssIndexComponentModel) {
      this._panel.webview.postMessage({
        command: "versionDetails",
        componentDetails: message.package,
        vulnerabilities: message.package.ossIndexData.vulnerabilities,
        scanType: ScanType.OssIndex
      });
    }
  }

  private async showRemediation(purl: string) {
    console.debug("showRemediation", purl);
    if (this.componentModel instanceof IqMultiProjectComponentModel) {
      var iqComponentModel = this.componentModel as IqMultiProjectComponentModel
      const remediation = await iqComponentModel.requestService.getRemediation(purl);

      console.debug("posting message: remediation", remediation);
      this._panel.webview.postMessage({
        command: "remediationDetail",
        remediation: remediation
      });
    }
  }

  private async showVulnerability(vulnID: any) {
    console.debug("showVulnerability", vulnID);
    if (this.componentModel instanceof IqMultiProjectComponentModel) {
      var iqComponentModel = this.componentModel as IqMultiProjectComponentModel
      const vulnDetails = await iqComponentModel.requestService.getVulnerabilityDetails(vulnID);

      this._panel.webview.postMessage({
        command: "vulnDetails",
        vulnDetails: vulnDetails
      });
    }
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
    }
  }

  private updateViewForThisComponent() {
    console.debug(`Update called`);
    if (this.component) {
      var scanTitle = (this.componentModel instanceof OssIndexComponentModel) ? "OSS Index" : "IQ"
      this._panel.title = `${scanTitle} Scan: ${this.component.name}@${this.component.version}`;
      // console.log("posting message: artifact", this.component);

      this.showAllVersions();

      this._panel.webview.postMessage({
        command: "artifact",
        component: this.component
      });
    }
  }

  private async showAllVersions() {
    console.debug("showAllVersions", this.component);
    this.logger.log(LogLevel.TRACE, 'showAllVersions')
    if (this.componentModel instanceof IqMultiProjectComponentModel) {
      const iqComponentModel = this.componentModel as IqMultiProjectComponentModel
      const component: ReportComponent = this.component!.nexusIQData!.component;
      const purl: PackageURL = PackageURL.fromString(component.packageUrl);
      purl.version = "";

      let allVersions = await iqComponentModel.requestService.getAllVersions(purl);
      this.logger.log(LogLevel.TRACE, 'showAllVersions after getAllVersions()', purl)

      if (!allVersions.includes(component.componentIdentifier.coordinates.version)) {
        allVersions.push(component.componentIdentifier.coordinates.version);
      }

      let versionsDetails = await iqComponentModel.requestService.getAllVersionDetails(allVersions, purl);
      this.logger.log(LogLevel.TRACE, 'showAllVersions after getAllVersionDetails()', allVersions, purl)

      if (component.componentIdentifier.format === 'golang') {
        versionsDetails.componentDetails = this.dealWithGolang(versionsDetails.componentDetails);
      }

      console.debug("showAllVersions: PostMessage: allversions", versionsDetails.componentDetails);
      this.logger.log(LogLevel.TRACE, 'showAllVersions PostMessage: allversions', versionsDetails.componentDetails)
      this._panel.webview.postMessage({
        command: "allversions",
        allversions: versionsDetails.componentDetails
      });
    } else {
      this.logger.log(LogLevel.ERROR, 'ComponentModel is not a IqMultiProjectComponentModel')
    }
  }

  private dealWithGolang(versions: any[]): any[] {
    versions.forEach((version) => {
      version.component.componentIdentifier.coordinates.version = this.convertGolangVersion(
        version.component.componentIdentifier.coordinates.version
      );
    });

    return versions;
  }

  private convertGolangVersion(version: string) {
    if (version.includes("incompatible")) {
      let pos = version.lastIndexOf("incompatible");
      let vers = version.substring(0, pos).trimEnd() + "+" + version.substring(pos);

      return vers;
    }
    return version;
  }

  private loadHtmlForWebview() {
    console.debug("loadHtmlForWebview", this.component);
    this.logger.log(LogLevel.TRACE, "loadHtmlForWebview called")
    const settingsString = JSON.stringify(ComponentInfoPanel._settings);

    const onDiskPath = vscode.Uri.file(
      path.join(this._extensionPath, "resources")
    );
    const resourceSrc = onDiskPath.with({ scheme: "vscode-resource" });

    const scriptPathOnDisk = vscode.Uri.file(
      path.join(this._extensionPath, "build", 'index.js')
    );
    const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });

    // Use a nonce to whitelist which scripts can be run
    const nonce = this.getNonce();

    let htmlBody = `<!DOCTYPE html>
				<head>
						<meta charset="utf-8">
						<meta http-equiv="X-UA-Compatible" content="IE=edge">
						<meta name="description" content="">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="Content-Security-Policy" content="default-src * vscode-resource:; script-src * vscode-resource:; connect-src 'self'; style-src 'self' 'unsafe-inline' * vscode-resource:; media-src * vscode-resource:">
						<link rel="stylesheet" href="${resourceSrc}/css/react-tabs.css">
            <link rel="stylesheet" href="${resourceSrc}/css/styles.css">
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
