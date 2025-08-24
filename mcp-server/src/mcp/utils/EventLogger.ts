import * as vscode from 'vscode';

export interface EventLogEntry {
    tsClient: number;
    tsServer?: number;
    kind: string;
    correlationId?: string;
    componentUuid?: string;
    sha256?: string;
    summary?: string;
}

export class EventLogger {
    private eventLog: EventLogEntry[] = [];
    private maxEventLogSize = 5000;
    private eventLogTTL = 5 * 60 * 1000; // 5 minutes

    constructor(private outputChannel: vscode.OutputChannel) {}

    log(
        kind: string,
        componentUuid?: string,
        sha256?: string,
        summary?: string,
        correlationId?: string
    ) {
        const event: EventLogEntry = {
            tsClient: Date.now(),
            kind,
            componentUuid,
            sha256,
            summary,
            correlationId,
        };

        this.eventLog.push(event);
        
        // Trim log if too large
        if (this.eventLog.length > this.maxEventLogSize) {
            this.eventLog = this.eventLog.slice(-this.maxEventLogSize);
        }

        // Clean old events
        this.cleanOldEvents();

        this.outputChannel.appendLine(`[MCP Event] ${kind}: ${summary || ''}`);
    }

    getEvents(sinceMs?: number, componentUuid?: string, kinds?: string[]): EventLogEntry[] {
        this.cleanOldEvents();
        
        let events = [...this.eventLog];
        
        if (sinceMs) {
            const cutoff = Date.now() - sinceMs;
            events = events.filter((e: EventLogEntry) => e.tsClient >= cutoff);
        }
        
        if (componentUuid) {
            events = events.filter((e: EventLogEntry) => e.componentUuid === componentUuid);
        }
        
        if (kinds && kinds.length > 0) {
            events = events.filter((e: EventLogEntry) => kinds.includes(e.kind));
        }

        return events;
    }

    private cleanOldEvents() {
        const cutoff = Date.now() - this.eventLogTTL;
        this.eventLog = this.eventLog.filter((e: EventLogEntry) => e.tsClient >= cutoff);
    }
}