export type EventKind =
  | 'FS_CHANGE'
  | 'SCRIPT_PUSHED'
  | 'APPLIED'
  | 'CANVAS_UPDATED'
  | 'SELECTION_CHANGED'
  | 'DIAGNOSTIC'
  | 'ERROR';

export interface LogEvent {
  tsClient: number;
  kind: EventKind;
  summary: string;
  correlationId?: string;
  componentUuid?: string;
  sha256?: string;
}

export class EventLog {
  private buffer: LogEvent[] = [];
  private capacity: number;

  constructor(capacity: number = 5000) {
    this.capacity = capacity;
  }

  push(event: LogEvent): void {
    this.buffer.push(event);
    if (this.buffer.length > this.capacity) {
      this.buffer.splice(0, this.buffer.length - this.capacity);
    }
  }

  getSince(ms: number, kinds?: EventKind[]): LogEvent[] {
    const minTs = Date.now() - ms;
    return this.buffer.filter(e => e.tsClient >= minTs && (!kinds || kinds.includes(e.kind)));
  }

  all(): LogEvent[] {
    return [...this.buffer];
  }
}


