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
exports.GraphViewer = void 0;
const vscode = __importStar(require("vscode"));
class GraphViewer {
    constructor(extensionContext) {
        this.extensionContext = extensionContext;
        this.panel = null;
    }
    openOrReveal() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel('ghGraphViewer', 'GH Graph Viewer', vscode.ViewColumn.Beside, {
            enableScripts: true,
            retainContextWhenHidden: true,
        });
        this.panel.webview.html = this.getHtml();
        this.panel.onDidDispose(() => {
            this.panel = null;
        });
    }
    update(snapshot) {
        if (!this.panel)
            return;
        this.panel.webview.postMessage({ type: 'snapshot', payload: snapshot });
    }
    getHtml() {
        const nonce = String(Math.random());
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GH Graph Viewer</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 12px; }
    .row { display: flex; gap: 12px; align-items: center; }
    .monospace { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    #stats { margin: 8px 0; color: #666; }
    #json { white-space: pre; background: #111; color: #ddd; padding: 12px; border-radius: 6px; overflow: auto; max-height: 70vh; }
    input[type="text"] { width: 260px; padding: 6px 8px; }
    .badge { background: #2d2; color: #000; padding: 2px 6px; border-radius: 6px; font-weight: 600; }
  </style>
  </head>
<body>
  <div class="row">
    <strong>GH Graph Viewer</strong>
    <span id="counts" class="badge">—</span>
    <input id="filter" type="text" placeholder="Search (key/value contains)" />
    <button id="copy">Copy JSON</button>
  </div>
  <div id="stats"></div>
  <pre id="json" class="monospace">Waiting for snapshot...</pre>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let latest = null;

    function updateView(snapshot) {
      latest = snapshot;
      const jsonEl = document.getElementById('json');
      const counts = document.getElementById('counts');
      const stats = document.getElementById('stats');
      const canvas = snapshot && snapshot.canvas ? snapshot.canvas : {};
      const nodes = Array.isArray(canvas.nodes) ? canvas.nodes.length : 0;
      const edges = Array.isArray(canvas.edges) ? canvas.edges.length : 0;
      counts.textContent = nodes + ' nodes / ' + edges + ' edges';
      stats.textContent = snapshot.meta ? ('Generated: ' + (snapshot.meta.generatedAt || 'n/a')) : '';
      jsonEl.textContent = JSON.stringify(snapshot, null, 2);
    }

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'snapshot') updateView(msg.payload);
    });

    document.getElementById('copy').addEventListener('click', () => {
      if (!latest) return;
      navigator.clipboard.writeText(JSON.stringify(latest, null, 2));
    });

    document.getElementById('filter').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const jsonEl = document.getElementById('json');
      if (!latest || !q) {
        jsonEl.textContent = JSON.stringify(latest, null, 2);
        return;
      }
      const text = JSON.stringify(latest, null, 2);
      const lines = text.split('\n');
      const filtered = lines.filter(line => line.toLowerCase().includes(q));
      jsonEl.textContent = filtered.join('\n');
    });
  </script>
</body>
</html>`;
    }
}
exports.GraphViewer = GraphViewer;
//# sourceMappingURL=GraphViewer.js.map