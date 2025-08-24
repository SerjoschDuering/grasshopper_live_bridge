"use strict";
/** Docs: TODO: check if suitable doc exist or consider to create new one */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleEventLog = void 0;
class SimpleEventLog {
    constructor(maxEvents = 5000) {
        this.maxEvents = maxEvents;
        this.events = [];
    }
    log(kind, correlationId, componentUuid, summary, data) {
        const entry = {
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
    getEvents(sinceMs) {
        if (!sinceMs)
            return [...this.events];
        const cutoff = Date.now() - sinceMs;
        return this.events.filter(e => e.tsClient >= cutoff);
    }
    getEventsByComponent(componentUuid, sinceMs) {
        return this.getEvents(sinceMs).filter(e => e.componentUuid === componentUuid);
    }
}
exports.SimpleEventLog = SimpleEventLog;
//# sourceMappingURL=SimpleEventLog.js.map