# MCP Server Architecture & VSCode Plugin Integration

## Executive Summary

The MCP (Model Context Protocol) Server acts as a bridge between AI agents (like Claude) and the Grasshopper WebSocket server, providing structured access to canvas inspection, script management, and project scaffolding capabilities. This document outlines the proposed architecture for a standalone MCP server and its integration points with the VSCode extension.

## System Architecture Overview

```
AI Agent (Claude) ←→ MCP Server ←→ Grasshopper WebSocket Server (port 8181)
                         ↕
                  VSCode Extension ←→ File System ←→ Grasshopper WebSocket Server
```

## Current State Analysis

### Existing Implementation Issues
- Heavy VSCode dependencies throughout all modules (`vscode` imports in core logic)
- Complex dependency chain with `@ghbridge/shared` package
- Mixed concerns (VSCode extension logic embedded in MCP server)
- Compilation errors due to missing dependencies
- Tight coupling preventing standalone deployment

### Existing Tool Catalog
The current MCP server defines 14 tools across 4 categories:

**Testing Tools:**
- `helloWorld`: Basic connection test with name parameter
- `getRecentLogs`: Retrieve recent log entries (20 lines default)
- `listProjectStructure`: Directory tree with depth control

**Canvas Tools:**
- `getCanvasState`: Fetch canvas JSON with optional selection
- `getSelection`: Get current Grasshopper selection
- `queryJson`: Query canvas/file JSON with expressions

**Script Management:**
- `createScriptFile`: Create script files with UUID mapping
- `pushScriptUpdate`: Send script updates to Grasshopper
- `listScripts`: Enumerate project script files
- `confirmLastUpdate`: Verify script update status

**Project Tools:**
- `getChangeLog`: Event history with time filtering
- `initProjectScaffold`: Create project folder structure
- `openGraphViewer`: Launch canvas visualization (VSCode-specific)

## Proposed Standalone Architecture

### Core Components

#### 1. MCP Server Core (`src/server.ts`)
```typescript
interface MCPServerCore {
  // MCP Protocol Implementation
  handleToolCall(name: string, args: any): Promise<ToolResult>
  handleResourceRequest(uri: string): Promise<ResourceContent>
  handlePromptRequest(name: string, args: any): Promise<PromptContent>
  
  // Transport Management
  setupStdioTransport(): void
  setupWebSocketTransport(port: number): void
  
  // Lifecycle
  start(): Promise<void>
  stop(): Promise<void>
}
```

#### 2. WebSocket Client (`src/websocket.ts`)
```typescript
interface GrasshopperClient {
  // Connection Management
  connect(host: string, port: number): Promise<void>
  disconnect(): void
  isConnected(): boolean
  
  // Communication
  send(action: string, data: any): Promise<WebSocketResponse>
  subscribe(events: string[]): void
  
  // Event Handling
  on(event: 'canvasUpdated' | 'selectionChanged', handler: Function): void
  off(event: string, handler: Function): void
}

interface WebSocketResponse {
  ok: boolean
  data?: any
  error?: { code: string; message: string }
}
```

#### 3. Tool Implementations (`src/tools/`)
```typescript
// Canvas Tools
interface CanvasTools {
  getCanvasState(args: { includeSelection?: boolean }): Promise<ToolResult>
  getSelection(): Promise<ToolResult>
  queryJson(args: { source: string; query: string; filePath?: string }): Promise<ToolResult>
}

// Script Tools
interface ScriptTools {
  createScriptFile(args: { componentUuid: string; language: string; nameHint?: string }): Promise<ToolResult>
  pushScriptUpdate(args: { componentUuid: string; filePath: string; language?: string }): Promise<ToolResult>
  listScripts(): Promise<ToolResult>
  confirmLastUpdate(args: { componentUuid: string; sha256?: string }): Promise<ToolResult>
}

// Project Tools
interface ProjectTools {
  initProjectScaffold(): Promise<ToolResult>
  getChangeLog(args: { sinceMs: number; componentUuid?: string; kinds?: string[] }): Promise<ToolResult>
}
```

#### 4. Resource Providers (`src/resources/`)
```typescript
interface ResourceProvider {
  // Canvas State Resource
  getCanvasResource(): Promise<ResourceContent>
  
  // Project Structure Resource
  getProjectStructureResource(): Promise<ResourceContent>
  
  // Snapshot Resources
  getSnapshotResource(path: string): Promise<ResourceContent>
}
```

