> Rule: Every new or modified code file must include a top-of-file (or post-imports) comment that points to the related feature documentation file (`feature_*.md`). For example: /** Docs: ../../../../claude_docs/feature_vscode_extension_claude.md */
> If no suitable doc exists, include this exact line: "TODO: check if suitable doc exist or consider to create new one".
> 
> Search tip: Find related code by searching for Docs comments that reference `feature_vscode_extension_claude.md` (e.g., `Docs: .*feature_vscode_extension_claude.md`).

# VSCode Extension Feature Documentation

## Overview
The VSCode Extension (`/vscode-extension/`) provides a live coding interface for Grasshopper with file watching, canvas visualization, and activity bar integration. It operates independently from the MCP server while optionally coordinating through shared state management.

## Architecture

### Position in System
```
VSCode Extension ←→ File System (gh_scripts/) ←→ File Watchers
       ↓                                              ↓
WebSocket Client ←→ Grasshopper Server (port 8181) ←→ Script Updates
       ↑
Activity Bar Views + GraphViewer Webview
```

### Key Design Decisions
- **File-Driven Workflow**: Primary interaction through file system changes
- **Independent Operation**: Can run without MCP server, but coordinates when both present
- **Rich UI**: Activity bar views, webviews, and status bar integration
- **Real-time Sync**: File changes automatically pushed to Grasshopper

## Core Capabilities

### File Watching (`FileWatchers.ts`)
- Monitors `gh_scripts/**/*.{py,cs}` for changes
- Debounced updates to prevent spam
- UUID extraction from filename or header comment
- Automatic `scriptUpdated` WebSocket calls

### Canvas Visualization (`GraphViewer.ts`)
- Webview-based canvas inspector
- JSON tree view with search and filtering
- Real-time updates when canvas changes
- Counts and metadata display

### Activity Bar Views
- **Controls View** (`ControlView.ts`): Connect/disconnect, fetch canvas, open viewer
- **Event Log View** (`EventLogView.ts`): Recent WebSocket events and file changes  
- **Debug View** (`DebugView.ts`): Connection status and diagnostics

### Status Bar Integration
- Connection status indicator (green/gray)
- Click to toggle connection
- Displays current WebSocket state

## File Structure

```
vscode-extension/
├── src/
│   ├── extension.ts                      # Main extension entry point
│   ├── view/
│   │   ├── ControlView.ts               # Activity bar control panel
│   │   ├── EventLogView.ts              # Event history view
│   │   ├── GraphViewer.ts               # Canvas webview
│   │   └── DebugView.ts                 # Debug information view
│   └── watchers/
│       └── FileWatchers.ts              # File system monitoring
├── resources/
│   └── gh.svg                           # Extension icon
├── package.json                         # Extension manifest
└── tsconfig.json
```

## Key Implementation Details

### Extension Lifecycle (`extension.ts`)
- Activates on workspace with Grasshopper files
- Creates output channel, status bar, and activity views
- Initializes WebSocket client and state manager
- Sets up file watchers and command handlers

### State Management Integration
- Uses shared `@ghbridge/shared` StateManager
- Maintains canvas snapshots in `/state/` directory
- Coordinates with MCP server when both running
- In-memory event log with 5000 event limit

### WebSocket Communication
- Direct connection to `ws://localhost:8181/live`
- Promise-based request/response pattern
- Event handling for canvas updates and diagnostics
- Configurable host/port through VS Code settings

### File System Integration
- Watches for file changes with debouncing
- UUID extraction: header > filename regex > error
- Creates `/gh_scripts/` directory structure
- Automatic script synchronization on save

## User Workflows

### Basic Setup
1. Open workspace with Grasshopper project
2. Extension auto-activates and shows in Activity Bar
3. Use "Connect" in Controls view to establish WebSocket connection
4. Status bar shows connection state

### Script Development
1. Create/edit Python files in `gh_scripts/` directory
2. Include `GH-Component-UUID: <uuid>` header or use filename pattern
3. Save file triggers automatic sync to Grasshopper
4. View results in Grasshopper, inspect canvas in GraphViewer

### Canvas Inspection
1. Use "Fetch Canvas" in Controls view 
2. GraphViewer webview opens with JSON tree
3. Search/filter canvas components
4. Real-time updates when canvas changes in Grasshopper

## Development Workflow

### Building and Running
```bash
cd vscode-extension
npm install
npm run compile
```

### Development Mode
```bash
npm run watch        # Watch TypeScript compilation
# Press F5 in VS Code to launch Extension Development Host
```

### Testing
1. Open sample workspace with `gh_scripts/` directory
2. Start Grasshopper with LiveCoding component
3. Test file watching, WebSocket communication, and UI

### Debugging
- Use VS Code debugger (F5) for extension development
- Check "GH Bridge" output channel for logs
- Verify file watcher events in Event Log view
- Status bar indicates WebSocket connection state

## Configuration Options

Extension contributes these VS Code settings:
- `ghBridge.host`: WebSocket server host (default: 127.0.0.1)
- `ghBridge.port`: WebSocket server port (default: 8181)  
- `ghBridge.watchGlobs`: File patterns to watch
- `ghBridge.debounceMs`: File change debounce timeout
- `ghBridge.maxPayloadMb`: Maximum WebSocket message size

## Integration Points

### With MCP Server
- Shared StateManager for consistent canvas state
- Event coordination through EventLog
- Optional MCP server spawning and management

### With Grasshopper Component  
- Direct WebSocket communication
- Script update commands with UUID mapping
- Canvas state fetching and event subscription

### With File System
- File watching and automatic synchronization
- Project scaffolding and directory structure
- Script file creation with proper UUID headers