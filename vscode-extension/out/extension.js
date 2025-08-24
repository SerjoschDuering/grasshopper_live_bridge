"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const shared_1 = require("@ghbridge/shared");
const GraphViewer_1 = require("./view/GraphViewer");
const ControlView_1 = require("./view/ControlView");
const EventLogView_1 = require("./view/EventLogView");
const FileWatchers_1 = require("./watchers/FileWatchers");
const DebugView_1 = require("./view/DebugView");
const GhBridgeMcpServer_1 = require("../../mcp-server/src/mcp/GhBridgeMcpServer");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
let output;
let statusItem;
let socket;
let state;
let viewer;
let controls;
let eventLog;
let eventLogView;
let watchers = null;
let debugView;
let mcpServer = null;
let mcpProcess = null;
function activate(context) {
    output = vscode.window.createOutputChannel('GH Bridge');
    socket = createSocketFromConfig();
    state = new shared_1.StateManager(context);
    viewer = new GraphViewer_1.GraphViewer(context);
    controls = new ControlView_1.ControlViewProvider();
    eventLog = new shared_1.EventLog(5000);
    eventLogView = new EventLogView_1.EventLogViewProvider(eventLog);
    debugView = new DebugView_1.DebugViewProvider();
    statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusItem.command = 'ghBridge.toggleConnect';
    context.subscriptions.push(statusItem);
    updateStatusBar();
    statusItem.show();
    socket.on('event', (evt) => {
        output.appendLine(`[event] ${evt.event} @ ${new Date(evt.ts).toISOString()}`);
    });
    // Initialize MCP server
    const config = vscode.workspace.getConfiguration('ghBridge');
    const enableMcp = config.get('enableMcpServer', true);
    if (enableMcp) {
        initializeMcpServer(context);
    }
    // Register MCP server definition so Claude Code can discover/start it
    registerMcpDefinition(context);
    context.subscriptions.push(vscode.window.registerTreeDataProvider('ghBridge.controls', controls), vscode.window.registerTreeDataProvider('ghBridge.eventLog', eventLogView), vscode.window.registerTreeDataProvider('ghBridge.debug', debugView), vscode.commands.registerCommand('ghBridge.toggleConnect', async () => {
        try {
            if (!socket.isConnected()) {
                await socket.connect();
                output.appendLine('Connected to GH (mock)');
                const hello = await socket.send('hello', { subscribe: ['canvasUpdated', 'selectionChanged'] });
                output.appendLine('Hello: ' + JSON.stringify(hello.data));
                eventLog.push({ tsClient: Date.now(), kind: 'DIAGNOSTIC', summary: 'Connected' });
            }
            else {
                await socket.disconnect();
                output.appendLine('Disconnected from GH (mock)');
                eventLog.push({ tsClient: Date.now(), kind: 'DIAGNOSTIC', summary: 'Disconnected' });
            }
        }
        catch (err) {
            void vscode.window.showErrorMessage('Toggle connect failed: ' + err?.message);
            eventLog.push({ tsClient: Date.now(), kind: 'ERROR', summary: 'Toggle connect failed' });
        }
        finally {
            updateStatusBar();
            controls.setConnected(socket.isConnected());
            eventLogView.refresh();
        }
    }), vscode.commands.registerCommand('ghBridge.fetchCanvas', async () => {
        try {
            const cfg = vscode.workspace.getConfiguration('ghBridge');
            const mode = cfg.get('serverMode', 'external');
            let data;
            if (mode === 'external') {
                const url = cfg.get('serverUrl', 'http://127.0.0.1:3098');
                const res = await fetch(url + '/canvas?includeSelection=true');
                data = await res.json();
            }
            else {
                if (!socket.isConnected()) {
                    void vscode.window.showWarningMessage('Not connected. Use Toggle Connect first.');
                    return;
                }
                const resp = await socket.send('getCanvasState', { includeSelection: true });
                if (!resp.ok)
                    throw new Error(resp.error?.message || 'Unknown error');
                data = resp.data;
            }
            const persist = cfg.get('persistSnapshots', true);
            const saved = await state.setLastSnapshot(data, persist);
            if (saved) {
                output.appendLine('Snapshot saved: ' + saved.fsPath);
            }
            else {
                output.appendLine('Snapshot updated in memory');
            }
            eventLog.push({ tsClient: Date.now(), kind: 'CANVAS_UPDATED', summary: 'Fetched canvas' });
            eventLogView.refresh();
            viewer.openOrReveal();
            viewer.update(data);
        }
        catch (err) {
            void vscode.window.showErrorMessage('Fetch canvas failed: ' + err?.message);
            eventLog.push({ tsClient: Date.now(), kind: 'ERROR', summary: 'Fetch canvas failed' });
            eventLogView.refresh();
        }
    }), vscode.commands.registerCommand('ghBridge.openGraphViewer', async () => {
        viewer.openOrReveal();
        const last = state.getLastSnapshot();
        if (last)
            viewer.update(last);
    }), vscode.commands.registerCommand('ghBridge.initProjectScaffold', async () => {
        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace) {
            void vscode.window.showWarningMessage('Open a folder to initialize project scaffold.');
            return;
        }
        const cfg = vscode.workspace.getConfiguration('ghBridge');
        const scriptsDir = cfg.get('scriptsDir', 'gh_scripts');
        const dirs = [scriptsDir, 'state', 'media', 'configs'];
        for (const d of dirs) {
            const uri = vscode.Uri.joinPath(workspace.uri, d);
            try {
                await vscode.workspace.fs.createDirectory(uri);
            }
            catch { }
        }
        void vscode.window.showInformationMessage('GH Bridge scaffold ensured.');
    }), vscode.commands.registerCommand('ghBridge.enableWatchers', async () => {
        if (watchers) {
            void vscode.window.showInformationMessage('Watchers already enabled.');
            return;
        }
        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace) {
            void vscode.window.showWarningMessage('Open a folder to enable watchers.');
            return;
        }
        watchers = new FileWatchers_1.FileWatchers(async (info) => {
            eventLog.push({ tsClient: Date.now(), kind: 'FS_CHANGE', summary: `Changed ${info.filePath}` });
            eventLogView.refresh();
            if (socket.isConnected() && info.componentUuid) {
                const res = await socket.send('scriptUpdated', {
                    componentUuid: info.componentUuid,
                    filePath: info.filePath,
                    language: (info.language === 'unknown' ? 'python' : info.language),
                    sha256: info.sha256,
                    fileSize: info.fileSize
                });
                if (res.ok && res.data?.applied) {
                    eventLog.push({ tsClient: Date.now(), kind: 'APPLIED', summary: 'Script applied', sha256: info.sha256 });
                }
                else {
                    eventLog.push({ tsClient: Date.now(), kind: 'ERROR', summary: 'Script update failed' });
                }
                eventLogView.refresh();
            }
        });
        watchers.register(context);
        void vscode.window.showInformationMessage('GH Bridge watchers enabled.');
    }), vscode.commands.registerCommand('ghBridge.startMcpServer', async () => {
        if (mcpServer) {
            void vscode.window.showInformationMessage('MCP server already running.');
            return;
        }
        initializeMcpServer(context);
    }), vscode.commands.registerCommand('ghBridge.stopMcpServer', async () => {
        if (!mcpServer) {
            void vscode.window.showInformationMessage('MCP server not running.');
            return;
        }
        await stopMcpServer();
        void vscode.window.showInformationMessage('MCP server stopped.');
    }), vscode.commands.registerCommand('ghBridge.restartMcpServer', async () => {
        await stopMcpServer();
        initializeMcpServer(context);
        void vscode.window.showInformationMessage('MCP server restarted.');
    }));
}
async function deactivate() {
    // Clean up MCP server on deactivation
    await stopMcpServer();
}
function updateStatusBar() {
    const connected = socket?.isConnected();
    statusItem.text = connected ? 'GH: Connected (mock)' : 'GH: Disconnected (mock)';
}
function createSocketFromConfig() {
    const cfg = vscode.workspace.getConfiguration('ghBridge');
    const backend = cfg.get('backend', 'mock');
    // Future: if backend === 'socket', return a real client
    return new shared_1.MockSocketClient({ latencyMs: 120 });
}
function initializeMcpServer(context) {
    try {
        // Check if MCP server should run as stdio or standalone
        const config = vscode.workspace.getConfiguration('ghBridge');
        const mcpTransport = config.get('mcpTransport', 'stdio');
        if (mcpTransport === 'stdio') {
            // Create the MCP server instance
            mcpServer = new GhBridgeMcpServer_1.GhBridgeMcpServer(context, socket, state, output);
            // For stdio mode, we start it directly
            mcpServer.start().then(() => {
                output.appendLine('[MCP] Server initialized successfully in stdio mode');
                void vscode.window.showInformationMessage('MCP server started (stdio mode)');
            }).catch((error) => {
                output.appendLine(`[MCP] Failed to start server: ${error}`);
                void vscode.window.showErrorMessage(`MCP server failed to start: ${error}`);
                mcpServer = null;
            });
        }
        else if (mcpTransport === 'process') {
            // For process mode, spawn a separate Node.js process
            const extensionPath = context.extensionPath;
            const mcpScriptPath = `${extensionPath}/out/mcp/mcpStandalone.js`;
            // Check if the compiled file exists
            const fs = require('fs');
            if (!fs.existsSync(mcpScriptPath)) {
                output.appendLine('[MCP] Creating standalone MCP script...');
                // We'll need to create a standalone entry point
                createMcpStandaloneScript(extensionPath);
            }
            // Spawn the MCP server process
            mcpProcess = (0, child_process_1.spawn)('node', [mcpScriptPath], {
                env: {
                    ...process.env,
                    GH_BRIDGE_WORKSPACE: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });
            mcpProcess.stdout?.on('data', (data) => {
                output.appendLine(`[MCP Process] ${data.toString()}`);
            });
            mcpProcess.stderr?.on('data', (data) => {
                output.appendLine(`[MCP Process Error] ${data.toString()}`);
            });
            mcpProcess.on('close', (code) => {
                output.appendLine(`[MCP Process] Exited with code ${code}`);
                mcpProcess = null;
            });
            void vscode.window.showInformationMessage('MCP server started (process mode)');
        }
    }
    catch (error) {
        output.appendLine(`[MCP] Error initializing server: ${error}`);
        void vscode.window.showErrorMessage(`Failed to initialize MCP server: ${error}`);
    }
}
async function stopMcpServer() {
    if (mcpServer) {
        try {
            await mcpServer.stop();
            output.appendLine('[MCP] Server stopped');
        }
        catch (error) {
            output.appendLine(`[MCP] Error stopping server: ${error}`);
        }
        mcpServer = null;
    }
    if (mcpProcess) {
        mcpProcess.kill();
        mcpProcess = null;
        output.appendLine('[MCP] Server process terminated');
    }
}
function createMcpStandaloneScript(extensionPath) {
    // Create a simple standalone script for running MCP server as a separate process
    const fs = require('fs');
    const path = require('path');
    const standaloneScript = `
// MCP Standalone Server Entry Point
const { GhBridgeMcpServer } = require('./GhBridgeMcpServer');
const { MockSocketClient } = require('../socket/MockSocketClient');
const { StateManager } = require('../state/StateManager');

// Simple console output channel mock
const outputChannel = {
  appendLine: (text) => console.log(text)
};

// Simple context mock
const context = {
  extensionPath: '${extensionPath}',
  subscriptions: [],
  workspaceState: {
    get: () => null,
    update: () => Promise.resolve()
  }
};

// Initialize components
const socket = new MockSocketClient({ latencyMs: 120 });
const state = new StateManager(context);

// Create and start MCP server
const server = new GhBridgeMcpServer(context, socket, state, outputChannel);

server.start().then(() => {
  console.log('[MCP Standalone] Server started successfully');
}).catch((error) => {
  console.error('[MCP Standalone] Failed to start:', error);
  process.exit(1);
});

// Handle shutdown
process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});
`;
    const scriptPath = path.join(extensionPath, 'out', 'mcp', 'mcpStandalone.js');
    fs.writeFileSync(scriptPath, standaloneScript);
}
function registerMcpDefinition(context) {
    try {
        // VS Code MCP registration API (when available via vscode.lm)
        const anyVscode = vscode;
        const lm = anyVscode.lm;
        if (!lm || !lm.registerMcpServerDefinitionProvider) {
            return; // older VS Code; nothing to register
        }
        const didChangeEmitter = new (anyVscode.EventEmitter || class {
            event() { }
            ;
            fire() { }
        })();
        const extensionId = 'gh-bridge';
        const provider = {
            onDidChangeMcpServerDefinitions: didChangeEmitter.event,
            provideMcpServerDefinitions: async () => {
                const serverPath = path.join(context.extensionPath, 'out', 'mcp', 'mcpStandalone.js');
                const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
                const def = new anyVscode.McpStdioServerDefinition('gh-bridge', 'node', [serverPath], { GH_BRIDGE_WORKSPACE: workspacePath }, '0.1.0');
                return [def];
            },
            resolveMcpServerDefinition: async (server) => server?.label === 'gh-bridge' ? server : undefined
        };
        context.subscriptions.push(lm.registerMcpServerDefinitionProvider(extensionId, provider));
    }
    catch {
        // ignore if API not present
    }
}
//# sourceMappingURL=extension.js.map