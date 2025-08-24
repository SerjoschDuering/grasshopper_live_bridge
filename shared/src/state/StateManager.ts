import * as vscode from 'vscode';

export interface CanvasSnapshot {
  canvas: any;
  selection?: any;
  meta?: any;
}

export class StateManager {
  private lastSnapshot: CanvasSnapshot | null = null;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  getLastSnapshot(): CanvasSnapshot | null {
    return this.lastSnapshot;
  }

  getLastSelection(): any {
    return this.lastSnapshot?.selection || null;
  }

  async setLastSnapshot(snapshot: CanvasSnapshot, persist: boolean): Promise<vscode.Uri | null> {
    this.lastSnapshot = snapshot;
    if (!persist) return null;
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace) return null;
    const cfg = vscode.workspace.getConfiguration('ghBridge');
    const dir = cfg.get<string>('snapshotDir', 'state');
    const filename = this.generateSnapshotFilename();
    const fileUri = vscode.Uri.joinPath(workspace.uri, dir, filename);
    try {
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspace.uri, dir));
      const json = Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8');
      await vscode.workspace.fs.writeFile(fileUri, json);
      return fileUri;
    } catch (err) {
      void vscode.window.showErrorMessage('Failed to write snapshot: ' + (err as any)?.message);
      return null;
    }
  }

  private generateSnapshotFilename(): string {
    const d = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const name =
      String(d.getFullYear()) +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) + '_' +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      pad(d.getSeconds()) + '.json';
    return name;
  }
}


