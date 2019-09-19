import * as vscode from 'vscode';
import * as path from 'path';
import * as request from 'request';
import { VersionInfo, DisplayName } from './VersionInfo';


export class ConstraintReason {
	constructor(readonly reason: string) {}
}
export class ConstraintViolation {
	constructor(readonly constraintId: string, constraintName: string, readonly reasons: Array<ConstraintReason>){}
}

export class PolicyViolation {
	constructor(readonly policyId: string,
		readonly policyName: string,
		readonly threatLevel: number,
		readonly constraintViolations: Array<ConstraintViolation>) {}
}

export class ComponentEntry {
	constructor (
		readonly name: string, 
		readonly version: string)
	{

	}
	scope: string = "";
	failure: string = "";
	policyViolations: Array<PolicyViolation> = [];	
	hash:string = "";
	nexusIQData: any = undefined;
	public toString():string {
		return `${this.name} @ ${this.version}`;
	}
	public maxPolicy(): number{
		let maxThreatLevel = 0 ;
		if (!(this.policyViolations)) {
			return maxThreatLevel;
		}
		if (this.policyViolations && this.policyViolations.length > 0) {
			maxThreatLevel = this.policyViolations.reduce((prevMax: number, a: PolicyViolation) => {
					return a.threatLevel > prevMax ? a.threatLevel : prevMax;
				}, 0);
			
		}
		return maxThreatLevel;
	}
	public iconName(): string {		
		if (!this.policyViolations || !this.nexusIQData) {
			return 'loading.gif';
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

	
	// TODO get this from configuration or constructor
	public static iqUrl: string;
	public static iqUser: string;
	public static iqPassword: string;
	public static iqApplicationId: string;
	public static iqApplicationPublicId: string;
	private static  _settings: any;

	component?: ComponentEntry;

	public static readonly viewType = 'iqComponentInfoPanel';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];
	
	public static createOrShow(extensionPath: string, newComponent: ComponentEntry) {
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
			'IQ Component Info',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,
				
				localResourceRoots: [
					vscode.Uri.file(path.join(extensionPath, 'resources')),
					vscode.Uri.file(path.join(extensionPath, 'build'))
				]
			}
		);

