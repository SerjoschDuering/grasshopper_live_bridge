import * as vscode from 'vscode';

export class ControlItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly commandId: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.command = { command: commandId, title: label };
  }
}

export class ControlViewProvider implements vscode.TreeDataProvider<ControlItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ControlItem | undefined | null | void> = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<ControlItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private connected = false;

  setConnected(value: boolean) {
    this.connected = value;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ControlItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<ControlItem[]> {
    const items: ControlItem[] = [];
    items.push(new ControlItem(this.connected ? 'Disconnect' : 'Connect', 'ghBridge.toggleConnect'));
    items.push(new ControlItem('Fetch Canvas (Mock)', 'ghBridge.fetchCanvas'));
    items.push(new ControlItem('Open Graph Viewer', 'ghBridge.openGraphViewer'));
    items.push(new ControlItem('Init Project Scaffold', 'ghBridge.initProjectScaffold'));
    items.push(new ControlItem('Enable Watchers', 'ghBridge.enableWatchers'));
    return Promise.resolve(items);
  }
}


