/** Docs: TODO: check if suitable doc exist or consider to create new one */

export type EventKind = 
  | 'FS_CHANGE' 
  | 'SCRIPT_PUSHED' 
  | 'APPLIED' 
  | 'CANVAS_UPDATED' 
  | 'SELECTION_CHANGED' 
  | 'DIAGNOSTIC' 
  | 'ERROR' 
  | 'HELLO_WORLD' 
  | 'MEDIA_ADDED';

export interface EventLogEntry {
  tsClient: number;
  tsServer?: number;
  kind: EventKind;
  correlationId?: string;
  componentUuid?: string;
  sha256?: string;
  summary?: string;
  data?: any;
}

export class SimpleEventLog {
  private events: EventLogEntry[] = [];

  constructor(private maxEvents = 5000) {}

  log(
    kind: EventKind, 
    correlationId?: string, 
    componentUuid?: string, 
    summary?: string, 
    data?: any
  ): void {
    const entry: EventLogEntry = {
      tsClient: Date.now(),
      kind,
      correlationId,
      componentUuid,
      summary,
      data
    };

    this.events.push(entry);
    
    // Keep only maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getEvents(sinceMs?: number): EventLogEntry[] {
    if (!sinceMs) return [...this.events];
    
    const cutoff = Date.now() - sinceMs;
    return this.events.filter(e => e.tsClient >= cutoff);
  }

  getEventsByComponent(componentUuid: string, sinceMs?: number): EventLogEntry[] {
    return this.getEvents(sinceMs).filter(e => e.componentUuid === componentUuid);
  }
}