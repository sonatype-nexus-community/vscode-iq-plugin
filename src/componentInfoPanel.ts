import * as vscode from 'vscode';
import * as path from 'path';
import * as request from 'request';

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
	scope: string;
	failure: string;
	policyViolations: Array<PolicyViolation>;	
	hash:string;
	nexusIQData: any;
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
		if (!(this.policyViolations)) {
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
	public static iqUrl;
	public static iqUser;
	public static iqPassword;
	public static iqApplicationId;
	public static iqApplicationPublicId;
	private static  _settings: any;

	component: ComponentEntry;

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
				
				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'resources'))]
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
		ComponentInfoPanel.iqApplicationId = config.get("applicationId") + '';//.toString();
		ComponentInfoPanel.iqApplicationPublicId = config.get("applicationPublicId") + '';//.toString();
		ComponentInfoPanel._settings = {
			'iqUrl': ComponentInfoPanel.iqUrl, 
			'iqUser': ComponentInfoPanel.iqUser, 
			'iqPassword': ComponentInfoPanel.iqPassword, 
			'iqApplicationId': ComponentInfoPanel.iqApplicationId, 
			'iqApplicationPublicId': ComponentInfoPanel.iqApplicationPublicId
		};
		// public static iqUrl = 'http://iq-server:8070';
		// public static iqUser = 'admin';
		// public static iqPassword = 'admin123';
		// public static iqApplicationId = 'a6e65ec70f4a478f8e2198612917cd38';
		// public static iqApplicationPublicId = 'sandbox-application';
	

	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._panel = panel;
		this._extensionPath = extensionPath;
		ComponentInfoPanel.getSettings();
		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				console.log('message', message);
				switch (message.command) {
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
					case 'GetAllVersions':
						this.showAllVersions(message.nexusArtifact);
						return;								
				}
			},
			null,
			this._disposables
		);
	}
	private async showRemediation(nexusArtifact){
		console.log('showRemediation', nexusArtifact);
		let remediation = await this.getRemediation(nexusArtifact);
		console.log('remediation', remediation);
		this._panel.webview.postMessage({ command: 'remediation', 'remediation': remediation });
		// vscode.window.showInformationMessage(message.cve);

	}
	private async showCVE(cve, nexusArtifact){
		console.log('showCVE',cve,  nexusArtifact);
		let cvedetails = await this.GetCVEDetails(cve, nexusArtifact);
		// let cvedetails = JSON.stringify(cvePromise);
		console.log('cvedetails', cvedetails);
		this._panel.webview.postMessage({ command: 'cvedetails', 'cvedetails': cvedetails });
		// vscode.window.showInformationMessage(message.cve);

	}
	private async showAllVersions(nexusArtifact){
		console.log('showAllVersions', nexusArtifact);
		let allversions = await this.GetAllVersions(nexusArtifact);		
		// console.log('allversions', allversions);
		this._panel.webview.postMessage({ command: 'allversions', 'allversions': allversions });
		// vscode.window.showInformationMessage(message.cve);

	}
	

	
		
		
		
	private async GetAllVersions(nexusArtifact){//, settings) {
		return new Promise((resolve, reject) => {
			console.log('begin GetAllVersions', nexusArtifact);
			// let url="http://iq-server:8070/rest/vulnerability/details/cve/CVE-2018-3721?componentIdentifier=%7B%22format%22%3A%22maven%22%2C%22coordinates%22%3A%7B%22artifactId%22%3A%22springfox-swagger-ui%22%2C%22classifier%22%3A%22%22%2C%22extension%22%3A%22jar%22%2C%22groupId%22%3A%22io.springfox%22%2C%22version%22%3A%222.6.1%22%7D%7D&hash=4c854c86c91ab36c86fc&timestamp=1553676800618"
			// let servername = settings.baseURL;// + (settings.baseURL[settings.baseURL.length-1]=='/' ? '' : '/') ;//'http://iq-server:8070'
			//let CVE = 'CVE-2018-3721'
			
			let hash = nexusArtifact.component.hash;//'4c854c86c91ab36c86fc'
			// let componentIdentifier = '%7B%22format%22%3A%22maven%22%2C%22coordinates%22%3A%7B%22artifactId%22%3A%22springfox-swagger-ui%22%2C%22classifier%22%3A%22%22%2C%22extension%22%3A%22jar%22%2C%22groupId%22%3A%22io.springfox%22%2C%22version%22%3A%222.6.1%22%7D%7D'
			//let comp = encodeURI(JSON.stringify(nexusArtifact.component.componentIdentifier));
			let comp  = this.encodeComponentIdentifier(nexusArtifact.component.componentIdentifier);
			let d = new Date();
			let timestamp = d.getDate();
			let matchstate = "exact";
			let url=`${ComponentInfoPanel.iqUrl}/rest/ide/componentDetails/application/${ComponentInfoPanel.iqApplicationPublicId}/allVersions?componentIdentifier=${comp}&hash=${hash}&matchState=${matchstate}&timestamp=${timestamp}&proprietary=false`;
	
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
					// console.log('response', response);
					// console.log('body', body);					
					resolve(body);
					// return body;
				}
			);
		});
	}

	

	private async GetCVEDetails(cve, nexusArtifact){//, settings) {
		return new Promise((resolve, reject) => {
			console.log('begin GetCVEDetails', cve, nexusArtifact);
			// let url="http://iq-server:8070/rest/vulnerability/details/cve/CVE-2018-3721?componentIdentifier=%7B%22format%22%3A%22maven%22%2C%22coordinates%22%3A%7B%22artifactId%22%3A%22springfox-swagger-ui%22%2C%22classifier%22%3A%22%22%2C%22extension%22%3A%22jar%22%2C%22groupId%22%3A%22io.springfox%22%2C%22version%22%3A%222.6.1%22%7D%7D&hash=4c854c86c91ab36c86fc&timestamp=1553676800618"
			// let servername = settings.baseURL;// + (settings.baseURL[settings.baseURL.length-1]=='/' ? '' : '/') ;//'http://iq-server:8070'
			//let CVE = 'CVE-2018-3721'
			let timestamp = Date.now();
			let hash = nexusArtifact.components[0].hash;//'4c854c86c91ab36c86fc'
			// let componentIdentifier = '%7B%22format%22%3A%22maven%22%2C%22coordinates%22%3A%7B%22artifactId%22%3A%22springfox-swagger-ui%22%2C%22classifier%22%3A%22%22%2C%22extension%22%3A%22jar%22%2C%22groupId%22%3A%22io.springfox%22%2C%22version%22%3A%222.6.1%22%7D%7D'
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
					let cvedetails = response;
					
					
					resolve(body);
					// return body;
				}
			);
		});
	}



	private NexusFormat(artifact){
		return {
			"components": [{
				"component" : {
					"hash": artifact.hash,
					"componentIdentifier":{
						"format":"npm",
						"coordinates":{
							"packageId": artifact.name,
							"version": artifact.version
						}
					}
				}
			}]
		};
	}


