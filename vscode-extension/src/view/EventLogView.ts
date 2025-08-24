import * as vscode from 'vscode';
import { EventLog } from '@ghbridge/shared';

export interface LogEvent {
  tsClient: number;
  kind: string;
  summary: string;
}

export class EventLogItem extends vscode.TreeItem {
  constructor(public readonly evt: LogEvent) {
    super(new Date(evt.tsClient).toLocaleTimeString() + ' — ' + evt.summary, vscode.TreeItemCollapsibleState.None);
    this.description = evt.kind;
  }
}

export class EventLogViewProvider implements vscode.TreeDataProvider<EventLogItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

  constructor(private readonly log: EventLog) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: EventLogItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<EventLogItem[]> {
    const items = this.log.all().slice(-200).reverse().map(e => new EventLogItem(e));
    return Promise.resolve(items);
  }
}