#### 5. Prompt Definitions (`src/prompts/`)
```typescript
interface PromptProvider {
  // Workflow Assistance
  analyzeCanvas(args: { focus_area?: string }): Promise<PromptContent>
  createComponentScript(args: { component_uuid: string; requirements: string; language?: string }): Promise<PromptContent>
  debugScriptError(args: { component_uuid: string; error_message?: string }): Promise<PromptContent>
  
  // Documentation
  documentWorkflow(args: { detail_level?: string; include_screenshots?: boolean }): Promise<PromptContent>
  optimizeDefinition(args: { optimization_goal?: string }): Promise<PromptContent>
  
  // General
  explainExtension(args: { detail_level?: string }): Promise<PromptContent>
  suggestWorkflow(args: { task: string; experience_level?: string }): Promise<PromptContent>
}
```

### File Structure (Proposed)
```
mcp-server-standalone/
├── package.json                 # Minimal dependencies
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── index.ts                # Entry point
│   ├── server.ts               # MCP Server core
│   ├── websocket.ts            # Grasshopper WebSocket client
│   ├── types.ts                # Core interfaces
│   ├── tools/
│   │   ├── canvas.ts           # Canvas inspection tools
│   │   ├── scripts.ts          # Script management tools
│   │   ├── project.ts          # Project scaffolding
│   │   └── testing.ts          # Hello world & testing tools
│   ├── resources/
│   │   ├── canvas.ts           # Canvas state resources
│   │   └── project.ts          # Project structure resources
│   ├── prompts/
│   │   ├── grasshopper.ts      # GH-specific prompts
│   │   └── workflow.ts         # Workflow assistance prompts
│   └── utils/
│       ├── logger.ts           # Simple logging
│       ├── fileSystem.ts       # File operations
│       └── jsonQuery.ts        # JSON querying utilities
└── README.md
```

## VSCode Extension Integration Points

### 1. Shared State Coordination
```typescript
interface SharedStateCoordination {
  // Canvas Snapshots
  syncCanvasSnapshot(snapshot: CanvasSnapshot): void
  getLastSnapshot(): CanvasSnapshot | null
  
  // Event Synchronization
  broadcastEvent(event: EventLogEntry): void
  subscribeToEvents(handler: (event: EventLogEntry) => void): void
  
  // File System Coordination
  notifyFileChange(filePath: string, componentUuid: string, sha256: string): void
  subscribeToFileChanges(handler: (change: FileChangeEvent) => void): void
}
```

### 2. Communication Patterns

#### Independent Operation
- MCP server operates standalone without VSCode extension
- VSCode extension operates without MCP server
- Both can communicate with Grasshopper WebSocket independently

#### Coordinated Operation (When Both Active)
```typescript
interface CoordinationProtocol {
  // State Synchronization
  shareCanvasState(): void      // MCP server shares canvas state with VSCode
  shareEventLog(): void         // VSCode shares file events with MCP server
  
  // Conflict Resolution
  resolveScriptConflict(componentUuid: string): Promise<ConflictResolution>
  coordinateFileUpdates(filePath: string): Promise<void>
  
  // UI Integration
  requestGraphViewer(snapshotPath?: string): Promise<boolean>  // MCP -> VSCode
  requestProjectScaffold(): Promise<string[]>                 // MCP -> VSCode
}
```

### 3. File System Integration

#### Script File Management
```typescript
interface ScriptFileProtocol {
  // UUID Mapping
  extractUuidFromFile(filePath: string): string | null
  extractUuidFromHeader(content: string): string | null
  generateScriptFileName(nameHint: string, uuid: string, language: string): string
  
  // File Operations
  createScriptFile(componentUuid: string, language: string, nameHint?: string): Promise<string>
  updateScriptContent(filePath: string, content: string): Promise<void>
  watchScriptFiles(pattern: string, handler: FileChangeHandler): void
  
  // Project Structure
  ensureProjectDirectories(): Promise<void>
  listProjectScripts(): Promise<ScriptFileInfo[]>
}

interface ScriptFileInfo {
  filePath: string
  componentUuid: string
  language: 'python' | 'cs' | 'vb'
  lastModified: Date
  sha256: string
}
```

## WebSocket Protocol Integration

### Message Format (Unified Envelope)
```typescript
// Requests (MCP/VSCode → Grasshopper)
interface WebSocketRequest {
  action: string
  correlationId: string
  ts: number
  data: any
}

// Responses (Grasshopper → MCP/VSCode)
interface WebSocketResponse {
  type: 'response'
  ok: boolean
  correlationId: string
  ts: number
  data?: any
  error?: { code: string; message: string }
}

// Events (Grasshopper → MCP/VSCode, push)
interface WebSocketEvent {
  type: 'event'
  event: string
  ts: number
  data: any
}
```

