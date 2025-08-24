# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a three-tier system for live coding and AI-driven design in Grasshopper 3D. The system enables real-time Python code editing and execution within Grasshopper through a WebSocket bridge, with separate MCP server and VSCode extension components.

## Architecture

### Core Components

1. **Grasshopper Component** (`/grasshopper_component/LiveCodingGH/`)
   - C# WebSocket server running inside Grasshopper on port 8181
   - Processes commands to create/update Python scripts and UI components
   - Uses reflection to support multiple GHPython versions
   - Main file: `LiveCodingComponent.cs`

2. **MCP Server** (`/mcp-server/`)
   - TypeScript-based MCP server that bridges AI agents to Grasshopper WebSocket server
   - Provides canvas inspection, script management, and project scaffolding tools
   - Runs as standalone process, closer to Rhino/Grasshopper socket server
   - Can handle both MCP protocol requests and HTTP/WebSocket requests

3. **VSCode Extension** (`/vscode-extension/`)
   - TypeScript extension with file watchers, canvas visualization, and activity bar views
   - Provides GraphViewer webview for canvas inspection
   - File watching for automatic script updates to Grasshopper
   - Can communicate with both MCP server and Grasshopper directly

4. **WebSocket Test Client** (`/scripts/test_connection.js`)
   - Node.js script for testing WebSocket commands
   - Supports ping, create_python_script, create_slider, update_script commands

## Development Commands

### Building the Grasshopper Component
```bash
# Build the C# component (requires .NET Framework 4.8 and Rhino 8 SDK)
cd grasshopper_component/LiveCodingGH
dotnet build

# The build automatically creates a .gha file in the output directory
```

### Building and Running MCP Server
```bash
cd mcp-server

# Install dependencies and compile TypeScript
npm install
npm run compile

# Run MCP server (stdio transport for Claude)
npm start

# Watch mode for development
npm run watch
```

### Building and Running VSCode Extension
```bash
cd vscode-extension

# Install dependencies and compile TypeScript
npm install
npm run compile

# Watch mode for development
npm run watch

# Install extension for development (F5 in VS Code)
```

### Testing WebSocket Connection
```bash
# Install root dependencies for test scripts
npm install

# Test connection to Grasshopper
node scripts/test_connection.js ping

# Create a Python component with test script
node scripts/test_connection.js create_python_script scripts/testing/test_script.py

# Create a slider component
node scripts/test_connection.js create_slider

# Update existing Python component (requires GUID)
node scripts/test_connection.js update_script <COMPONENT_GUID> <path-to-py-file>

# Keep connection open longer (default 800ms)
node scripts/test_connection.js ping --wait=10000
```

## WebSocket Protocol

The WebSocket server at `ws://localhost:8181/live` accepts JSON messages with this structure:
```json
{
  "action": "command_name",
  "correlationId": "unique_id",
  "payload": { /* command-specific data */ }
}
```

Supported actions:
- `ping`: Test connection
- `create_python_script`: Create new Python component with code
- `create_slider`: Create number slider
- `update_script`: Update existing Python component by GUID

## Key Implementation Details

### Grasshopper Component
- The component uses WebSocketSharp for server implementation
- Commands are queued and processed every 100ms via timer
- Python components are created through reflection to handle different GHPython plugin versions
- If GHPython is not available, creates an instruction panel instead

### Cross-Platform Considerations
- The C# component references are Windows-specific (Rhino 8 paths)
- WebSocket communication allows platform-independent clients
- Node.js scripts work cross-platform

## Component Communication

### Architecture Flow
```
AI Agent (Claude) ←→ MCP Server ←→ Grasshopper WebSocket Server
                         ↕
VSCode Extension ←→ File System ←→ Grasshopper WebSocket Server
```

### MCP Server Features
- Canvas state inspection and querying
- Script file creation and management  
- Project scaffolding with UUID mapping
- Event logging and changelog tracking
- Resource and prompt definitions for AI agents

### VSCode Extension Features  
- File watchers for automatic script synchronization
- Canvas visualization through GraphViewer webview
- Activity bar views (Controls, Event Log, Debug)
- Direct WebSocket communication with Grasshopper
- Integration with MCP server for enhanced AI capabilities

## Dependencies

- **C# Component**: WebSocketSharp-netstandard 1.0.1, Newtonsoft.Json 13.0.3, Rhino 8 SDK
- **MCP Server**: @modelcontextprotocol/sdk 1.17.4, TypeScript 5.9.2
- **VSCode Extension**: VS Code API 1.103.0, TypeScript 5.9.2
- **Node.js Scripts**: ws 8.18.3
- **Runtime**: GHPython plugin in Grasshopper (for Python execution)

## Documentation Rules

### Feature Documentation
Big features must be documented in separate files in the `/claude_docs/` folder, named `feature_<name>_claude.md`.

Every `feature_*.md` file must include this comment at the top:
```
> Rule: Every new or modified code file must include a top-of-file (or post-imports) comment that points to the related feature documentation file (`feature_*.md`). For example: /** Docs: ../../../../feature_kpi_cards_claude.md */
> If no suitable doc exists, include this exact line: "TODO: check if suitable doc exist or consider to create new one".
> 
> Search tip: Find related code by searching for Docs comments that reference `feature_headline_kpi_card_claude.md` (e.g., `Docs: .*feature_headline_kpi_card_claude.md`).
```

### Code File Requirements
All code files must include a documentation reference comment at the top (or after imports):
- If related feature doc exists: `/** Docs: path/to/feature_name_claude.md */`
- If no suitable doc exists: `TODO: check if suitable doc exist or consider to create new one`

This pattern allows finding all files related to a particular feature by searching for the Docs comment references.