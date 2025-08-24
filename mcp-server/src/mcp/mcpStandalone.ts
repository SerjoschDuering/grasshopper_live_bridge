import { GhBridgeMcpServer } from './GhBridgeMcpServer';
import { SimpleSocketClient } from '../shared/SimpleSocketClient';
import { SimpleStateManager } from '../shared/SimpleStateManager';
import { SimpleEventLog } from '../shared/SimpleEventLog';
// import { HttpServerApp } from '../server/HttpServer';

const outputChannel = { appendLine: (t: string) => console.log(t) } as any;
const context = { extensionPath: process.cwd(), subscriptions: [], workspaceState: { get: () => null, update: async () => {} } } as any;

const socket = new SimpleSocketClient({ latencyMs: 120 });
const state = new SimpleStateManager();
const log = new SimpleEventLog(5000);

const server = new GhBridgeMcpServer(context, socket, state, outputChannel);
// const http = new HttpServerApp(socket, state, log);

server.start().then(() => outputChannel.appendLine('[MCP] Server started (stdio)'));
// http.start().then(() => outputChannel.appendLine('[HTTP] Server listening on 127.0.0.1:3098'));

process.on('SIGTERM', async () => { await server.stop(); process.exit(0); });
process.on('SIGINT', async () => { await server.stop(); process.exit(0); });


