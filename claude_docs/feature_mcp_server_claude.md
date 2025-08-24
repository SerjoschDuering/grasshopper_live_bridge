> Rule: Every new or modified code file must include a top-of-file (or post-imports) comment that points to the related feature documentation file (`feature_*.md`). For example: /** Docs: ../../../../claude_docs/feature_mcp_server_claude.md */
> If no suitable doc exists, include this exact line: "TODO: check if suitable doc exist or consider to create new one".
> 
> Search tip: Find related code by searching for Docs comments that reference `feature_mcp_server_claude.md` (e.g., `Docs: .*feature_mcp_server_claude.md`).

# MCP Server Feature Documentation

## Overview
The MCP Server (`/mcp-server/`) acts as a bridge between AI agents (like Claude) and the Grasshopper WebSocket server. It runs as a standalone TypeScript process that can handle both Model Context Protocol (MCP) requests and standard HTTP/WebSocket requests.

## Architecture

### Position in System
```
AI Agent (Claude) ←→ MCP Server ←→ Grasshopper WebSocket Server (port 8181)
                         ↕
                  VSCode Extension (optional communication)
```

### Key Design Decisions
- **Separate Process**: Runs independently from VSCode extension for better isolation and flexibility
- **Dual Protocol**: Supports both MCP protocol (for AI agents) and HTTP/WebSocket (for other clients)  
- **Closer to Grasshopper**: Positioned closer to the Rhino/Grasshopper socket server for better performance
- **Stateless Tools**: Most tools are stateless, relying on Grasshopper as source of truth

## Core Capabilities

### MCP Tools Available
- **Canvas Tools** (`canvas.tools.ts`): `getCanvasState`, `getSelection`
- **Script Tools** (`script.tools.ts`): `createScriptFile`, `pushScriptUpdate`, `listScripts`  
- **Project Tools** (`project.tools.ts`): `initProjectScaffold`
- **Hello Tools** (`hello.tools.ts`): Basic connection testing

### MCP Resources
- **Canvas Resources** (`canvas.resources.ts`): Provides canvas state as queryable resource
- **Hello Resources** (`hello.resources.ts`): Basic server information

### MCP Prompts  
- **Grasshopper Prompts** (`grasshopper.prompts.ts`): AI prompts for Grasshopper-specific tasks
- **Hello Prompts** (`hello.prompts.ts`): Basic interaction prompts

## File Structure

```
mcp-server/
├── src/
│   ├── mcp/
│   │   ├── GhBridgeMcpServer.ts          # Main MCP server class
│   │   ├── mcpStandalone.ts              # Standalone entry point
│   │   ├── tools/                        # MCP tool implementations
│   │   ├── resources/                    # MCP resource providers
│   │   ├── prompts/                      # MCP prompt definitions
│   │   ├── definitions/                  # Tool and prompt catalogs
│   │   └── utils/                        # Shared utilities
│   └── server/
│       └── HttpServer.ts                 # Optional HTTP server
├── package.json
└── tsconfig.json
```

## Communication Protocols

### MCP Protocol (Primary)
- **Transport**: stdio (for Claude integration)
- **Functions**: Tool calling, resource reading, prompt generation
- **Client**: AI agents like Claude Code

### WebSocket Protocol (with Grasshopper)
- **Endpoint**: `ws://localhost:8181/live`
- **Format**: JSON messages with `action`, `correlationId`, `data`
- **Commands**: `ping`, `getCanvasState`, `getSelection`, `scriptUpdated`

## Key Implementation Details

### StateManager Integration
- Uses shared `@ghbridge/shared` package for state management
- Maintains in-memory canvas state and snapshots
- Coordinates with VSCode extension state when both are running

### MockSocketClient
- Abstracts WebSocket communication with Grasshopper
- Handles connection management, timeouts, and retries
- Provides Promise-based API for request/response patterns

### Event Logging
- Tracks all MCP tool calls and WebSocket interactions  
- Provides changelog functionality for debugging
- Integrates with VSCode extension event system

## Usage Patterns

### For AI Agents (Claude)
1. Agent calls MCP tool (e.g., `getCanvasState`)
2. MCP server forwards request to Grasshopper WebSocket
3. Response processed and returned to agent via MCP protocol

### For VSCode Extension
1. Extension can optionally communicate with MCP server
2. Shared state management ensures consistency
3. Independent operation when MCP server not running

### For Direct HTTP Clients
1. Optional HTTP server provides REST-like endpoints
2. Same underlying tools available via HTTP
3. Useful for testing and external integrations

## Development Workflow

### Building and Running
```bash
cd mcp-server
npm install
npm run compile
npm start        # Run with stdio transport
```

### Testing with Claude
1. Configure Claude to use the MCP server
2. Use MCP tools in Claude conversations
3. Verify WebSocket communication with Grasshopper

### Debugging
- Use `npm run watch` for development
- Check console output for WebSocket communication
- Verify Grasshopper component is running on port 8181