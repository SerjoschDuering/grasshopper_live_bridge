import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { EventLogger } from '../utils/EventLogger';

export class ProjectTools {
    constructor(
        private eventLogger: EventLogger
    ) {}

    async initProjectScaffold() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder open');
        }

        const config = vscode.workspace.getConfiguration('ghBridge');
        const scriptsDir = config.get<string>('scriptsDir', 'gh_scripts');
        const snapshotDir = config.get<string>('snapshotDir', 'state');

        const created: string[] = [];
        const dirs = [scriptsDir, snapshotDir, 'media', 'configs'];

        for (const dir of dirs) {
            const dirPath = path.join(workspaceFolder.uri.fsPath, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                created.push(dir);
                this.eventLogger.log('FS_CHANGE', undefined, undefined, `Created directory: ${dir}`);
            }
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ created }),
                },
            ],
        };
    }

    async getChangeLog(args: any) {
        const { sinceMs, componentUuid, kinds } = args;
        const events = this.eventLogger.getEvents(sinceMs, componentUuid, kinds);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ events }),
                },
            ],
        };
    }

    async confirmLastUpdate(args: any) {
        const { componentUuid, sha256 } = args;
        
        // Find last APPLIED event for this component
        const events = this.eventLogger.getEvents(60000, componentUuid, ['APPLIED']);
        const lastApplied = events.sort((a, b) => b.tsClient - a.tsClient)[0];

        if (!lastApplied) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ ok: false }),
                    },
                ],
            };
        }

        const ok = !sha256 || lastApplied.sha256 === sha256;

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        ok,
                        appliedAt: new Date(lastApplied.tsClient).toISOString(),
                        warnings: [],
                    }),
                },
            ],
        };
    }
}