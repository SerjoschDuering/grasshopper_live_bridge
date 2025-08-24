export type EventKind = 'FS_CHANGE' | 'SCRIPT_PUSHED' | 'APPLIED' | 'CANVAS_UPDATED' | 'SELECTION_CHANGED' | 'DIAGNOSTIC' | 'ERROR';
export interface LogEvent {
    tsClient: number;
    kind: EventKind;
    summary: string;
    correlationId?: string;
    componentUuid?: string;
    sha256?: string;
}
export declare class EventLog {
    private buffer;
    private capacity;
    constructor(capacity?: number);
    push(event: LogEvent): void;
    getSince(ms: number, kinds?: EventKind[]): LogEvent[];
    all(): LogEvent[];
}
