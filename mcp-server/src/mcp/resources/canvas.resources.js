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
exports.CanvasResources = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
class CanvasResources {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }
    async listResources() {
        const resources = [];
        // Add current canvas state as a resource
        const lastSnapshot = this.stateManager.getLastSnapshot();
        if (lastSnapshot) {
            resources.push({
                uri: 'canvas://current',
                name: 'Current Canvas State',
                description: 'The current Grasshopper canvas state',
                mimeType: 'application/json'
            });
        }
        // Add saved snapshots as resources
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            const config = vscode.workspace.getConfiguration('ghBridge');
            const snapshotDir = config.get('snapshotDir', 'state');
            const snapshotPath = path.join(workspaceFolder.uri.fsPath, snapshotDir);
            if (fs.existsSync(snapshotPath)) {
                const files = fs.readdirSync(snapshotPath)
                    .filter(f => f.endsWith('.json'))
                    .sort()
                    .reverse()
                    .slice(0, 10); // Last 10 snapshots
                for (const file of files) {
                    resources.push({
                        uri: `canvas://snapshot/${file}`,
                        name: `Snapshot: ${file.replace('.json', '')}`,
                        description: `Canvas snapshot from ${this.formatSnapshotDate(file)}`,
                        mimeType: 'application/json'
                    });
                }
            }
        }
        // Add script files as resources
        if (workspaceFolder) {
            const config = vscode.workspace.getConfiguration('ghBridge');
            const scriptsDir = config.get('scriptsDir', 'gh_scripts');
            const scriptsPath = path.join(workspaceFolder.uri.fsPath, scriptsDir);
            if (fs.existsSync(scriptsPath)) {
                const files = fs.readdirSync(scriptsPath)
                    .filter(f => f.match(/\.(py|cs|vb)$/));
                for (const file of files) {
                    const ext = path.extname(file).slice(1);
                    const mimeType = ext === 'py' ? 'text/x-python' :
                        ext === 'cs' ? 'text/x-csharp' : 'text/x-vb';
                    resources.push({
                        uri: `script://${file}`,
                        name: `Script: ${file}`,
                        description: `Grasshopper ${ext.toUpperCase()} script`,
                        mimeType
                    });
                }
            }
        }
        return resources;
    }
    async readResource(uri) {
        if (uri === 'canvas://current') {
            const snapshot = this.stateManager.getLastSnapshot();
            return JSON.stringify(snapshot, null, 2);
        }
        if (uri.startsWith('canvas://snapshot/')) {
            const filename = uri.replace('canvas://snapshot/', '');
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const config = vscode.workspace.getConfiguration('ghBridge');
                const snapshotDir = config.get('snapshotDir', 'state');
                const filePath = path.join(workspaceFolder.uri.fsPath, snapshotDir, filename);
                if (fs.existsSync(filePath)) {
                    return fs.readFileSync(filePath, 'utf8');
                }
            }
        }
        if (uri.startsWith('script://')) {
            const filename = uri.replace('script://', '');
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const config = vscode.workspace.getConfiguration('ghBridge');
                const scriptsDir = config.get('scriptsDir', 'gh_scripts');
                const filePath = path.join(workspaceFolder.uri.fsPath, scriptsDir, filename);
                if (fs.existsSync(filePath)) {
                    return fs.readFileSync(filePath, 'utf8');
                }
            }
        }
        throw new Error(`Resource not found: ${uri}`);
    }
    formatSnapshotDate(filename) {
        // Parse filename like 20250824_101112.json
        const match = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
        if (match) {
            const [, year, month, day, hour, minute, second] = match;
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }
        return filename;
    }
}
exports.CanvasResources = CanvasResources;
//# sourceMappingURL=canvas.resources.js.map