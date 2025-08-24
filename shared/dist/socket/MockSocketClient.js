"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockSocketClient = void 0;
const events_1 = require("events");
class MockSocketClient {
    constructor(options) {
        this.connected = false;
        this.emitter = new events_1.EventEmitter();
        this.options = { latencyMs: 150, ...(options || {}) };
    }
    isConnected() {
        return this.connected;
    }
    async connect() {
        if (this.connected)
            return;
        await this.delay(this.options.latencyMs);
        this.connected = true;
    }
    async disconnect() {
        if (!this.connected)
            return;
        await this.delay(20);
        this.connected = false;
    }
    on(event, listener) {
        this.emitter.on(event, listener);
    }
    off(event, listener) {
        this.emitter.off(event, listener);
    }
    async send(action, data) {
        const correlationId = this.generateCorrelationId();
        const ts = Date.now();
        if (!this.connected) {
            return { type: 'response', ok: false, correlationId, ts, error: { code: 'NOT_CONNECTED', message: 'Socket is not connected' } };
        }
        await this.delay(this.options.latencyMs);
        switch (action) {
            case 'hello':
                return {
                    type: 'response',
                    ok: true,
                    correlationId,
                    ts: Date.now(),
                    data: { server: { version: 'mock-0.1', capabilities: ['events', 'applyScript'] }, negotiated: { compress: false } }
                };
            case 'ping':
                return { type: 'response', ok: true, correlationId, ts: Date.now(), data: { ok: true } };
            case 'getCanvasState': {
                const nowIso = new Date().toISOString();
                const mockCanvas = {
                    nodes: [
                        { id: 'n1', name: 'Number Slider', type: 'Param', value: 5 },
                        { id: 'n2', name: 'Multiply', type: 'Math', inputs: ['n1', 2] }
                    ],
                    edges: [
                        { from: 'n1', to: 'n2', slot: 0 }
                    ]
                };
                const payload = {
                    canvas: mockCanvas,
                    meta: { ghVersion: 'MockGH 7', generatedAt: nowIso }
                };
                if (data?.includeSelection) {
                    payload.selection = { selectedNodeIds: ['n1'] };
                }
                // Emit a canvasUpdated event asynchronously to mimic push
                setTimeout(() => {
                    this.emitter.emit('event', { type: 'event', event: 'canvasUpdated', ts: Date.now(), data: { canvas: mockCanvas } });
                }, this.options.latencyMs);
                return { type: 'response', ok: true, correlationId, ts: Date.now(), data: payload };
            }
            case 'getSelection':
                return { type: 'response', ok: true, correlationId, ts: Date.now(), data: { selection: { selectedNodeIds: ['n1'] } } };
            case 'scriptUpdated':
                return { type: 'response', ok: true, correlationId, ts: Date.now(), data: { applied: true, warnings: [] } };
            default:
                return { type: 'response', ok: false, correlationId, ts: Date.now(), error: { code: 'UNKNOWN_ACTION', message: String(action) } };
        }
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    generateCorrelationId() {
        // rudimentary UUID v4
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
    async fetchCanvas() {
        const response = await this.send('getCanvasState', { includeSelection: true });
        return response.data;
    }
}
exports.MockSocketClient = MockSocketClient;
//# sourceMappingURL=MockSocketClient.js.map