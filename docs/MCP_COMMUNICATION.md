# MCP Communication System Documentation

## Overview

The Model Context Protocol (MCP) communication system enables real-time bidirectional communication between Claude AI and the Claude Pause UI. This document details the architecture, protocols, and implementation of this system.

## Communication Architecture

```
┌─────────────────┐      WebSocket      ┌─────────────────┐      IPC       ┌─────────────────┐
│   Claude MCP    │ ←────────────────→ │  Electron Main  │ ←───────────→ │  React Renderer │
│     Server      │    (Port: 3000)     │     Process     │              │     Process     │
└─────────────────┘                     └─────────────────┘              └─────────────────┘
```

## WebSocket Implementation

### Server Setup (Main Process)
```javascript
// src/main/index.js
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws) => {
  console.log('MCP WebSocket connected');
  
  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    handleMCPMessage(message);
  });
  
  ws.on('close', () => {
    console.log('MCP WebSocket disconnected');
  });
});
```

### Client Connection (Renderer)
```typescript
// src/renderer/utils/websocket.ts
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  connect() {
    this.ws = new WebSocket('ws://localhost:3000');
    
    this.ws.onopen = () => {
      console.log('Connected to MCP');
      this.onConnectionChange?.(true);
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.ws.onclose = () => {
      this.onConnectionChange?.(false);
      this.attemptReconnect();
    };
  }
}
```

## Message Protocol

### Request Structure
```typescript
interface MCPRequest {
  id: string;           // Unique request ID
  method: string;       // Method name (e.g., 'dialog')
  params: {
    tool: string;       // Tool name (e.g., 'planner')
    parameters: any;    // Tool-specific parameters
  };
}
```

### Response Structure
```typescript
interface MCPResponse {
  id: string;           // Matching request ID
  result?: any;         // Success result
  error?: {             // Error details
    code: number;
    message: string;
  };
}
```

## Dialog Flow

### 1. Dialog Request Flow
```
1. Claude calls MCP tool
   ↓
2. MCP sends WebSocket message:
   {
     "id": "req_123",
     "method": "dialog",
     "params": {
       "tool": "planner",
       "parameters": {
         "decision_context": "...",
         "options": [...]
       }
     }
   }
   ↓
3. Main process receives and forwards via IPC:
   mainWindow.webContents.send('dialog-request', {
     requestId: 'req_123',
     dialogType: 'planner',
     parameters: {...}
   })
   ↓
4. React app displays dialog
```

### 2. Response Flow
```
1. User interacts with dialog
   ↓
2. React sends response via IPC:
   window.electronAPI.sendDialogResponse({
     requestId: 'req_123',
     data: {
       choice: 'option1',
       thinkingMode: 'deep',
       timestamp: '2024-01-20T10:00:00Z'
     }
   })
   ↓
3. Main process sends WebSocket response:
   {
     "id": "req_123",
     "result": {
       "choice": "option1",
       "thinkingMode": "deep"
     }
   }
   ↓
4. Claude receives response
```

## IPC Bridge

### Preload Script
```javascript
// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer → Main
  sendDialogResponse: (response) => 
    ipcRenderer.invoke('dialog-response', response),
  
  // Main → Renderer
  onDialogRequest: (callback) => 
    ipcRenderer.on('dialog-request', (event, data) => callback(data)),
  
  onMCPMessage: (callback) => 
    ipcRenderer.on('mcp-message', (event, data) => callback(data))
});
```

### Main Process Handlers
```javascript
// src/main/index.js
ipcMain.handle('dialog-response', async (event, response) => {
  const { requestId, data } = response;
  
  // Find the WebSocket connection
  if (globalWs && globalWs.readyState === WebSocket.OPEN) {
    globalWs.send(JSON.stringify({
      id: requestId,
      result: data
    }));
  }
});
```

## Dialog Types and Parameters

### 1. Planner Dialog
```typescript
{
  tool: "planner",
  parameters: {
    decision_context: string,
    visual_output?: string,
    plan?: string,
    options: Array<{
      label: string,
      value: string,
      description?: string
    }>,
    default_action?: string
  }
}
```

### 2. Text Input
```typescript
{
  tool: "text_input",
  parameters: {
    question: string,
    placeholder?: string,
    defaultText?: string,
    maxLength?: number,
    expectsCode?: boolean
  }
}
```

### 3. Single Choice
```typescript
{
  tool: "single_choice",
  parameters: {
    question: string,
    options: Array<{
      label: string,
      value: string,
      description?: string,
      disabled?: boolean
    }>,
    defaultValue?: string
  }
}
```

### 4. Multi Choice
```typescript
{
  tool: "multi_choice",
  parameters: {
    question: string,
    options: Array<{
      label: string,
      value: string,
      checked?: boolean,
      group?: string,
      tags?: string[]
    }>,
    minSelections?: number,
    maxSelections?: number
  }
}
```

### 5. Screenshot Request
```typescript
{
  tool: "screenshot_request",
  parameters: {
    question: string,
    description?: string
  }
}
```

### 6. Confirm
```typescript
{
  tool: "confirm",
  parameters: {
    question: string,
    warning?: string,
    isDangerous?: boolean,
    yesLabel?: string,
    noLabel?: string
  }
}
```

## Error Handling

### Connection Errors
```typescript
// Automatic reconnection
private attemptReconnect() {
  if (this.reconnectTimeout) return;
  
  this.reconnectTimeout = setTimeout(() => {
    console.log('Attempting to reconnect...');
    this.connect();
    this.reconnectTimeout = null;
  }, 5000);
}
```

### Message Errors
```typescript
// Error response format
{
  "id": "req_123",
  "error": {
    "code": -32603,
    "message": "Internal error: Dialog cancelled by user"
  }
}
```

## State Synchronization

### Dialog State
- Active dialogs tracked in DialogContext
- History maintained for session
- Responses cached until acknowledged

### Connection State
- WebSocket status monitored
- UI reflects connection state
- Queued messages during disconnection

## Security Considerations

1. **Local Only**: WebSocket bound to localhost
2. **Message Validation**: All messages validated
3. **Sanitization**: User input sanitized
4. **Rate Limiting**: Prevent message flooding
5. **Error Isolation**: Errors don't crash app

## Performance Optimizations

1. **Message Batching**: Group rapid updates
2. **Debouncing**: Prevent rapid reconnects
3. **Compression**: Large payloads compressed
4. **Lazy Loading**: Dialogs loaded on demand
5. **Memory Management**: Old messages cleaned up

## Debugging

### Enable Debug Logging
```javascript
// Set in environment
CLAUDE_PAUSE_DEBUG=true

// Logs all WebSocket messages
ws.on('message', (data) => {
  if (process.env.CLAUDE_PAUSE_DEBUG) {
    console.log('WS Message:', data.toString());
  }
});
```

### DevTools WebSocket Inspector
1. Open Chrome DevTools in Electron
2. Network tab → WS filter
3. Inspect message frames

## Future Enhancements

1. **Binary Protocol**: More efficient than JSON
2. **Compression**: Built-in message compression
3. **Multiplexing**: Multiple dialog streams
4. **Encryption**: E2E encryption for sensitive data
5. **Offline Mode**: Queue messages when disconnected