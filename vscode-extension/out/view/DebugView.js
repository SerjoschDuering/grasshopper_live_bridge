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
exports.DebugViewProvider = exports.DebugItem = void 0;
const vscode = __importStar(require("vscode"));
class DebugItem extends vscode.TreeItem {
    constructor(label, commandId) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.command = { command: commandId, title: label };
    }
}
exports.DebugItem = DebugItem;
class DebugViewProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }
    getChildren() {
        const commands = [
            ['Toggle Connect', 'ghBridge.toggleConnect'],
            ['Fetch Canvas (Mock)', 'ghBridge.fetchCanvas'],
            ['Open Graph Viewer', 'ghBridge.openGraphViewer'],
            ['Init Project Scaffold', 'ghBridge.initProjectScaffold'],
            ['Enable Watchers', 'ghBridge.enableWatchers'],
            ['Start MCP Server', 'ghBridge.startMcpServer'],
            ['Restart MCP Server', 'ghBridge.restartMcpServer'],
            ['Stop MCP Server', 'ghBridge.stopMcpServer']
        ];
        return Promise.resolve(commands.map(([label, id]) => new DebugItem(label, id)));
    }
}
exports.DebugViewProvider = DebugViewProvider;
//# sourceMappingURL=DebugView.js.map