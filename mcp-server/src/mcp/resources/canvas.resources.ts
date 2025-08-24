import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { StateManager } from '@ghbridge/shared';

export interface McpResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export class CanvasResources {
    constructor(
        private stateManager: StateManager
    ) {}

    async listResources(): Promise<McpResource[]> {
        const resources: McpResource[] = [];
        
        // Add current canvas state as a resource
        const lastSnapshot = this.stateManager.getLastSnapshot();
        if (lastSnapshot) {
            resources.push({
                uri: 'canvas://current',
                name: 'Current Canvas State',
                description: 'The current Grasshopper canvas state',
                mimeType: 'application/json'
            });
        }

        // Add saved snapshots as resources
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            const config = vscode.workspace.getConfiguration('ghBridge');
            const snapshotDir = config.get<string>('snapshotDir', 'state');
            const snapshotPath = path.join(workspaceFolder.uri.fsPath, snapshotDir);
            
            if (fs.existsSync(snapshotPath)) {
                const files = fs.readdirSync(snapshotPath)
                    .filter(f => f.endsWith('.json'))
                    .sort()
                    .reverse()
                    .slice(0, 10); // Last 10 snapshots
                
                for (const file of files) {
                    resources.push({
                        uri: `canvas://snapshot/${file}`,
                        name: `Snapshot: ${file.replace('.json', '')}`,
                        description: `Canvas snapshot from ${this.formatSnapshotDate(file)}`,
                        mimeType: 'application/json'
                    });
                }
            }
        }

        // Add script files as resources
        if (workspaceFolder) {
            const config = vscode.workspace.getConfiguration('ghBridge');
            const scriptsDir = config.get<string>('scriptsDir', 'gh_scripts');
            const scriptsPath = path.join(workspaceFolder.uri.fsPath, scriptsDir);
            
            if (fs.existsSync(scriptsPath)) {
                const files = fs.readdirSync(scriptsPath)
                    .filter(f => f.match(/\.(py|cs|vb)$/));
                
                for (const file of files) {
                    const ext = path.extname(file).slice(1);
                    const mimeType = ext === 'py' ? 'text/x-python' : 
                                    ext === 'cs' ? 'text/x-csharp' : 'text/x-vb';
                    
                    resources.push({
                        uri: `script://${file}`,
                        name: `Script: ${file}`,
                        description: `Grasshopper ${ext.toUpperCase()} script`,
                        mimeType
                    });
                }
            }
        }

        return resources;
    }

    async readResource(uri: string): Promise<string> {
        if (uri === 'canvas://current') {
            const snapshot = this.stateManager.getLastSnapshot();
            return JSON.stringify(snapshot, null, 2);
        }
        
        if (uri.startsWith('canvas://snapshot/')) {
            const filename = uri.replace('canvas://snapshot/', '');
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const config = vscode.workspace.getConfiguration('ghBridge');
                const snapshotDir = config.get<string>('snapshotDir', 'state');
                const filePath = path.join(workspaceFolder.uri.fsPath, snapshotDir, filename);
                
                if (fs.existsSync(filePath)) {
                    return fs.readFileSync(filePath, 'utf8');
                }
            }
        }
        
        if (uri.startsWith('script://')) {
            const filename = uri.replace('script://', '');
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const config = vscode.workspace.getConfiguration('ghBridge');
                const scriptsDir = config.get<string>('scriptsDir', 'gh_scripts');
                const filePath = path.join(workspaceFolder.uri.fsPath, scriptsDir, filename);
                
                if (fs.existsSync(filePath)) {
                    return fs.readFileSync(filePath, 'utf8');
                }
            }
        }
        
        throw new Error(`Resource not found: ${uri}`);
    }

    private formatSnapshotDate(filename: string): string {
        // Parse filename like 20250824_101112.json
        const match = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
        if (match) {
            const [, year, month, day, hour, minute, second] = match;
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }
        return filename;
    }
}