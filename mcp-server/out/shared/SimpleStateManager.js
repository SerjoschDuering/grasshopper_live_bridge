"use strict";
/** Docs: TODO: check if suitable doc exist or consider to create new one */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleStateManager = void 0;
class SimpleStateManager {
    constructor() {
        this.lastSnapshot = null;
    }
    getLastSnapshot() {
        return this.lastSnapshot;
    }
    getLastSelection() {
        return this.lastSnapshot?.selection || null;
    }
    setLastSnapshot(snapshot) {
        this.lastSnapshot = snapshot;
    }
}
exports.SimpleStateManager = SimpleStateManager;
//# sourceMappingURL=SimpleStateManager.js.map