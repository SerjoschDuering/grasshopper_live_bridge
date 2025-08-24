import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
    CallToolRequestSchema, 
    ListToolsRequestSchema,
    ListPromptsRequestSchema,
    GetPromptRequestSchema,
    ListResourcesRequestSchema,
    ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import * as vscode from 'vscode';
import { SimpleSocketClient } from '../shared/SimpleSocketClient';
import { SimpleStateManager } from '../shared/SimpleStateManager';
import { CanvasTools } from './tools/canvas.tools';
import { ScriptTools } from './tools/script.tools';
import { ProjectTools } from './tools/project.tools';
import { HelloTools } from './tools/hello.tools';
import { CanvasResources } from './resources/canvas.resources';
import { HelloResources } from './resources/hello.resources';
import { EventLogger } from './utils/EventLogger';
import { toolDefinitions } from './definitions/toolDefinitions';
import { promptDefinitions } from './definitions/promptDefinitions';
import { buildPromptMessage } from './prompts/grasshopper.prompts';
import { buildHelloPromptMessage } from './prompts/hello.prompts';

export class GhBridgeMcpServer {
    private server: Server;
    private canvasTools: CanvasTools;
    private scriptTools: ScriptTools;
    private projectTools: ProjectTools;
    private helloTools: HelloTools;
    private canvasResources: CanvasResources;
    private helloResources: HelloResources;
    private eventLogger: EventLogger;

    constructor(
        private context: vscode.ExtensionContext,
        private socketClient: SimpleSocketClient,
        private stateManager: SimpleStateManager,
        private outputChannel: vscode.OutputChannel
    ) {
        // Initialize event logger
        this.eventLogger = new EventLogger(outputChannel);
        
        // Initialize tool handlers
        this.canvasTools = new CanvasTools(socketClient, stateManager, this.eventLogger);
        this.scriptTools = new ScriptTools(socketClient, this.eventLogger);
        this.projectTools = new ProjectTools(this.eventLogger);
        this.helloTools = new HelloTools(outputChannel, this.eventLogger);
        this.canvasResources = new CanvasResources(stateManager);
        this.helloResources = new HelloResources();
        
        // Initialize MCP server
        this.server = new Server(
            {
                name: 'gh-bridge-mcp',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                    prompts: {},
                    resources: {},
                },
            }
        );

        this.setupHandlers();
    }

    private setupHandlers() {
        // Register tool listing handler
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: toolDefinitions,
        }));

        // Register prompt handlers
        this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
            prompts: promptDefinitions,
        }));

        this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const prompt = promptDefinitions.find(p => p.name === name);
            
            if (!prompt) {
                throw new Error(`Prompt ${name} not found`);
            }

            try {
                // Check if it's a hello prompt or regular prompt
                const isHelloPrompt = name.startsWith('explain-') || name === 'suggest-workflow';
                let userMessage: string;
                let contextData: any = {};
                
                if (isHelloPrompt) {
                    userMessage = buildHelloPromptMessage(name, args || {});
                    // Add extension info as context for hello prompts
                    contextData = {
                        extension: 'GH Bridge',
                        version: '0.1.0',
                        purpose: 'VS Code to Grasshopper bridge'
                    };
                } else {
                    // Get current canvas state to include as context
                    const canvasState = await this.canvasTools.getCanvasState({ includeSelection: true });
                    contextData = JSON.parse(canvasState.content[0].text);
                    userMessage = buildPromptMessage(name, args || {});
                }
                
                return {
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: `${userMessage}\n\nContext:\n${JSON.stringify(contextData, null, 2)}`
                            }
                        }
                    ]
                };
            } catch (error: any) {
                this.eventLogger.log('ERROR', undefined, undefined, `Prompt error: ${error.message}`);
                throw error;
            }
        });

        // Register resource handlers
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            const canvasResources = await this.canvasResources.listResources();
            const helloResources = await this.helloResources.listHelloResources();
            return { resources: [...helloResources, ...canvasResources] };
        });

        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            let contents: string;
            
            // Check if it's a hello resource
            if (uri.startsWith('hello://')) {
                contents = await this.helloResources.readHelloResource(uri);
            } else {
                contents = await this.canvasResources.readResource(uri);
            }
            
            return {
                contents: [
                    {
                        uri,
                        mimeType: uri.endsWith('.py') ? 'text/x-python' :
                                 uri.endsWith('.cs') ? 'text/x-csharp' :
                                 uri.endsWith('.vb') ? 'text/x-vb' :
                                 uri.endsWith('.md') ? 'text/markdown' :
                                 'application/json',
                        text: contents
                    }
                ]
            };
        });

        // Register tool execution handler
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    // Hello World tools for testing
                    case 'helloWorld':
                        return await this.helloTools.helloWorld(args);
                    case 'getRecentLogs':
                        return await this.helloTools.getRecentLogs(args);
                    case 'listProjectStructure':
                        return await this.helloTools.listProjectStructure(args);
                    
                    // Canvas tools
                    case 'getCanvasState':
                        return await this.canvasTools.getCanvasState(args);
                    case 'getSelection':
                        return await this.canvasTools.getSelection();
                    case 'openGraphViewer':
                        return await this.canvasTools.openGraphViewer(args);
                    case 'queryJson':
                        return await this.canvasTools.queryJson(args);
                    
                    // Script tools
                    case 'createScriptFile':
                        return await this.scriptTools.createScriptFile(args);
                    case 'pushScriptUpdate':
                        return await this.scriptTools.pushScriptUpdate(args);
                    case 'listScripts':
                        return await this.scriptTools.listScripts();
                    
                    // Project tools
                    case 'initProjectScaffold':
                        return await this.projectTools.initProjectScaffold();
                    case 'getChangeLog':
                        return await this.projectTools.getChangeLog(args);
                    case 'confirmLastUpdate':
                        return await this.projectTools.confirmLastUpdate(args);
                    
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error: any) {
                this.eventLogger.log('ERROR', undefined, undefined, error.message);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ ok: false, error: error.message }),
                        },
                    ],
                };
            }
        });
    }

    public async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.outputChannel.appendLine('[MCP] Server started on stdio transport');
    }

    public async stop() {
        await this.server.close();
        this.outputChannel.appendLine('[MCP] Server stopped');
    }
}