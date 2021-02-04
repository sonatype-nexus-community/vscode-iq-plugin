
import * as vscode from 'vscode';

export class PolicyItem extends vscode.TreeItem {
  children: PolicyItem[]|undefined;

  constructor(label: string, children?: PolicyItem[]) {
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                  vscode.TreeItemCollapsibleState.Expanded);

    this.children = children;
  }
}
