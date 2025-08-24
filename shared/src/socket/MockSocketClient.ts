import { EventEmitter } from 'events';
import { ISocketClient, SocketAction, SocketResponse } from './ISocketClient';

export interface SocketRequest<TData = any> {
  action: SocketAction;
  correlationId: string;
  ts: number;
  data: TData;
}

export interface MockSocketOptions {
  latencyMs?: number;
}

export class MockSocketClient implements ISocketClient {
  private connected: boolean = false;
  private emitter = new EventEmitter();
  private options: Required<MockSocketOptions>;

  constructor(options?: MockSocketOptions) {
    this.options = { latencyMs: 150, ...(options || {}) } as Required<MockSocketOptions>;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.delay(this.options.latencyMs);
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    await this.delay(20);
    this.connected = false;
  }

  on(event: 'event', listener: (evt: any) => void): void {
    this.emitter.on(event, listener);
  }

  off(event: 'event', listener: (evt: any) => void): void {
    this.emitter.off(event, listener);
  }

  async send<TReq = any, TRes = any>(action: SocketAction, data: TReq): Promise<SocketResponse<TRes>> {
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
          data: { server: { version: 'mock-0.1', capabilities: ['events', 'applyScript'] }, negotiated: { compress: false } } as any
        };
      case 'ping':
        return { type: 'response', ok: true, correlationId, ts: Date.now(), data: { ok: true } as any };
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
        const payload: any = {
          canvas: mockCanvas,
          meta: { ghVersion: 'MockGH 7', generatedAt: nowIso }
        };
        if ((data as any)?.includeSelection) {
          payload.selection = { selectedNodeIds: ['n1'] };
        }
        // Emit a canvasUpdated event asynchronously to mimic push
        setTimeout(() => {
          this.emitter.emit('event', { type: 'event', event: 'canvasUpdated', ts: Date.now(), data: { canvas: mockCanvas } });
        }, this.options.latencyMs);
        return { type: 'response', ok: true, correlationId, ts: Date.now(), data: payload };
      }
      case 'getSelection':
        return { type: 'response', ok: true, correlationId, ts: Date.now(), data: { selection: { selectedNodeIds: ['n1'] } } as any };
      case 'scriptUpdated':
        return { type: 'response', ok: true, correlationId, ts: Date.now(), data: { applied: true, warnings: [] } as any };
      default:
        return { type: 'response', ok: false, correlationId, ts: Date.now(), error: { code: 'UNKNOWN_ACTION', message: String(action) } };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateCorrelationId(): string {
    // rudimentary UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  async fetchCanvas(): Promise<any> {
    const response = await this.send('getCanvasState', { includeSelection: true });
    return response.data;
  }
}


