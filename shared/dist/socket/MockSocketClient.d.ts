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
export declare class MockSocketClient implements ISocketClient {
    private connected;
    private emitter;
    private options;
    constructor(options?: MockSocketOptions);
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    on(event: 'event', listener: (evt: any) => void): void;
    off(event: 'event', listener: (evt: any) => void): void;
    send<TReq = any, TRes = any>(action: SocketAction, data: TReq): Promise<SocketResponse<TRes>>;
    private delay;
    private generateCorrelationId;
    fetchCanvas(): Promise<any>;
}
