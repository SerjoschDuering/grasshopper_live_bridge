import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class HelloResources {
    async listHelloResources() {
        const resources = [
            {
                uri: 'hello://readme',
                name: 'Extension README',
                description: 'The README file for GH Bridge extension',
                mimeType: 'text/markdown'
            },
            {
                uri: 'hello://config',
                name: 'Extension Configuration',
                description: 'Current extension configuration settings',
                mimeType: 'application/json'
            },
            {
                uri: 'hello://status',
                name: 'Extension Status',
                description: 'Current status and statistics of the extension',
                mimeType: 'application/json'
            },
            {
                uri: 'hello://package',
                name: 'Package.json',
                description: 'Extension manifest and dependencies',
                mimeType: 'application/json'
            }
        ];

        return resources;
    }

    async readHelloResource(uri: string): Promise<string> {
        if (uri === 'hello://readme') {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const readmePath = path.join(workspaceFolder.uri.fsPath, 'README.md');
                if (fs.existsSync(readmePath)) {
                    return fs.readFileSync(readmePath, 'utf8');
                }
            }
            return '# GH Bridge Extension\n\nBridging VS Code and Grasshopper for seamless visual programming.';
        }
        
        if (uri === 'hello://config') {
            const config = vscode.workspace.getConfiguration('ghBridge');
            return JSON.stringify({
                host: config.get('host'),
                port: config.get('port'),
                transport: config.get('transport'),
                persistSnapshots: config.get('persistSnapshots'),
                snapshotDir: config.get('snapshotDir'),
                scriptsDir: config.get('scriptsDir'),
                logVerbosity: config.get('logVerbosity')
            }, null, 2);
        }
        
        if (uri === 'hello://status') {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            let scriptCount = 0;
            let snapshotCount = 0;
            
            if (workspaceFolder) {
                const config = vscode.workspace.getConfiguration('ghBridge');
                const scriptsDir = config.get<string>('scriptsDir', 'gh_scripts');
                const snapshotDir = config.get<string>('snapshotDir', 'state');
                
                const scriptsPath = path.join(workspaceFolder.uri.fsPath, scriptsDir);
                const snapshotPath = path.join(workspaceFolder.uri.fsPath, snapshotDir);
                
                if (fs.existsSync(scriptsPath)) {
                    scriptCount = fs.readdirSync(scriptsPath).filter(f => f.match(/\.(py|cs|vb)$/)).length;
                }
                
                if (fs.existsSync(snapshotPath)) {
                    snapshotCount = fs.readdirSync(snapshotPath).filter(f => f.endsWith('.json')).length;
                }
            }
            
            return JSON.stringify({
                extensionName: 'GH Bridge',
                version: '0.1.0',
                status: 'active',
                workspace: workspaceFolder?.name || 'No workspace',
                statistics: {
                    scripts: scriptCount,
                    snapshots: snapshotCount,
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString()
                }
            }, null, 2);
        }
        
        if (uri === 'hello://package') {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const packagePath = path.join(workspaceFolder.uri.fsPath, 'package.json');
                if (fs.existsSync(packagePath)) {
                    return fs.readFileSync(packagePath, 'utf8');
                }
            }
            return JSON.stringify({ error: 'package.json not found' }, null, 2);
        }
        
        throw new Error(`Unknown hello resource: ${uri}`);
    }
}