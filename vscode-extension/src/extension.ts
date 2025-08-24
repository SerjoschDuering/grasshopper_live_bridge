import * as vscode from 'vscode';
import { MockSocketClient, ISocketClient, StateManager, EventLog } from '@ghbridge/shared';
import { GraphViewer } from './view/GraphViewer';
import { ControlViewProvider } from './view/ControlView';
import { EventLogViewProvider } from './view/EventLogView';
import { FileWatchers } from './watchers/FileWatchers';
import { DebugViewProvider } from './view/DebugView';
import { spawn } from 'child_process';
import * as path from 'path';
import * as path from 'path';

let output: vscode.OutputChannel;
let statusItem: vscode.StatusBarItem;
let socket: ISocketClient;
let state: StateManager;
let viewer: GraphViewer;
let controls: ControlViewProvider;
let eventLog: EventLog;
let eventLogView: EventLogViewProvider;
let watchers: FileWatchers | null = null;
let debugView: DebugViewProvider;
let mcpProcess: any = null;

export function activate(context: vscode.ExtensionContext) {
  output = vscode.window.createOutputChannel('GH Bridge');
  socket = createSocketFromConfig();
  state = new StateManager(context);
  viewer = new GraphViewer(context);
  controls = new ControlViewProvider();
  eventLog = new EventLog(5000);
  eventLogView = new EventLogViewProvider(eventLog);
  debugView = new DebugViewProvider();

  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusItem.command = 'ghBridge.toggleConnect';
  context.subscriptions.push(statusItem);
  updateStatusBar();
  statusItem.show();

  socket.on('event', (evt) => {
    output.appendLine(`[event] ${evt.event} @ ${new Date(evt.ts).toISOString()}`);
  });

  // Optionally register MCP server definition (for VS Code MCP-aware clients)
  registerMcpDefinition(context);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('ghBridge.controls', controls),
    vscode.window.registerTreeDataProvider('ghBridge.eventLog', eventLogView),
    vscode.window.registerTreeDataProvider('ghBridge.debug', debugView),
    vscode.commands.registerCommand('ghBridge.toggleConnect', async () => {
      try {
        if (!socket.isConnected()) {
          await socket.connect();
          output.appendLine('Connected to GH (mock)');
          const hello = await socket.send('hello', { subscribe: ['canvasUpdated', 'selectionChanged'] });
          output.appendLine('Hello: ' + JSON.stringify(hello.data));
          eventLog.push({ tsClient: Date.now(), kind: 'DIAGNOSTIC', summary: 'Connected' });
        } else {
          await socket.disconnect();
          output.appendLine('Disconnected from GH (mock)');
          eventLog.push({ tsClient: Date.now(), kind: 'DIAGNOSTIC', summary: 'Disconnected' });
        }
      } catch (err) {
        void vscode.window.showErrorMessage('Toggle connect failed: ' + (err as any)?.message);
        eventLog.push({ tsClient: Date.now(), kind: 'ERROR', summary: 'Toggle connect failed' });
      } finally {
        updateStatusBar();
        controls.setConnected(socket.isConnected());
        eventLogView.refresh();
      }
    }),

    vscode.commands.registerCommand('ghBridge.fetchCanvas', async () => {
      try {
        const cfg = vscode.workspace.getConfiguration('ghBridge');
        const mode = cfg.get<string>('serverMode', 'external');
        let data: any;
        if (mode === 'external') {
          const url = cfg.get<string>('serverUrl', 'http://127.0.0.1:3098');
          const res = await fetch(url + '/canvas?includeSelection=true');
          data = await res.json();
        } else {
          if (!socket.isConnected()) {
            void vscode.window.showWarningMessage('Not connected. Use Toggle Connect first.');
            return;
          }
          const resp = await socket.send('getCanvasState', { includeSelection: true });
          if (!resp.ok) throw new Error(resp.error?.message || 'Unknown error');
          data = resp.data;
        }
        const persist = cfg.get<boolean>('persistSnapshots', true);
        const saved = await state.setLastSnapshot(data as any, persist);
        if (saved) {
          output.appendLine('Snapshot saved: ' + saved.fsPath);
        } else {
          output.appendLine('Snapshot updated in memory');
        }
        eventLog.push({ tsClient: Date.now(), kind: 'CANVAS_UPDATED', summary: 'Fetched canvas' });
        eventLogView.refresh();
        viewer.openOrReveal();
        viewer.update(data);
      } catch (err) {
        void vscode.window.showErrorMessage('Fetch canvas failed: ' + (err as any)?.message);
        eventLog.push({ tsClient: Date.now(), kind: 'ERROR', summary: 'Fetch canvas failed' });
        eventLogView.refresh();
      }
    }),

    vscode.commands.registerCommand('ghBridge.openGraphViewer', async () => {
      viewer.openOrReveal();
      const last = state.getLastSnapshot();
      if (last) viewer.update(last);
    }),

    vscode.commands.registerCommand('ghBridge.initProjectScaffold', async () => {
      const workspace = vscode.workspace.workspaceFolders?.[0];
      if (!workspace) {
        void vscode.window.showWarningMessage('Open a folder to initialize project scaffold.');
        return;
      }
      const cfg = vscode.workspace.getConfiguration('ghBridge');
      const scriptsDir = cfg.get<string>('scriptsDir', 'gh_scripts');
      const dirs = [scriptsDir, 'state', 'media', 'configs'];
      for (const d of dirs) {
        const uri = vscode.Uri.joinPath(workspace.uri, d);
        try {
          await vscode.workspace.fs.createDirectory(uri);
        } catch {}
      }
      void vscode.window.showInformationMessage('GH Bridge scaffold ensured.');
    }),

    vscode.commands.registerCommand('ghBridge.enableWatchers', async () => {
      if (watchers) {
        void vscode.window.showInformationMessage('Watchers already enabled.');
        return;
      }
      const workspace = vscode.workspace.workspaceFolders?.[0];
      if (!workspace) {
        void vscode.window.showWarningMessage('Open a folder to enable watchers.');
        return;
      }
      watchers = new FileWatchers(async (info) => {
        eventLog.push({ tsClient: Date.now(), kind: 'FS_CHANGE', summary: `Changed ${info.filePath}` });
        eventLogView.refresh();
        if (socket.isConnected() && info.componentUuid) {
          const res = await socket.send('scriptUpdated', {
            componentUuid: info.componentUuid,
            filePath: info.filePath,
            language: (info.language === 'unknown' ? 'python' : info.language) as any,
            sha256: info.sha256,
            fileSize: info.fileSize
          });
          if (res.ok && (res.data as any)?.applied) {
            eventLog.push({ tsClient: Date.now(), kind: 'APPLIED', summary: 'Script applied', sha256: info.sha256 });
          } else {
            eventLog.push({ tsClient: Date.now(), kind: 'ERROR', summary: 'Script update failed' });
          }
          eventLogView.refresh();
        }
      });
      watchers.register(context);
      void vscode.window.showInformationMessage('GH Bridge watchers enabled.');
    }),

    vscode.commands.registerCommand('ghBridge.startMcpServer', async () => {
      if (mcpProcess) {
        void vscode.window.showInformationMessage('MCP server process already running.');
        return;
      }
      startMcpProcess(context);
    }),

    vscode.commands.registerCommand('ghBridge.stopMcpServer', async () => {
      await stopMcpProcess();
      void vscode.window.showInformationMessage('MCP server process stopped.');
    }),

    vscode.commands.registerCommand('ghBridge.restartMcpServer', async () => {
      await stopMcpProcess();
      startMcpProcess(context);
      void vscode.window.showInformationMessage('MCP server process restarted.');
    })
  );
}

