/** Docs: TODO: check if suitable doc exist or consider to create new one */

export interface CanvasSnapshot {
  canvas: any;
  selection?: any;
  meta?: any;
}

export class SimpleStateManager {
  private lastSnapshot: CanvasSnapshot | null = null;

  getLastSnapshot(): CanvasSnapshot | null {
    return this.lastSnapshot;
  }

  getLastSelection(): any {
    return this.lastSnapshot?.selection || null;
  }

  setLastSnapshot(snapshot: CanvasSnapshot): void {
    this.lastSnapshot = snapshot;
  }
}