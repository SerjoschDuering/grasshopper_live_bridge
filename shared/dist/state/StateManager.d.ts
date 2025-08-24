import * as vscode from 'vscode';
export interface CanvasSnapshot {
    canvas: any;
    selection?: any;
    meta?: any;
}
export declare class StateManager {
    private lastSnapshot;
    private context;
    constructor(context: vscode.ExtensionContext);
    getLastSnapshot(): CanvasSnapshot | null;
    getLastSelection(): any;
    setLastSnapshot(snapshot: CanvasSnapshot, persist: boolean): Promise<vscode.Uri | null>;
    private generateSnapshotFilename;
}
