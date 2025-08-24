import * as vscode from 'vscode';

export class DebugItem extends vscode.TreeItem {
  constructor(label: string, commandId: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.command = { command: commandId, title: label };
  }
}

export class DebugViewProvider implements vscode.TreeDataProvider<DebugItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

  refresh(): void { this._onDidChangeTreeData.fire(); }

  getTreeItem(element: DebugItem): vscode.TreeItem { return element; }

  getChildren(): Thenable<DebugItem[]> {
    const commands: Array<[string, string]> = [
      ['Toggle Connect', 'ghBridge.toggleConnect'],
      ['Fetch Canvas (Mock)', 'ghBridge.fetchCanvas'],
      ['Open Graph Viewer', 'ghBridge.openGraphViewer'],
      ['Init Project Scaffold', 'ghBridge.initProjectScaffold'],
      ['Enable Watchers', 'ghBridge.enableWatchers'],
      ['Start MCP Server', 'ghBridge.startMcpServer'],
      ['Restart MCP Server', 'ghBridge.restartMcpServer'],
      ['Stop MCP Server', 'ghBridge.stopMcpServer']
    ];
    return Promise.resolve(commands.map(([label, id]) => new DebugItem(label, id)));
  }
}


