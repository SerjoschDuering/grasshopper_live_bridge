"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolDefinitions = void 0;
exports.toolDefinitions = [
    // Hello World Tools for Testing
    {
        name: 'helloWorld',
        description: 'Simple hello world test tool',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Name to greet',
                },
            },
        },
    },
    {
        name: 'getRecentLogs',
        description: 'Get recent logs from the GH Bridge extension',
        inputSchema: {
            type: 'object',
            properties: {
                lineCount: {
                    type: 'number',
                    description: 'Number of log lines to retrieve',
                },
            },
        },
    },
    {
        name: 'listProjectStructure',
        description: 'List the project directory structure',
        inputSchema: {
            type: 'object',
            properties: {
                maxDepth: {
                    type: 'number',
                    description: 'Maximum depth to traverse (default: 2)',
                },
                includeHidden: {
                    type: 'boolean',
                    description: 'Include hidden files and folders',
                },
            },
        },
    },
    // Original Tools
    {
        name: 'getCanvasState',
        description: 'Fetch current Grasshopper canvas state',
        inputSchema: {
            type: 'object',
            properties: {
                includeSelection: {
                    type: 'boolean',
                    description: 'Include current selection in response',
                },
            },
        },
    },
    {
        name: 'getSelection',
        description: 'Get current Grasshopper selection',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'createScriptFile',
        description: 'Create a new script file for a Grasshopper component',
        inputSchema: {
            type: 'object',
            properties: {
                componentUuid: {
                    type: 'string',
                    description: 'UUID of the Grasshopper component',
                },
                language: {
                    type: 'string',
                    enum: ['python', 'cs', 'vb'],
                    description: 'Script language',
                },
                nameHint: {
                    type: 'string',
                    description: 'Optional name hint for the file',
                },
            },
            required: ['componentUuid', 'language'],
        },
    },
    {
        name: 'pushScriptUpdate',
        description: 'Push a script update to Grasshopper',
        inputSchema: {
            type: 'object',
            properties: {
                componentUuid: {
                    type: 'string',
                    description: 'UUID of the Grasshopper component',
                },
                filePath: {
                    type: 'string',
                    description: 'Path to the script file',
                },
                language: {
                    type: 'string',
                    enum: ['python', 'cs', 'vb'],
                    description: 'Script language',
                },
            },
            required: ['componentUuid', 'filePath'],
        },
    },
    {
        name: 'getChangeLog',
        description: 'Get recent events from the change log',
        inputSchema: {
            type: 'object',
            properties: {
                sinceMs: {
                    type: 'number',
                    description: 'Get events since this many milliseconds ago',
                },
                componentUuid: {
                    type: 'string',
                    description: 'Filter by component UUID',
                },
                kinds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Filter by event kinds',
                },
            },
            required: ['sinceMs'],
        },
    },
    {
        name: 'confirmLastUpdate',
        description: 'Confirm the last update for a component',
        inputSchema: {
            type: 'object',
            properties: {
                componentUuid: {
                    type: 'string',
                    description: 'UUID of the component',
                },
                sha256: {
                    type: 'string',
                    description: 'Optional SHA256 to verify',
                },
            },
            required: ['componentUuid'],
        },
    },
    {
        name: 'queryJson',
        description: 'Query JSON data from canvas or file',
        inputSchema: {
            type: 'object',
            properties: {
                source: {
                    type: 'string',
                    enum: ['lastCanvas', 'file'],
                    description: 'Source of JSON data',
                },
                filePath: {
                    type: 'string',
                    description: 'File path if source is file',
                },
                query: {
                    type: 'string',
                    description: 'JSON query expression',
                },
            },
            required: ['source', 'query'],
        },
    },
    {
        name: 'initProjectScaffold',
        description: 'Initialize project folder structure',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'listScripts',
        description: 'List all script files in the project',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'openGraphViewer',
        description: 'Open the graph viewer webview',
        inputSchema: {
            type: 'object',
            properties: {
                snapshotPath: {
                    type: 'string',
                    description: 'Optional path to specific snapshot',
                },
            },
        },
    },
];
//# sourceMappingURL=toolDefinitions.js.map