		ComponentInfoPanel.currentPanel = new ComponentInfoPanel(panel, extensionPath);
		ComponentInfoPanel.currentPanel.showComponent(newComponent);
		

	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		ComponentInfoPanel.currentPanel = new ComponentInfoPanel(panel, extensionPath);
	}

	private static getSettings(){
		let config = vscode.workspace.getConfiguration('nexusiq.npm');
		ComponentInfoPanel.iqUrl = config.get("url")  + '';
		ComponentInfoPanel.iqUser = config.get("username") + '';
		ComponentInfoPanel.iqPassword = config.get("password") + '';
		ComponentInfoPanel.iqApplicationId = config.get("applicationId") + '';
		ComponentInfoPanel.iqApplicationPublicId = config.get("applicationPublicId") + '';
		ComponentInfoPanel._settings = {
			'iqUrl': ComponentInfoPanel.iqUrl, 
			'iqUser': ComponentInfoPanel.iqUser, 
			'iqPassword': ComponentInfoPanel.iqPassword, 
			'iqApplicationId': ComponentInfoPanel.iqApplicationId, 
			'iqApplicationPublicId': ComponentInfoPanel.iqApplicationPublicId
		};
	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._panel = panel;
		this._extensionPath = extensionPath;
		ComponentInfoPanel.getSettings();
		// Set the webview's initial html content
		//this._update();
		this.loadHtmlForWebview();

		// send the settings
		console.log('posting settings', this.component);
		const pageSettings = {
			serverName: ComponentInfoPanel._settings.iqUrl,
			appInternalId: ComponentInfoPanel._settings.iqApplicationId,
			username: ComponentInfoPanel._settings.iqUser,
			password: ComponentInfoPanel._settings.iqPassword
		}
		this._panel.webview.postMessage({ command: 'settings', 'settings': pageSettings });



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
				console.log('onDidReceiveMessage', message);
				switch (message.command) {
					case 'selectVersion':
						console.log("selectVersion received, message:", message);
						this.showSelectedVersion(message.package.nexusIQData.component.componentIdentifier, message.version);
						return;
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
					case 'GetCVEDetails':
						this.showCVE(message.cve, message.nexusArtifact);
						return;
					case 'Evaluate':
						vscode.window.showInformationMessage(JSON.stringify(message.artifact));
						return;
					case 'GetRemediation':
						this.showRemediation(message.nexusArtifact);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	private async showSelectedVersion(componentIdentifier: any, version: string) {

		return new Promise((resolve, reject) => {
			console.log('begin showSelectedVersion', componentIdentifier, version);
			var transmittingComponentIdentifier = {...componentIdentifier};
			transmittingComponentIdentifier.coordinates = {...componentIdentifier.coordinates};
			transmittingComponentIdentifier.coordinates.version = version;
			var detailsRequest = {
				'components': [
					{
						'hash': null,
						'componentIdentifier': transmittingComponentIdentifier
					}
				]
			}
				//servername has a slash
			let url = `${ComponentInfoPanel.iqUrl}/api/v2/components/details`;
	
			request.post(
				{
					method:'post',
					'json': detailsRequest,
					url: url,
					'auth':{'user':ComponentInfoPanel.iqUser, 'pass':ComponentInfoPanel.iqPassword}
				},
				(err, response, body) => {
					if (err) {
						reject(`Unable to retrieve selected version details: ${err}`);
						return;
					}
					console.log('showSelectedVersion response', response);
					console.log('showSelectedVersion body', body);				
					
					this._panel.webview.postMessage({ command: 'versionDetails', 'componentDetails': body.componentDetails[0]});
				}
			);
		});
	}


	private async showRemediation(nexusArtifact: any){
		console.log('showRemediation', nexusArtifact);
		let remediation = await this.getRemediation(nexusArtifact);
		console.log('posting message: remediation', remediation);
		this._panel.webview.postMessage({ command: 'remediation', 'remediation': remediation });
		// vscode.window.showInformationMessage(message.cve);

	}
	private async showCVE(cve: any, nexusArtifact: any){
		console.log('showCVE',cve,  nexusArtifact);
		let cvedetails = await this.GetCVEDetails(cve, nexusArtifact);
		// let cvedetails = JSON.stringify(cvePromise);
		console.log('posting message: cvedetails', cvedetails);
		this._panel.webview.postMessage({ command: 'cvedetails', 'cvedetails': cvedetails });
		// vscode.window.showInformationMessage(message.cve);

	}
	

	
		
		
		
	private async getAllVersions(): Promise<VersionInfo[]> {//, settings) {
		let nexusArtifact = this.component!.nexusIQData.component;
		if (!nexusArtifact || !nexusArtifact.hash) {
			return [];
		}
		return new Promise<VersionInfo[]>((resolve, reject) => {
			console.log('begin GetAllVersions', this.component);
			let hash = nexusArtifact.hash;
			let comp  = this.encodeComponentIdentifier(nexusArtifact.componentIdentifier);
			let d = new Date();
			let timestamp = d.getDate();
			let matchstate = "exact";
			let url=`${ComponentInfoPanel.iqUrl}/rest/ide/componentDetails/application/` +
					`${ComponentInfoPanel.iqApplicationPublicId}/allVersions?` +
					`componentIdentifier=${comp}&` +
					`hash=${hash}&matchState=${matchstate}&` +
					`timestamp=${timestamp}&proprietary=false`;
	

			request.get(
				{
					method:'GET',
					url: url,
					'auth':{'user':ComponentInfoPanel.iqUser, 'pass':ComponentInfoPanel.iqPassword}
				},
				(err, response, body) => {
					if (err) {
						reject(`Unable to retrieve GetAllVersions: ${err}`);
						return;
					}
					const versionArray = JSON.parse(body) as any[];
					var allVersions = versionArray.map((entry: any) => <VersionInfo>{
						displayName: {
							packageId: entry.componentIdentifier.coordinates.packageId as string,
							version: entry.componentIdentifier.coordinates.version as string
						} as DisplayName,
						threatLevel: entry.higestSecurityVulerabilitySeverity as number,
						popularity: entry.relativePopularity as number || 1
					});

					resolve(allVersions);
				}
			);
		});
	}

	

	private async GetCVEDetails(cve: any, nexusArtifact: any){//, settings) {
		return new Promise((resolve, reject) => {
			console.log('begin GetCVEDetails', cve, nexusArtifact);
			let timestamp = Date.now();
			let hash = nexusArtifact.components[0].hash;
			let componentIdentifier = this.encodeComponentIdentifier(nexusArtifact.components[0].componentIdentifier);
			let vulnerability_source;
			if (cve.search('sonatype')>=0){
				vulnerability_source = 'sonatype';
			}
			else{
				//CVE type
				vulnerability_source = 'cve';
			}
			//servername has a slash
		
			let url=`${ComponentInfoPanel.iqUrl}/rest/vulnerability/details/${vulnerability_source}/${cve}?componentIdentifier=${componentIdentifier}&hash=${hash}&timestamp=${timestamp}`;
	
			request.get(
				{
					method:'GET',
					url: url,
					'auth':{'user':ComponentInfoPanel.iqUser, 'pass':ComponentInfoPanel.iqPassword}
				},
				(err, response, body) => {
					if (err) {
						reject(`Unable to retrieve CVEData: ${err}`);
						return;
					}
					console.log('response', response);
					console.log('body', body);
					
					resolve(body);
					// return body;
				}
			);
		});
	}




private async getRemediation(nexusArtifact: any){//, settings) {
	return new Promise((resolve, reject) => {
		console.log('begin getRemediation', nexusArtifact);
		var requestdata = nexusArtifact.component;
		console.log('requestdata', requestdata);
		//servername has a slash
		let url = `${ComponentInfoPanel.iqUrl}/api/v2/components/remediation/application/${ComponentInfoPanel.iqApplicationId}`;
		

		request.post(
			{
				method:'post',
				'json': requestdata,
				url: url,
				'auth':{'user':ComponentInfoPanel.iqUser, 'pass':ComponentInfoPanel.iqPassword}
			},
			(err, response, body) => {
				if (err) {
					reject(`Unable to retrieve Component details: ${err}`);
					return;
				}
				console.log('response', response);
				console.log('body', body);				
				resolve(body);
			}
		);
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
		if (!(this.component) || 
			!(this.component.name === newComponent.name && this.component.version === newComponent.version)) {
			// a new component has been sent, refresh the view
			this.component = newComponent;
			this.updateViewForThisComponent();

			// TODO CVE, remediation, security
		}
	}


	private updateViewForThisComponent() {
		console.log(`Update called`);
		if (this.component) {
			this._panel.title = `IQ Scan: ${this.component.name}@${this.component.version}`;
			console.log('posting message: artifact', this.component);
			this.showAllVersions();
			this._panel.webview.postMessage({ command: 'artifact', 'component': this.component });
		}
	}

	private async showAllVersions(){
		console.log('showAllVersions', this.component);
		let allversions = await this.getAllVersions();		
		console.log('posting message: allversions', allversions);
		this._panel.webview.postMessage({ command: 'allversions', 'allversions': allversions });
		// vscode.window.showInformationMessage(message.cve);

	}

	private encodeComponentIdentifier(componentIdentifier: string){
		let actual =  encodeURIComponent(JSON.stringify(componentIdentifier));
		console.log('actual', actual);
		return actual;
	}

	private loadHtmlForWebview() {
		console.log('loadHtmlForWebview', this.component);
		const settingsString = JSON.stringify(ComponentInfoPanel._settings);
		
		const onDiskPath = vscode.Uri.file(path.join(this._extensionPath, 'resources'));
		const resourceSrc = onDiskPath.with({scheme: 'vscode-resource'});

		const manifest = require(path.join(this._extensionPath, 'build', 'asset-manifest.json'));
		const mainScript = manifest['main.js'];
		//const mainStyle = manifest['main.css'];
		const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'build', mainScript));
		const scriptUri = scriptPathOnDisk.with({ scheme: 'vscode-resource' });

		// Use a nonce to whitelist which scripts can be run
		const nonce = this.getNonce();

		let htmlBody = `<!DOCTYPE html>
				<head>
						<meta charset="utf-8">
						<meta http-equiv="X-UA-Compatible" content="IE=edge">
						<meta name="description" content="">
						<meta name="viewport" content="width=device-width, initial-scale=1">
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
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}
