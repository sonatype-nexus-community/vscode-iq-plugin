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
import * as vscode from 'vscode';
import { NexusExplorer } from './NexusExplorer';
import { 
	NEXUS_EXPLORER_DATA_SOURCE, 
	NEXUS_IQ_PUBLIC_APPLICATION_ID, 
	NEXUS_IQ_SERVER_URL, 
	NEXUS_IQ_USERNAME, 
	NEXUS_IQ_USER_PASSWORD } from './utils/Config';

export function activate(context: vscode.ExtensionContext) {

	const explorer = new NexusExplorer(context);

	// Listen to changes of the configuration, and updates things if we need to
	const eventConfigDisposable = vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration(NEXUS_EXPLORER_DATA_SOURCE)) {
			explorer.switchComponentModel(vscode.workspace.getConfiguration().get(NEXUS_EXPLORER_DATA_SOURCE) as string);
		}

		if (event.affectsConfiguration(NEXUS_IQ_PUBLIC_APPLICATION_ID)) {
			explorer.updateIQAppID(vscode.workspace.getConfiguration().get(NEXUS_IQ_PUBLIC_APPLICATION_ID) as string);
		}

		if (event.affectsConfiguration(NEXUS_IQ_SERVER_URL) ||
			event.affectsConfiguration(NEXUS_IQ_USERNAME) || 
			event.affectsConfiguration(NEXUS_IQ_USER_PASSWORD)) {
			explorer.refreshIQRequestService(
				{ url: vscode.workspace.getConfiguration().get(NEXUS_IQ_SERVER_URL) as string,
				 username: vscode.workspace.getConfiguration().get(NEXUS_IQ_USERNAME) as string,
				 token: vscode.workspace.getConfiguration().get(NEXUS_IQ_USER_PASSWORD) as string}
			)
		}
	});

	context.subscriptions.push(eventConfigDisposable);
}