### Supported Actions
```typescript
interface GrasshopperActions {
  // Connection
  hello(args: { subscribe: string[]; client?: string }): Promise<HelloResponse>
  ping(): Promise<PingResponse>
  
  // Canvas Operations
  getCanvasState(args: { includeSelection?: boolean }): Promise<CanvasStateResponse>
  getSelection(): Promise<SelectionResponse>
  
  // Script Operations
  scriptUpdated(args: {
    componentUuid: string
    filePath: string
    language: 'python' | 'cs' | 'vb'
    sha256: string
    fileSize: number
    idempotencyKey?: string
  }): Promise<ScriptUpdateResponse>
}
```

## Event System & Logging

### Event Types
```typescript
type EventKind = 
  | 'FS_CHANGE'          // File system changes
  | 'SCRIPT_PUSHED'      // Script sent to Grasshopper
  | 'APPLIED'            // Grasshopper confirmed script update
  | 'CANVAS_UPDATED'     // Canvas changed in Grasshopper
  | 'SELECTION_CHANGED'  // Selection changed
  | 'DIAGNOSTIC'         // Grasshopper diagnostic message
  | 'ERROR'              // Transport/protocol error
  | 'MCP_TOOL_CALL'      // MCP tool invocation
  | 'MEDIA_ADDED'        // Screenshot or media added

interface EventLogEntry {
  tsClient: number
  tsServer?: number
  kind: EventKind
  correlationId?: string
  componentUuid?: string
  sha256?: string
  summary?: string
  data?: any
}
```

## Configuration & Settings

### MCP Server Configuration
```typescript
interface MCPServerConfig {
  // WebSocket Connection
  grasshopper: {
    host: string          // default: '127.0.0.1'
    port: number          // default: 8181
    reconnectInterval: number  // default: 5000ms
    timeout: number       // default: 30000ms
  }
  
  // File System
  project: {
    scriptsDir: string    // default: 'gh_scripts'
    stateDir: string      // default: 'state'
    watchGlobs: string[]  // default: ['gh_scripts/**/*.{py,cs}']
  }
  
  // Logging
  logging: {
    level: 'quiet' | 'normal' | 'verbose'  // default: 'normal'
    maxEvents: number     // default: 5000
  }
  
  // MCP Transport
  transport: {
    type: 'stdio' | 'websocket'  // default: 'stdio'
    port?: number         // for websocket transport
  }
}
```

### VSCode Extension Coordination
```typescript
interface VSCodeCoordination {
  // Shared Configuration
  sharedSettings: {
    maxPayloadMb: number
    debounceMs: number
    snapshotThrottleMs: number
  }
  
  // Communication Channels
  ipc: {
    enabled: boolean
    channel: string       // Named pipe or socket path
  }
  
  // UI Integration
  ui: {
    enableGraphViewer: boolean
    showStatusBar: boolean
    activityBarIntegration: boolean
  }
}
```

## Deployment & Testing Strategy

### Standalone Deployment
1. **MCP Server Only**: Runs independently, connects to Grasshopper WebSocket
2. **With Claude Code**: Uses stdio transport for AI agent integration
3. **Development Mode**: Mock WebSocket responses for testing without Grasshopper

### Integration Testing
1. **Unit Tests**: Individual tool implementations
2. **WebSocket Integration**: End-to-end with mock Grasshopper server
3. **MCP Protocol**: Tool schema validation and response format testing
4. **VSCode Coordination**: Shared state and event synchronization

### Migration Strategy
1. **Phase 1**: Build standalone MCP server with core tools
2. **Phase 2**: Test integration with Claude Code
3. **Phase 3**: Add VSCode extension coordination features
4. **Phase 4**: Replace existing MCP server implementation

## Future Enhancements

### Advanced Features
- **Batch Operations**: Multiple script updates in single transaction
- **Snapshot Diffing**: Compare canvas states over time
- **Performance Monitoring**: Track Grasshopper operation performance
- **Remote Access**: Tunnel connections for cross-machine development

### AI Agent Enhancements
- **Context Awareness**: Track conversation history for better responses
- **Learning**: Improve suggestions based on user patterns
- **Multi-modal**: Support for image analysis of Grasshopper screenshots
- **Collaborative**: Multi-agent workflows for complex tasks

This architecture provides a clean separation of concerns while enabling rich integration between the MCP server, VSCode extension, and Grasshopper environment.