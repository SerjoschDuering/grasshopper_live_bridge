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
exports.HelloResources = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class HelloResources {
    async listHelloResources() {
        const resources = [
            {
                uri: 'hello://readme',
                name: 'Extension README',
                description: 'The README file for GH Bridge extension',
                mimeType: 'text/markdown'
            },
            {
                uri: 'hello://config',
                name: 'Extension Configuration',
                description: 'Current extension configuration settings',
                mimeType: 'application/json'
            },
            {
                uri: 'hello://status',
                name: 'Extension Status',
                description: 'Current status and statistics of the extension',
                mimeType: 'application/json'
            },
            {
                uri: 'hello://package',
                name: 'Package.json',
                description: 'Extension manifest and dependencies',
                mimeType: 'application/json'
            }
        ];
        return resources;
    }
    async readHelloResource(uri) {
        if (uri === 'hello://readme') {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const readmePath = path.join(workspaceFolder.uri.fsPath, 'README.md');
                if (fs.existsSync(readmePath)) {
                    return fs.readFileSync(readmePath, 'utf8');
                }
            }
            return '# GH Bridge Extension\n\nBridging VS Code and Grasshopper for seamless visual programming.';
        }
        if (uri === 'hello://config') {
            const config = vscode.workspace.getConfiguration('ghBridge');
            return JSON.stringify({
                host: config.get('host'),
                port: config.get('port'),
                transport: config.get('transport'),
                persistSnapshots: config.get('persistSnapshots'),
                snapshotDir: config.get('snapshotDir'),
                scriptsDir: config.get('scriptsDir'),
                logVerbosity: config.get('logVerbosity')
            }, null, 2);
        }
        if (uri === 'hello://status') {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            let scriptCount = 0;
            let snapshotCount = 0;
            if (workspaceFolder) {
                const config = vscode.workspace.getConfiguration('ghBridge');
                const scriptsDir = config.get('scriptsDir', 'gh_scripts');
                const snapshotDir = config.get('snapshotDir', 'state');
                const scriptsPath = path.join(workspaceFolder.uri.fsPath, scriptsDir);
                const snapshotPath = path.join(workspaceFolder.uri.fsPath, snapshotDir);
                if (fs.existsSync(scriptsPath)) {
                    scriptCount = fs.readdirSync(scriptsPath).filter(f => f.match(/\.(py|cs|vb)$/)).length;
                }
                if (fs.existsSync(snapshotPath)) {
                    snapshotCount = fs.readdirSync(snapshotPath).filter(f => f.endsWith('.json')).length;
                }
            }
            return JSON.stringify({
                extensionName: 'GH Bridge',
                version: '0.1.0',
                status: 'active',
                workspace: workspaceFolder?.name || 'No workspace',
                statistics: {
                    scripts: scriptCount,
                    snapshots: snapshotCount,
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString()
                }
            }, null, 2);
        }
        if (uri === 'hello://package') {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const packagePath = path.join(workspaceFolder.uri.fsPath, 'package.json');
                if (fs.existsSync(packagePath)) {
                    return fs.readFileSync(packagePath, 'utf8');
                }
            }
            return JSON.stringify({ error: 'package.json not found' }, null, 2);
        }
        throw new Error(`Unknown hello resource: ${uri}`);
    }
}
exports.HelloResources = HelloResources;
//# sourceMappingURL=hello.resources.js.map