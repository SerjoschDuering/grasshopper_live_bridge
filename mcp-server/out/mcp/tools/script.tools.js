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
exports.ScriptTools = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto_1 = require("crypto");
class ScriptTools {
    constructor(socketClient, eventLogger) {
        this.socketClient = socketClient;
        this.eventLogger = eventLogger;
    }
    async createScriptFile(args) {
        const { componentUuid, language, nameHint } = args;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }
        const config = vscode.workspace.getConfiguration('ghBridge');
        const scriptsDir = config.get('scriptsDir', 'gh_scripts');
        const scriptsDirPath = path.join(workspaceFolder.uri.fsPath, scriptsDir);
        // Ensure scripts directory exists
        if (!fs.existsSync(scriptsDirPath)) {
            fs.mkdirSync(scriptsDirPath, { recursive: true });
        }
        const ext = language === 'python' ? 'py' : language === 'cs' ? 'cs' : 'vb';
        const fileName = `${nameHint || 'script'}__${componentUuid}.${ext}`;
        const filePath = path.join(scriptsDirPath, fileName);
        // Create file with header
        const header = language === 'python'
            ? `# GH-Component-UUID: ${componentUuid}\n# Created: ${new Date().toISOString()}\n\n`
            : `// GH-Component-UUID: ${componentUuid}\n// Created: ${new Date().toISOString()}\n\n`;
        fs.writeFileSync(filePath, header);
        const sha256 = (0, crypto_1.createHash)('sha256').update(header).digest('hex');
        this.eventLogger.log('FS_CHANGE', componentUuid, sha256, `Script file created: ${fileName}`);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ filePath, sha256 }),
                },
            ],
        };
    }
    async pushScriptUpdate(args) {
        const { componentUuid, filePath } = args;
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const sha256 = (0, crypto_1.createHash)('sha256').update(content).digest('hex');
        const fileSize = Buffer.byteLength(content, 'utf8');
        // In mock mode, just log the event
        const correlationId = this.generateCorrelationId();
        this.eventLogger.log('SCRIPT_PUSHED', componentUuid, sha256, `Pushed update for ${path.basename(filePath)}`);
        // Simulate successful apply
        setTimeout(() => {
            this.eventLogger.log('APPLIED', componentUuid, sha256, 'Applied without warnings');
        }, 100);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        applied: true,
                        warnings: [],
                        correlationId,
                        fileSize
                    }),
                },
            ],
        };
    }
    async listScripts() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ items: [] }),
                    },
                ],
            };
        }
        const config = vscode.workspace.getConfiguration('ghBridge');
        const scriptsDir = config.get('scriptsDir', 'gh_scripts');
        const scriptsDirPath = path.join(workspaceFolder.uri.fsPath, scriptsDir);
        if (!fs.existsSync(scriptsDirPath)) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ items: [] }),
                    },
                ],
            };
        }
        const items = [];
        const files = fs.readdirSync(scriptsDirPath);
        for (const file of files) {
            if (file.match(/\.(py|cs|vb)$/)) {
                const filePath = path.join(scriptsDirPath, file);
                const componentUuid = this.extractUuidFromFile(filePath);
                const language = file.endsWith('.py') ? 'python' : file.endsWith('.cs') ? 'cs' : 'vb';
                if (componentUuid) {
                    items.push({
                        filePath,
                        componentUuid,
                        language,
                    });
                }
            }
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ items }),
                },
            ],
        };
    }
    extractUuidFromFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').slice(0, 30);
            for (const line of lines) {
                const match = line.match(/GH-Component-UUID:\s*([0-9a-fA-F-]{32,36})/);
                if (match) {
                    return match[1];
                }
            }
            // Try filename
            const filename = path.basename(filePath);
            const filenameMatch = filename.match(/__([0-9a-fA-F-]{32,36})\.(py|cs|vb)$/);
            if (filenameMatch) {
                return filenameMatch[1];
            }
        }
        catch (error) {
            // Ignore
        }
        return null;
    }
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
}
exports.ScriptTools = ScriptTools;
//# sourceMappingURL=script.tools.js.map