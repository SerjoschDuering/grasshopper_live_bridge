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
exports.FileWatchers = void 0;
const vscode = __importStar(require("vscode"));
const crypto = __importStar(require("crypto"));
class FileWatchers {
    constructor(onChange) {
        this.onChange = onChange;
        this.disposables = [];
    }
    register(context) {
        const cfg = vscode.workspace.getConfiguration('ghBridge');
        let globs = cfg.get('watchGlobs', []);
        if (!globs || globs.length === 0) {
            const scriptsDir = cfg.get('scriptsDir', 'gh_scripts');
            globs = [
                `${scriptsDir}/**/*.py`,
                `${scriptsDir}/**/*.cs`
            ];
        }
        for (const pattern of globs) {
            const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], pattern));
            watcher.onDidChange(uri => this.handle(uri));
            watcher.onDidCreate(uri => this.handle(uri));
            this.disposables.push(watcher);
        }
        context.subscriptions.push(...this.disposables);
    }
    async handle(uri) {
        try {
            const bytes = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(bytes).toString('utf8');
            const sha256 = crypto.createHash('sha256').update(content).digest('hex');
            const stat = await vscode.workspace.fs.stat(uri);
            const lang = uri.fsPath.endsWith('.py') ? 'python' : uri.fsPath.endsWith('.cs') ? 'cs' : 'unknown';
            const uuid = this.extractUuid(content, uri.fsPath);
            this.onChange({ filePath: uri.fsPath, componentUuid: uuid, sha256, fileSize: stat.size, language: lang });
        }
        catch (err) {
            // ignore errors for now
        }
    }
    extractUuid(content, filePath) {
        const cfg = vscode.workspace.getConfiguration('ghBridge');
        const headerKey = cfg.get('uuidHeaderKey', 'GH-Component-UUID');
        const headerMatch = content.split(/\r?\n/).slice(0, 30).join('\n').match(new RegExp(headerKey + ':\s*([0-9a-fA-F-]{32,36})'));
        if (headerMatch)
            return headerMatch[1];
        const regex = cfg.get('filenameUuidRegex', '__([0-9a-fA-F-]{32,36})\.(py|cs)$');
        const m = filePath.match(new RegExp(regex));
        return m ? m[1] : null;
    }
}
exports.FileWatchers = FileWatchers;
//# sourceMappingURL=FileWatchers.js.map