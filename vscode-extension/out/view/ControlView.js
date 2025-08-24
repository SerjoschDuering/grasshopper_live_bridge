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
exports.ControlViewProvider = exports.ControlItem = void 0;
const vscode = __importStar(require("vscode"));
class ControlItem extends vscode.TreeItem {
    constructor(label, commandId) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.label = label;
        this.commandId = commandId;
        this.command = { command: commandId, title: label };
    }
}
exports.ControlItem = ControlItem;
class ControlViewProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.connected = false;
    }
    setConnected(value) {
        this.connected = value;
        this.refresh();
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        const items = [];
        items.push(new ControlItem(this.connected ? 'Disconnect' : 'Connect', 'ghBridge.toggleConnect'));
        items.push(new ControlItem('Fetch Canvas (Mock)', 'ghBridge.fetchCanvas'));
        items.push(new ControlItem('Open Graph Viewer', 'ghBridge.openGraphViewer'));
        items.push(new ControlItem('Init Project Scaffold', 'ghBridge.initProjectScaffold'));
        items.push(new ControlItem('Enable Watchers', 'ghBridge.enableWatchers'));
        return Promise.resolve(items);
    }
}
exports.ControlViewProvider = ControlViewProvider;
//# sourceMappingURL=ControlView.js.map