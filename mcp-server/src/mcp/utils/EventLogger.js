"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLogger = void 0;
class EventLogger {
    constructor(outputChannel) {
        this.outputChannel = outputChannel;
        this.eventLog = [];
        this.maxEventLogSize = 5000;
        this.eventLogTTL = 5 * 60 * 1000; // 5 minutes
    }
    log(kind, componentUuid, sha256, summary, correlationId) {
        const event = {
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
    getEvents(sinceMs, componentUuid, kinds) {
        this.cleanOldEvents();
        let events = [...this.eventLog];
        if (sinceMs) {
            const cutoff = Date.now() - sinceMs;
            events = events.filter((e) => e.tsClient >= cutoff);
        }
        if (componentUuid) {
            events = events.filter((e) => e.componentUuid === componentUuid);
        }
        if (kinds && kinds.length > 0) {
            events = events.filter((e) => kinds.includes(e.kind));
        }
        return events;
    }
    cleanOldEvents() {
        const cutoff = Date.now() - this.eventLogTTL;
        this.eventLog = this.eventLog.filter((e) => e.tsClient >= cutoff);
    }
}
exports.EventLogger = EventLogger;
//# sourceMappingURL=EventLogger.js.map