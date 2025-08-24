# Grasshopper Live Bridge 🚀

A three-tier system for live coding and AI-driven design in Grasshopper.

## Components

1. **Grasshopper Component** (`/grasshopper_component/LiveCodingGH/`) - WebSocket server running in GH on port 8181
2. **MCP Server** (`/mcp-server/`) - AI orchestration layer that connects to Grasshopper WebSocket server
3. **VSCode Extension** (`/vscode-extension/`) - Live Python editing interface with file watchers and canvas visualization
4. **Test Scripts** (`/scripts/`) - WebSocket client for testing connections and commands

## Architecture

The system operates with separate, independent components:

- **Grasshopper Component** hosts a WebSocket server at `ws://localhost:8181/live`
- **MCP Server** acts as a bridge between AI agents (like Claude) and the Grasshopper WebSocket server
- **VSCode Extension** provides file watching, canvas visualization, and direct communication with both the MCP server and Grasshopper
- **Test Scripts** allow direct testing of WebSocket commands

## Quick Start

1. Build and install the Grasshopper component: `cd grasshopper_component/LiveCodingGH && dotnet build`
2. Set up MCP server: `cd mcp-server && npm install && npm run compile`
3. Set up VSCode extension: `cd vscode-extension && npm install && npm run compile`
4. Test WebSocket connection: `npm install && node scripts/test_connection.js ping`

See individual component READMEs and CLAUDE.md for detailed instructions.