"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GhBridgeMcpServer_1 = require("./GhBridgeMcpServer");
const SimpleSocketClient_1 = require("../shared/SimpleSocketClient");
const SimpleStateManager_1 = require("../shared/SimpleStateManager");
const SimpleEventLog_1 = require("../shared/SimpleEventLog");
// import { HttpServerApp } from '../server/HttpServer';
const outputChannel = { appendLine: (t) => console.log(t) };
const context = { extensionPath: process.cwd(), subscriptions: [], workspaceState: { get: () => null, update: async () => { } } };
const socket = new SimpleSocketClient_1.SimpleSocketClient({ latencyMs: 120 });
const state = new SimpleStateManager_1.SimpleStateManager();
const log = new SimpleEventLog_1.SimpleEventLog(5000);
const server = new GhBridgeMcpServer_1.GhBridgeMcpServer(context, socket, state, outputChannel);
// const http = new HttpServerApp(socket, state, log);
server.start().then(() => outputChannel.appendLine('[MCP] Server started (stdio)'));
// http.start().then(() => outputChannel.appendLine('[HTTP] Server listening on 127.0.0.1:3098'));
process.on('SIGTERM', async () => { await server.stop(); process.exit(0); });
process.on('SIGINT', async () => { await server.stop(); process.exit(0); });
//# sourceMappingURL=mcpStandalone.js.map