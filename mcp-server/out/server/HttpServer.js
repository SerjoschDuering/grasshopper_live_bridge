"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpServerApp = void 0;
const http_1 = require("http");
const url_1 = require("url");
class HttpServerApp {
    constructor(socket, state, log, opts) {
        this.server = (0, http_1.createServer)(this.requestHandler.bind(this));
        this.socket = socket;
        this.state = state;
        this.log = log;
        this.opts = { host: '127.0.0.1', port: 3098, ...(opts || {}) };
    }
    async start() {
        if (!this.socket.isConnected())
            await this.socket.connect();
        await new Promise((resolve) => this.server.listen(this.opts.port, this.opts.host, () => resolve()));
    }
    async stop() {
        await new Promise((resolve) => this.server.close(() => resolve()));
    }
    async requestHandler(req, res) {
        try {
            const url = new url_1.URL(req.url || '/', `http://${this.opts.host}:${this.opts.port}`);
            res.setHeader('Content-Type', 'application/json');
            if (url.pathname === '/health' && req.method === 'GET') {
                res.end(JSON.stringify({ ok: true, version: '0.1.0' }));
                return;
            }
            if (url.pathname === '/canvas' && req.method === 'GET') {
                const includeSelection = url.searchParams.get('includeSelection') === 'true';
                const resp = await this.socket.send('getCanvasState', { includeSelection });
                res.end(JSON.stringify(resp.data));
                return;
            }
            if (url.pathname === '/events' && req.method === 'GET') {
                const sinceMs = Number(url.searchParams.get('sinceMs') || '60000');
                const events = this.log.getSince(sinceMs);
                res.end(JSON.stringify({ events }));
                return;
            }
            if (url.pathname === '/scriptUpdated' && req.method === 'POST') {
                const body = await this.readJson(req);
                const resp = await this.socket.send('scriptUpdated', body);
                res.end(JSON.stringify(resp.data));
                return;
            }
            res.statusCode = 404;
            res.end(JSON.stringify({ ok: false, error: 'Not Found' }));
        }
        catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: err?.message || 'Internal Error' }));
        }
    }
    readJson(req) {
        return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', (chunk) => (data += chunk));
            req.on('end', () => {
                try {
                    resolve(data ? JSON.parse(data) : {});
                }
                catch (e) {
                    reject(e);
                }
            });
            req.on('error', reject);
        });
    }
}
exports.HttpServerApp = HttpServerApp;
//# sourceMappingURL=HttpServer.js.map