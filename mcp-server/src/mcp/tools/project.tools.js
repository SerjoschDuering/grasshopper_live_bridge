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
exports.ProjectTools = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class ProjectTools {
    constructor(eventLogger) {
        this.eventLogger = eventLogger;
    }
    async initProjectScaffold() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }
        const config = vscode.workspace.getConfiguration('ghBridge');
        const scriptsDir = config.get('scriptsDir', 'gh_scripts');
        const snapshotDir = config.get('snapshotDir', 'state');
        const created = [];
        const dirs = [scriptsDir, snapshotDir, 'media', 'configs'];
        for (const dir of dirs) {
            const dirPath = path.join(workspaceFolder.uri.fsPath, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                created.push(dir);
                this.eventLogger.log('FS_CHANGE', undefined, undefined, `Created directory: ${dir}`);
            }
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ created }),
                },
            ],
        };
    }
    async getChangeLog(args) {
        const { sinceMs, componentUuid, kinds } = args;
        const events = this.eventLogger.getEvents(sinceMs, componentUuid, kinds);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ events }),
                },
            ],
        };
    }
    async confirmLastUpdate(args) {
        const { componentUuid, sha256 } = args;
        // Find last APPLIED event for this component
        const events = this.eventLogger.getEvents(60000, componentUuid, ['APPLIED']);
        const lastApplied = events.sort((a, b) => b.tsClient - a.tsClient)[0];
        if (!lastApplied) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ ok: false }),
                    },
                ],
            };
        }
        const ok = !sha256 || lastApplied.sha256 === sha256;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        ok,
                        appliedAt: new Date(lastApplied.tsClient).toISOString(),
                        warnings: [],
                    }),
                },
            ],
        };
    }
}
exports.ProjectTools = ProjectTools;
//# sourceMappingURL=project.tools.js.map