export async function deactivate() { await stopMcpProcess(); }

function updateStatusBar() {
  const connected = socket?.isConnected();
  statusItem.text = connected ? 'GH: Connected (mock)' : 'GH: Disconnected (mock)';
}

function createSocketFromConfig(): ISocketClient {
  const cfg = vscode.workspace.getConfiguration('ghBridge');
  const backend = cfg.get<string>('backend', 'mock');
  // Future: if backend === 'socket', return a real client
  return new MockSocketClient({ latencyMs: 120 });
}
function startMcpProcess(context: vscode.ExtensionContext) {
  const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || context.extensionPath;
  const scriptPath = path.join(ws, 'apps', 'mcp-server', 'out', 'mcp', 'mcpStandalone.js');
  const fs = require('fs');
  if (!fs.existsSync(scriptPath)) {
    void vscode.window.showErrorMessage('MCP server script not found. Build apps/mcp-server first.');
    return;
  }
  mcpProcess = spawn('node', [scriptPath], {
    env: { ...process.env, GH_BRIDGE_WORKSPACE: ws },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  mcpProcess.stdout?.on('data', (data: Buffer) => output.appendLine(`[MCP Process] ${data.toString()}`));
  mcpProcess.stderr?.on('data', (data: Buffer) => output.appendLine(`[MCP Process Error] ${data.toString()}`));
  mcpProcess.on('close', (code: number) => { output.appendLine(`[MCP Process] Exited ${code}`); mcpProcess = null; });
}

async function stopMcpProcess() {
  if (mcpProcess) { try { mcpProcess.kill(); } catch {} mcpProcess = null; output.appendLine('[MCP] Server process terminated'); }
}

function registerMcpDefinition(context: vscode.ExtensionContext) {
  try {
    // VS Code MCP registration API (when available via vscode.lm)
    const anyVscode: any = vscode as any;
    const lm = anyVscode.lm;
    if (!lm || !lm.registerMcpServerDefinitionProvider) {
      return; // older VS Code; nothing to register
    }

    const didChangeEmitter = new (anyVscode.EventEmitter || class { event() {}; fire() {} })();
    const extensionId = 'gh-bridge';

    const provider = {
      onDidChangeMcpServerDefinitions: didChangeEmitter.event,
      provideMcpServerDefinitions: async () => {
        const serverPath = path.join(context.extensionPath, 'out', 'mcp', 'mcpStandalone.js');
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
        const def = new anyVscode.McpStdioServerDefinition(
          'gh-bridge',
          'node',
          [serverPath],
          { GH_BRIDGE_WORKSPACE: workspacePath },
          '0.1.0'
        );
        return [def];
      },
      resolveMcpServerDefinition: async (server: any) => server?.label === 'gh-bridge' ? server : undefined
    };

    context.subscriptions.push(lm.registerMcpServerDefinitionProvider(extensionId, provider));
  } catch {
    // ignore if API not present
  }
}