private async getRemediation(nexusArtifact){//, settings) {
	return new Promise((resolve, reject) => {
		console.log('begin getRemediation', nexusArtifact);
		let timestamp = Date.now();
		
		//var requestdata = this.NexusFormat(nexusArtifact);
		
		// var requestdata = {
		// 	"components":[{
		// 		"componentIdentifier":nexusArtifact.component.componentIdentifier}
		// 		]
		// 	};
		var requestdata = nexusArtifact.component;
		let inputStr = JSON.stringify(requestdata);
		console.log('inputStr', inputStr);
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
			// TODO refresh the screen
			this._update();
		}
	}


	private _update() {
		console.log(`Update called`);
		if (this.component) {
			this._panel.title = `IQ Scan: ${this.component.name}@${this.component.version}`;
			// TODO update HTML with the new selection
			this.loadHtmlForWebview();
			console.log('posting message _update', this.component);
			this._panel.webview.postMessage({ command: 'artifact', 'component': this.component });
		}
	}
	private encodeComponentIdentifier(componentIdentifier){
		let actual =  encodeURIComponent(JSON.stringify(componentIdentifier));
		console.log('actual', actual);
		return actual;
	}
	private loadHtmlForWebview() {
		console.log('loadHtmlForWebview', this.component);
		const componentString = JSON.stringify(this.component);
		const settingsString = JSON.stringify(ComponentInfoPanel._settings);
		
		const onDiskPath = vscode.Uri.file(path.join(this._extensionPath, 'resources'));
		const resourceSrc = onDiskPath.with({scheme: 'vscode-resource'});
		let htmlBody = `<!DOCTYPE html>
				<head>
						<meta charset="utf-8">
						<meta http-equiv="X-UA-Compatible" content="IE=edge">
						<meta name="description" content="">
						<meta name="viewport" content="width=device-width, initial-scale=1">
						<link rel="stylesheet" href="${resourceSrc}/css/styles.css">
						<link rel="stylesheet" href="${resourceSrc}/js/jquery-ui-themes-1.12.1/themes/base/jquery-ui.min.css">        
						<link rel="stylesheet" href="${resourceSrc}/js/slick.grid.css" type="text/css"/>

						
		
						<title>Component Info</title>
				</head>
				<body>
						
						<input type="hidden" id="settings" name="settings" value='${settingsString}'>
						<input type="hidden" id="resourceSrc" name="resourceSrc" value='${resourceSrc}'>
						
						<div class="loader" id="loader"><img src="${resourceSrc}/SON_logo_favicon.png"></div>
		
				
						<div id="tabs" class="optionstable animate-bottom" >
							<ul>
								<li><a href="#tabs-1">Component Info</a></li>
								<li><a href="#tabs-2">Security</a></li>
								<li><a href="#tabs-3">Remediation</a></li>
								<li><a href="#tabs-4">Licensing</a></li>
							</ul>
							<!-- Remediation -->
							<div id="tabs-3">
								<div id="remediation"></div>
								<div id="myGrid" class="slick-grid" ></div>
							</div>
							<div id="tabs-1" class="component-tab">
								<div class="info-display">
								<table class="optionstable">
									<div id="component_identifier">
										<tr>
											<td class="label">Package:</td>
											<td class="data"><span id="package">${this.component.name}</span></td>
										</tr>
										<tr>
											<td class="label">Version:</td>
											<td class="data"><span id="version">${this.component.version}</span></td>
										</tr>
									</div>
									<tr>
										<td class="label"><span id="hash_label">Hash:</span></td>
										<td class="data"><span id="hash"></span></td>
									</tr>
									<tr>    
										<td class="label">Match State:</td>
										<td class="data"><span id="matchstate"></span></td>
									</tr>
									<tr id="CatalogDate_Row">
										<td class="label">Catalog Date:</td>
										<td class="data"><span id="catalogdate"></span></td>
									</tr>
									<tr id="RelativePopularity_Row">
										<td class="label">Relative Popularity:</td>                
										<td class="data"><span id="relativepopularity"></span></td>
									</tr>
									<tr>
										<td class="label">Highest CVSS Score:</td>                
										<td class="data"><span id="Highest_CVSS_Score" class="maxIssue"></span><span id="Num_CVSS_Issues" class="numissues"></span></td>
									</tr>							
									<tr>
										<td class="label">Data Source:</td>                
										<td class="data"><span id="datasource"></span></td>
									</tr>
								</table>									
								</div>
							</div>
							<!-- end of tabs-1 -->
							<!-- Security -->
							<div id="tabs-2">
								<div id="accordion"></div>
								<div id="dialog" title="Security Details" class="dialog"></div>
							</div>

							<!-- License -->
							<div id="tabs-4">
								<table class="optionstable" id="licensetable">
									<tr>
										<td colspan="2"><strong>DeclaredLicenses</strong></td>
										<td></td>
									</tr>            
										
									<div id="declaredlicenses">
									<tr>
										<td>License Id: <a id="declaredlicenses_licenseLink" href="test.html" target="_blank">LicenseLink</a></td>
										<td>License Name: <span id="declaredlicenses_licenseName"></span></td>
									</tr>  
									</div>
									<tr>
										<td colspan="2">
												<p><strong>Observed Licenses</strong></p>
										</td>
									</tr>                
									<div id="observedlicenses">                     
									<tr>
										<td>License Id: <span id="observedLicenses_licenseId"></span></td>
										<td><div id="observedLicenses_licenseLink"></div>License Name: <span id="observedLicenses_licenseName"></span></td>
									</tr>
									</div>
								</table>            
							</div>    							                     
						</div>
						<div id="error"  class="error"><p >Some error occurred</p></div>
		
								<!--First cut of this code will only handle a single npm component-->
						<script src="${resourceSrc}/js/jquery-3.3.1.min.js"></script>
						<script src="${resourceSrc}/js/jquery-ui-1.12.1/jquery-ui.min.js"></script>  
						<script src="${resourceSrc}/js/jquery.event.drag-2.3.0.js"></script>  
		
						<script src="${resourceSrc}/js/slick.core.js"></script>
						<script src="${resourceSrc}/js/slick.cellselectionmodel.js"></script>
						<script src="${resourceSrc}/js/slick.rowmovemanager.js"></script>
						<script src="${resourceSrc}/js/slick.grid.js"></script>
						<script src="${resourceSrc}/js/axios.min.js"></script>  
				
						<script src="${resourceSrc}/js/utils.js"></script>
						<script src="${resourceSrc}/js/popup.js"></script>   
								
				</body>
		</html>`;
		this._panel.webview.html = htmlBody;
	}
}
