import * as vscode from 'vscode';
import { MockSocketClient, StateManager } from '@ghbridge/shared';
import { EventLogger } from '../utils/EventLogger';

export class CanvasTools {
    constructor(
        private socketClient: MockSocketClient,
        private stateManager: StateManager,
        private eventLogger: EventLogger
    ) {}

    async getCanvasState(args: any) {
        const includeSelection = args?.includeSelection || false;
        
        // For now, use mock data since we're in mock mode
        const mockCanvas = this.stateManager.getLastSnapshot();
        
        if (!mockCanvas) {
            // Fetch fresh canvas state
            const canvasData = await this.socketClient.fetchCanvas();
            await this.stateManager.setLastSnapshot(canvasData, false);
            const canvas = this.stateManager.getLastSnapshot();
            
            this.eventLogger.log('CANVAS_UPDATED', undefined, undefined, 'Canvas fetched via MCP');
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            canvas,
                            selection: includeSelection ? this.stateManager.getLastSelection() : undefined,
                            meta: {
                                ghVersion: 'mock-1.0',
                                generatedAt: new Date().toISOString(),
                            },
                        }),
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        canvas: mockCanvas,
                        selection: includeSelection ? this.stateManager.getLastSelection() : undefined,
                        meta: {
                            ghVersion: 'mock-1.0',
                            generatedAt: new Date().toISOString(),
                        },
                    }),
                },
            ],
        };
    }

    async getSelection() {
        const selection = this.stateManager.getLastSelection();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ selection }),
                },
            ],
        };
    }

    async openGraphViewer(args: any) {
        // This would trigger the Graph Viewer webview
        await vscode.commands.executeCommand('ghBridge.openGraphViewer');
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ opened: true }),
                },
            ],
        };
    }

    async queryJson(args: any) {
        const { source, filePath, query } = args;
        
        let data: any;
        if (source === 'lastCanvas') {
            data = this.stateManager.getLastSnapshot();
        } else if (source === 'file' && filePath) {
            const fs = await import('fs');
            const content = fs.readFileSync(filePath, 'utf8');
            data = JSON.parse(content);
        } else {
            throw new Error('Invalid source or missing filePath');
        }

        // Simple JSONPath-like query (very basic implementation)
        // In production, use a proper JSONPath library
        const result = this.simpleQuery(data, query);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ result }),
                },
            ],
        };
    }

    private simpleQuery(data: any, query: string): any {
        // Very basic dot notation query
        // For production, use a proper JSONPath library
        const parts = query.split('.');
        let result = data;
        
        for (const part of parts) {
            if (result && typeof result === 'object') {
                result = result[part];
            } else {
                return undefined;
            }
        }
        
        return result;
    }
}