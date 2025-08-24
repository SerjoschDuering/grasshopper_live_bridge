export type SocketAction = 'hello' | 'ping' | 'getCanvasState' | 'getSelection' | 'scriptUpdated';
export interface SocketResponse<TData = any> {
    type: 'response';
    ok: boolean;
    correlationId: string;
    ts: number;
    data?: TData;
    error?: {
        code: string;
        message: string;
    } | null;
}
export interface ISocketClient {
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    on(event: 'event', listener: (evt: any) => void): void;
    off(event: 'event', listener: (evt: any) => void): void;
    send<TReq = any, TRes = any>(action: SocketAction, data: TReq): Promise<SocketResponse<TRes>>;
}
