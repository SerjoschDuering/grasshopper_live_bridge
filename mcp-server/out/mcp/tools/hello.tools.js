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
exports.HelloTools = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class HelloTools {
    constructor(outputChannel, eventLogger) {
        this.outputChannel = outputChannel;
        this.eventLogger = eventLogger;
    }
    async getRecentLogs(args) {
        const lineCount = args?.lineCount || 20;
        // Get recent log entries from our event logger
        const recentEvents = this.eventLogger.getEvents(60000); // Last minute
        // Also get output channel text if possible
        const logs = recentEvents.map(e => `[${new Date(e.tsClient).toISOString()}] ${e.kind}: ${e.summary || ''}`).slice(-lineCount);
        this.eventLogger.log('HELLO_WORLD', undefined, undefined, `Retrieved ${logs.length} recent logs`);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        logs,
                        count: logs.length,
                        message: 'Recent logs from GH Bridge extension'
                    }, null, 2)
                }
            ]
        };
    }
    async listProjectStructure(args) {
        const maxDepth = args?.maxDepth || 2;
        const includeHidden = args?.includeHidden || false;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }
        const rootPath = workspaceFolder.uri.fsPath;
        const tree = this.buildDirectoryTree(rootPath, maxDepth, 0, includeHidden);
        this.eventLogger.log('HELLO_WORLD', undefined, undefined, 'Listed project structure');
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        root: workspaceFolder.name,
                        path: rootPath,
                        structure: tree,
                        message: `Project structure (${maxDepth} levels deep)`
                    }, null, 2)
                }
            ]
        };
    }
    async helloWorld(args) {
        const name = args?.name || 'World';
        const timestamp = new Date().toISOString();
        // Log to VS Code output
        this.outputChannel.appendLine(`[MCP Hello] Hello, ${name}! Called at ${timestamp}`);
        // Log to event logger
        this.eventLogger.log('HELLO_WORLD', undefined, undefined, `Greeted ${name}`);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        message: `Hello, ${name}!`,
                        timestamp,
                        extension: 'GH Bridge',
                        version: '0.1.0'
                    }, null, 2)
                }
            ]
        };
    }
    buildDirectoryTree(dirPath, maxDepth, currentDepth, includeHidden) {
        if (currentDepth >= maxDepth) {
            return { type: 'truncated', message: 'max depth reached' };
        }
        const result = {};
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                // Skip hidden files unless requested
                if (!includeHidden && entry.name.startsWith('.')) {
                    continue;
                }
                // Skip node_modules and other large directories
                if (entry.name === 'node_modules' || entry.name === 'out' || entry.name === '.git') {
                    result[entry.name] = { type: 'skipped' };
                    continue;
                }
                if (entry.isDirectory()) {
                    const subPath = path.join(dirPath, entry.name);
                    result[entry.name + '/'] = this.buildDirectoryTree(subPath, maxDepth, currentDepth + 1, includeHidden);
                }
                else {
                    const ext = path.extname(entry.name);
                    const stats = fs.statSync(path.join(dirPath, entry.name));
                    result[entry.name] = {
                        type: 'file',
                        size: stats.size,
                        ext: ext || 'none'
                    };
                }
            }
        }
        catch (error) {
            return { type: 'error', message: String(error) };
        }
        return result;
    }
}
exports.HelloTools = HelloTools;
//# sourceMappingURL=hello.tools.js.map