"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GhBridgeMcpServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const canvas_tools_1 = require("./tools/canvas.tools");
const script_tools_1 = require("./tools/script.tools");
const project_tools_1 = require("./tools/project.tools");
const hello_tools_1 = require("./tools/hello.tools");
const canvas_resources_1 = require("./resources/canvas.resources");
const hello_resources_1 = require("./resources/hello.resources");
const EventLogger_1 = require("./utils/EventLogger");
const toolDefinitions_1 = require("./definitions/toolDefinitions");
const promptDefinitions_1 = require("./definitions/promptDefinitions");
const grasshopper_prompts_1 = require("./prompts/grasshopper.prompts");
const hello_prompts_1 = require("./prompts/hello.prompts");
class GhBridgeMcpServer {
    constructor(context, socketClient, stateManager, outputChannel) {
        this.context = context;
        this.socketClient = socketClient;
        this.stateManager = stateManager;
        this.outputChannel = outputChannel;
        // Initialize event logger
        this.eventLogger = new EventLogger_1.EventLogger(outputChannel);
        // Initialize tool handlers
        this.canvasTools = new canvas_tools_1.CanvasTools(socketClient, stateManager, this.eventLogger);
        this.scriptTools = new script_tools_1.ScriptTools(socketClient, this.eventLogger);
        this.projectTools = new project_tools_1.ProjectTools(this.eventLogger);
        this.helloTools = new hello_tools_1.HelloTools(outputChannel, this.eventLogger);
        this.canvasResources = new canvas_resources_1.CanvasResources(stateManager);
        this.helloResources = new hello_resources_1.HelloResources();
        // Initialize MCP server
        this.server = new index_js_1.Server({
            name: 'gh-bridge-mcp',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
                prompts: {},
                resources: {},
            },
        });
        this.setupHandlers();
    }
    setupHandlers() {
        // Register tool listing handler
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: toolDefinitions_1.toolDefinitions,
        }));
        // Register prompt handlers
        this.server.setRequestHandler(types_js_1.ListPromptsRequestSchema, async () => ({
            prompts: promptDefinitions_1.promptDefinitions,
        }));
        this.server.setRequestHandler(types_js_1.GetPromptRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const prompt = promptDefinitions_1.promptDefinitions.find(p => p.name === name);
            if (!prompt) {
                throw new Error(`Prompt ${name} not found`);
            }
            try {
                // Check if it's a hello prompt or regular prompt
                const isHelloPrompt = name.startsWith('explain-') || name === 'suggest-workflow';
                let userMessage;
                let contextData = {};
                if (isHelloPrompt) {
                    userMessage = (0, hello_prompts_1.buildHelloPromptMessage)(name, args || {});
                    // Add extension info as context for hello prompts
                    contextData = {
                        extension: 'GH Bridge',
                        version: '0.1.0',
                        purpose: 'VS Code to Grasshopper bridge'
                    };
                }
                else {
                    // Get current canvas state to include as context
                    const canvasState = await this.canvasTools.getCanvasState({ includeSelection: true });
                    contextData = JSON.parse(canvasState.content[0].text);
                    userMessage = (0, grasshopper_prompts_1.buildPromptMessage)(name, args || {});
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
            }
            catch (error) {
                this.eventLogger.log('ERROR', undefined, undefined, `Prompt error: ${error.message}`);
                throw error;
            }
        });
        // Register resource handlers
        this.server.setRequestHandler(types_js_1.ListResourcesRequestSchema, async () => {
            const canvasResources = await this.canvasResources.listResources();
            const helloResources = await this.helloResources.listHelloResources();
            return { resources: [...helloResources, ...canvasResources] };
        });
        this.server.setRequestHandler(types_js_1.ReadResourceRequestSchema, async (request) => {
            const { uri } = request.params;
            let contents;
            // Check if it's a hello resource
            if (uri.startsWith('hello://')) {
                contents = await this.helloResources.readHelloResource(uri);
            }
            else {
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
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
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
            }
            catch (error) {
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
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        this.outputChannel.appendLine('[MCP] Server started on stdio transport');
    }
    async stop() {
        await this.server.close();
        this.outputChannel.appendLine('[MCP] Server stopped');
    }
}
exports.GhBridgeMcpServer = GhBridgeMcpServer;
//# sourceMappingURL=GhBridgeMcpServer.js.map