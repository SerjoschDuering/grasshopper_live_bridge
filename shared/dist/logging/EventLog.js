"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLog = void 0;
class EventLog {
    constructor(capacity = 5000) {
        this.buffer = [];
        this.capacity = capacity;
    }
    push(event) {
        this.buffer.push(event);
        if (this.buffer.length > this.capacity) {
            this.buffer.splice(0, this.buffer.length - this.capacity);
        }
    }
    getSince(ms, kinds) {
        const minTs = Date.now() - ms;
        return this.buffer.filter(e => e.tsClient >= minTs && (!kinds || kinds.includes(e.kind)));
    }
    all() {
        return [...this.buffer];
    }
}
exports.EventLog = EventLog;
//# sourceMappingURL=EventLog.js.map