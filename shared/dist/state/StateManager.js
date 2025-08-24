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
exports.StateManager = void 0;
const vscode = __importStar(require("vscode"));
class StateManager {
    constructor(context) {
        this.lastSnapshot = null;
        this.context = context;
    }
    getLastSnapshot() {
        return this.lastSnapshot;
    }
    getLastSelection() {
        return this.lastSnapshot?.selection || null;
    }
    async setLastSnapshot(snapshot, persist) {
        this.lastSnapshot = snapshot;
        if (!persist)
            return null;
        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace)
            return null;
        const cfg = vscode.workspace.getConfiguration('ghBridge');
        const dir = cfg.get('snapshotDir', 'state');
        const filename = this.generateSnapshotFilename();
        const fileUri = vscode.Uri.joinPath(workspace.uri, dir, filename);
        try {
            await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspace.uri, dir));
            const json = Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8');
            await vscode.workspace.fs.writeFile(fileUri, json);
            return fileUri;
        }
        catch (err) {
            void vscode.window.showErrorMessage('Failed to write snapshot: ' + err?.message);
            return null;
        }
    }
    generateSnapshotFilename() {
        const d = new Date();
        const pad = (n) => (n < 10 ? '0' + n : String(n));
        const name = String(d.getFullYear()) +
            pad(d.getMonth() + 1) +
            pad(d.getDate()) + '_' +
            pad(d.getHours()) +
            pad(d.getMinutes()) +
            pad(d.getSeconds()) + '.json';
        return name;
    }
}
exports.StateManager = StateManager;
//# sourceMappingURL=StateManager.js.map