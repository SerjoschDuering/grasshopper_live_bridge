import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { EventLogger } from '../utils/EventLogger';

export class HelloTools {
    constructor(
        private outputChannel: vscode.OutputChannel,
        private eventLogger: EventLogger
    ) {}

    async getRecentLogs(args: any) {
        const lineCount = args?.lineCount || 20;
        
        // Get recent log entries from our event logger
        const recentEvents = this.eventLogger.getEvents(60000); // Last minute
        
        // Also get output channel text if possible
        const logs = recentEvents.map(e => 
            `[${new Date(e.tsClient).toISOString()}] ${e.kind}: ${e.summary || ''}`
        ).slice(-lineCount);

        this.eventLogger.log('HELLO_WORLD', undefined, undefined, `Retrieved ${logs.length} recent logs`);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        logs,
                        count: logs.length,
                        message: 'Recent logs from GH Bridge extension'
                    }, null, 2)
                }
            ]
        };
    }

    async listProjectStructure(args: any) {
        const maxDepth = args?.maxDepth || 2;
        const includeHidden = args?.includeHidden || false;
        
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        const rootPath = workspaceFolder.uri.fsPath;
        const tree = this.buildDirectoryTree(rootPath, maxDepth, 0, includeHidden);
        
        this.eventLogger.log('HELLO_WORLD', undefined, undefined, 'Listed project structure');

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        root: workspaceFolder.name,
                        path: rootPath,
                        structure: tree,
                        message: `Project structure (${maxDepth} levels deep)`
                    }, null, 2)
                }
            ]
        };
    }

    async helloWorld(args: any) {
        const name = args?.name || 'World';
        const timestamp = new Date().toISOString();
        
        // Log to VS Code output
        this.outputChannel.appendLine(`[MCP Hello] Hello, ${name}! Called at ${timestamp}`);
        
        // Log to event logger
        this.eventLogger.log('HELLO_WORLD', undefined, undefined, `Greeted ${name}`);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        message: `Hello, ${name}!`,
                        timestamp,
                        extension: 'GH Bridge',
                        version: '0.1.0'
                    }, null, 2)
                }
            ]
        };
    }

    private buildDirectoryTree(dirPath: string, maxDepth: number, currentDepth: number, includeHidden: boolean): any {
        if (currentDepth >= maxDepth) {
            return { type: 'truncated', message: 'max depth reached' };
        }

        const result: any = {};
        
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                // Skip hidden files unless requested
                if (!includeHidden && entry.name.startsWith('.')) {
                    continue;
                }
                
                // Skip node_modules and other large directories
                if (entry.name === 'node_modules' || entry.name === 'out' || entry.name === '.git') {
                    result[entry.name] = { type: 'skipped' };
                    continue;
                }

                if (entry.isDirectory()) {
                    const subPath = path.join(dirPath, entry.name);
                    result[entry.name + '/'] = this.buildDirectoryTree(subPath, maxDepth, currentDepth + 1, includeHidden);
                } else {
                    const ext = path.extname(entry.name);
                    const stats = fs.statSync(path.join(dirPath, entry.name));
                    result[entry.name] = {
                        type: 'file',
                        size: stats.size,
                        ext: ext || 'none'
                    };
                }
            }
        } catch (error) {
            return { type: 'error', message: String(error) };
        }

        return result;
    }
}