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
exports.CanvasTools = void 0;
const vscode = __importStar(require("vscode"));
class CanvasTools {
    constructor(socketClient, stateManager, eventLogger) {
        this.socketClient = socketClient;
        this.stateManager = stateManager;
        this.eventLogger = eventLogger;
    }
    async getCanvasState(args) {
        const includeSelection = args?.includeSelection || false;
        // For now, use mock data since we're in mock mode
        const mockCanvas = this.stateManager.getLastSnapshot();
        if (!mockCanvas) {
            // Fetch fresh canvas state
            const canvasData = await this.socketClient.fetchCanvas();
            await this.stateManager.setLastSnapshot(canvasData, false);
            const canvas = this.stateManager.getLastSnapshot();
            this.eventLogger.log('CANVAS_UPDATED', undefined, undefined, 'Canvas fetched via MCP');
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            canvas,
                            selection: includeSelection ? this.stateManager.getLastSelection() : undefined,
                            meta: {
                                ghVersion: 'mock-1.0',
                                generatedAt: new Date().toISOString(),
                            },
                        }),
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        canvas: mockCanvas,
                        selection: includeSelection ? this.stateManager.getLastSelection() : undefined,
                        meta: {
                            ghVersion: 'mock-1.0',
                            generatedAt: new Date().toISOString(),
                        },
                    }),
                },
            ],
        };
    }
    async getSelection() {
        const selection = this.stateManager.getLastSelection();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ selection }),
                },
            ],
        };
    }
    async openGraphViewer(args) {
        // This would trigger the Graph Viewer webview
        await vscode.commands.executeCommand('ghBridge.openGraphViewer');
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ opened: true }),
                },
            ],
        };
    }
    async queryJson(args) {
        const { source, filePath, query } = args;
        let data;
        if (source === 'lastCanvas') {
            data = this.stateManager.getLastSnapshot();
        }
        else if (source === 'file' && filePath) {
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const content = fs.readFileSync(filePath, 'utf8');
            data = JSON.parse(content);
        }
        else {
            throw new Error('Invalid source or missing filePath');
        }
        // Simple JSONPath-like query (very basic implementation)
        // In production, use a proper JSONPath library
        const result = this.simpleQuery(data, query);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ result }),
                },
            ],
        };
    }
    simpleQuery(data, query) {
        // Very basic dot notation query
        // For production, use a proper JSONPath library
        const parts = query.split('.');
        let result = data;
        for (const part of parts) {
            if (result && typeof result === 'object') {
                result = result[part];
            }
            else {
                return undefined;
            }
        }
        return result;
    }
}
exports.CanvasTools = CanvasTools;
//# sourceMappingURL=canvas.tools.js.map