import * as vscode from 'vscode';
import * as crypto from 'crypto';

export interface ScriptFileInfo {
  filePath: string;
  componentUuid: string | null;
  sha256: string;
  fileSize: number;
  language: 'python' | 'cs' | 'vb' | 'unknown';
}

export class FileWatchers {
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly onChange: (info: ScriptFileInfo) => void) {}

  register(context: vscode.ExtensionContext) {
    const cfg = vscode.workspace.getConfiguration('ghBridge');
    let globs = cfg.get<string[]>('watchGlobs', []);
    if (!globs || globs.length === 0) {
      const scriptsDir = cfg.get<string>('scriptsDir', 'gh_scripts');
      globs = [
        `${scriptsDir}/**/*.py`,
        `${scriptsDir}/**/*.cs`
      ];
    }
    for (const pattern of globs) {
      const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.workspaceFolders![0], pattern));
      watcher.onDidChange(uri => this.handle(uri));
      watcher.onDidCreate(uri => this.handle(uri));
      this.disposables.push(watcher);
    }
    context.subscriptions.push(...this.disposables);
  }

  private async handle(uri: vscode.Uri) {
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      const content = Buffer.from(bytes).toString('utf8');
      const sha256 = crypto.createHash('sha256').update(content).digest('hex');
      const stat = await vscode.workspace.fs.stat(uri);
      const lang = uri.fsPath.endsWith('.py') ? 'python' : uri.fsPath.endsWith('.cs') ? 'cs' : 'unknown';
      const uuid = this.extractUuid(content, uri.fsPath);
      this.onChange({ filePath: uri.fsPath, componentUuid: uuid, sha256, fileSize: stat.size, language: lang });
    } catch (err) {
      // ignore errors for now
    }
  }

  private extractUuid(content: string, filePath: string): string | null {
    const cfg = vscode.workspace.getConfiguration('ghBridge');
    const headerKey = cfg.get<string>('uuidHeaderKey', 'GH-Component-UUID');
    const headerMatch = content.split(/\r?\n/).slice(0, 30).join('\n').match(new RegExp(headerKey + ':\s*([0-9a-fA-F-]{32,36})'));
    if (headerMatch) return headerMatch[1];
    const regex = cfg.get<string>('filenameUuidRegex', '__([0-9a-fA-F-]{32,36})\.(py|cs)$');
    const m = filePath.match(new RegExp(regex));
    return m ? m[1] : null;
  }
}


