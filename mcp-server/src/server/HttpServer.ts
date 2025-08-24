import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { MockSocketClient, StateManager, EventLog } from '@ghbridge/shared';

export interface HttpServerOptions {
  host?: string;
  port?: number;
}

export class HttpServerApp {
  private server = createServer(this.requestHandler.bind(this));
  private readonly socket: MockSocketClient;
  private readonly state: StateManager;
  private readonly log: EventLog;
  private readonly opts: Required<HttpServerOptions>;

  constructor(socket: MockSocketClient, state: StateManager, log: EventLog, opts?: HttpServerOptions) {
    this.socket = socket;
    this.state = state;
    this.log = log;
    this.opts = { host: '127.0.0.1', port: 3098, ...(opts || {}) } as Required<HttpServerOptions>;
  }

  async start(): Promise<void> {
    if (!this.socket.isConnected()) await this.socket.connect();
    await new Promise<void>((resolve) => this.server.listen(this.opts.port, this.opts.host, () => resolve()));
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
  }

  private async requestHandler(req: IncomingMessage, res: ServerResponse) {
    try {
      const url = new URL(req.url || '/', `http://${this.opts.host}:${this.opts.port}`);
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
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: err?.message || 'Internal Error' }));
    }
  }

  private readJson(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => {
        try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
      });
      req.on('error', reject);
    });
  }
}


