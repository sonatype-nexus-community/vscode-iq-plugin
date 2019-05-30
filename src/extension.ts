'use strict';

import * as vscode from 'vscode';

import { NexusExplorer } from './nexusExplorer';

export function activate(context: vscode.ExtensionContext) {

	new NexusExplorer(context);
}