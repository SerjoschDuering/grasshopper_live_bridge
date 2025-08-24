"use strict";
/** Docs: TODO: check if suitable doc exist or consider to create new one */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleSocketClient = void 0;
class SimpleSocketClient {
    constructor(options = {}) {
        this.latencyMs = options.latencyMs || 50;
    }
    async send(action, data) {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, this.latencyMs));
        console.log(`[MockSocket] ${action}:`, data);
        // Mock responses for testing
        switch (action) {
            case 'ping':
                return { ok: true, data: { pong: true, ts: Date.now() } };
            case 'getCanvasState':
                return {
                    ok: true,
                    data: {
                        canvas: {
                            components: [
                                { id: 'comp-1', type: 'PythonScript', nickname: 'Test Script' },
                                { id: 'comp-2', type: 'Slider', nickname: 'Value' }
                            ],
                            connections: []
                        },
                        meta: { ghVersion: '8.0', generatedAt: new Date().toISOString() }
                    }
                };
            case 'getSelection':
                return {
                    ok: true,
                    data: { selection: { selectedIds: ['comp-1'] } }
                };
            case 'scriptUpdated':
                return {
                    ok: true,
                    data: { applied: true, warnings: [] }
                };
            default:
                return {
                    ok: false,
                    error: { code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` }
                };
        }
    }
    // Mock event emitter methods
    on(event, listener) {
        // No-op for mock
    }
    off(event, listener) {
        // No-op for mock
    }
}
exports.SimpleSocketClient = SimpleSocketClient;
//# sourceMappingURL=SimpleSocketClient.js.map