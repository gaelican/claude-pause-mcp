# Parent App (Electron) Detailed Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Main Process](#main-process)
3. [Renderer Process](#renderer-process)
4. [IPC Communication](#ipc-communication)
5. [Window Management](#window-management)
6. [Build Configuration](#build-configuration)
7. [Development Workflow](#development-workflow)
8. [Performance Optimization](#performance-optimization)

## Architecture Overview

The Claude Pause parent app is an Electron application that provides a desktop environment for the dialog system. It consists of two main processes:

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Application                   │
├─────────────────────────────────────────────────────────┤
│                     Main Process                          │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Window Manager  │  │ WebSocket Server│              │
│  └─────────────────┘  └─────────────────┘              │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  IPC Handlers   │  │  App Lifecycle  │              │
│  └─────────────────┘  └─────────────────┘              │
├─────────────────────────────────────────────────────────┤
│                   Renderer Process                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │                 React Application                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │ Contexts │  │Components│  │    Utils     │  │   │
│  │  └──────────┘  └──────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Main Process

### Entry Point (src/main/index.js)

```javascript
const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const { WebSocketServer } = require('ws');

// Global references
let mainWindow = null;
let mcpWebSocketServer = null;
let appState = {
  isQuitting: false,
  windowState: null,
  settings: {}
};

// Main app lifecycle
app.whenReady().then(() => {
  // Initialize components
  createMainWindow();
  setupIPC();
  startWebSocketServer();
  setupAppMenu();
  
  // Handle app activation (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  appState.isQuitting = true;
  saveWindowState();
  cleanupResources();
});
```

### Window Creation and Management

```javascript
function createMainWindow() {
  // Load saved window state
  const windowState = loadWindowState();
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    x: windowState?.x,
    y: windowState?.y,
    width: windowState?.width || 1200,
    height: windowState?.height || 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Custom title bar
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    icon: path.join(__dirname, '../../public/icon.png'),
    show: false // Don't show until ready
  });

  // Window event handlers
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    
    // Restore maximized state if needed
    if (windowState?.isMaximized) {
      mainWindow.maximize();
    }
    
    // Focus window
    mainWindow.focus();
  });

  mainWindow.on('close', (event) => {
    if (!appState.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Platform-specific handling
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Window state tracking
  mainWindow.on('resize', debounce(() => {
    saveWindowState();
  }, 500));

  mainWindow.on('move', debounce(() => {
    saveWindowState();
  }, 500));

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

function saveWindowState() {
  if (!mainWindow) return;
  
  const bounds = mainWindow.getBounds();
  const isMaximized = mainWindow.isMaximized();
  
  appState.windowState = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized
  };
  
  // Save to persistent storage
  store.set('windowState', appState.windowState);
}

function loadWindowState() {
  return store.get('windowState', null);
}
```

### IPC Communication Setup

```javascript
function setupIPC() {
  // Dialog response handler
  ipcMain.handle('dialog-response', async (event, response) => {
    try {
      const { requestId, data } = response;
      
      // Log for debugging
      if (process.env.DEBUG) {
        console.log('[IPC] Dialog response:', requestId, data);
      }
      
      // Forward to WebSocket
      if (mcpWebSocketServer) {
        mcpWebSocketServer.handleDialogResponse(requestId, data);
      }
      
      // Track metrics
      metrics.recordResponse(requestId, data);
      
      return { success: true };
    } catch (error) {
      console.error('[IPC] Error handling dialog response:', error);
      return { success: false, error: error.message };
    }
  });

  // Window control handlers
  ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    mainWindow?.close();
  });

  // Settings handlers
  ipcMain.handle('get-settings', async () => {
    return store.get('settings', {
      theme: 'dark',
      dialogFrequency: 'normal',
      autoFocus: true,
      soundNotifications: false,
      minimizeOnResponse: false
    });
  });

  ipcMain.handle('save-settings', async (event, settings) => {
    store.set('settings', settings);
    
    // Apply settings
    applySettings(settings);
    
    return { success: true };
  });

  // App info handlers
  ipcMain.handle('get-app-info', async () => {
    return {
      version: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      platform: process.platform,
      arch: process.arch
    };
  });

  // External link handler
  ipcMain.handle('open-external', async (event, url) => {
    // Validate URL
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL');
    }
    
    await shell.openExternal(url);
    return { success: true };
  });
}
```

### WebSocket Server Integration

```javascript
class MCPWebSocketManager {
  constructor(port = 3000) {
    this.port = port;
    this.wss = null;
    this.connections = new Map();
    this.pendingRequests = new Map();
    this.reconnectInterval = null;
  }

  start() {
    try {
      this.wss = new WebSocketServer({ port: this.port });
      
      this.wss.on('connection', this.handleConnection.bind(this));
      this.wss.on('error', this.handleServerError.bind(this));
      
      console.log(`[WS] Server started on port ${this.port}`);
    } catch (error) {
      console.error('[WS] Failed to start server:', error);
      this.scheduleReconnect();
    }
  }

  handleConnection(ws, req) {
    const connectionId = this.generateConnectionId();
    const clientIp = req.socket.remoteAddress;
    
    console.log(`[WS] New connection from ${clientIp}`);
    
    // Store connection
    this.connections.set(connectionId, {
      ws,
      ip: clientIp,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    });

    // Setup event handlers
    ws.on('message', (data) => {
      this.handleMessage(connectionId, data);
    });

    ws.on('close', (code, reason) => {
      this.handleDisconnect(connectionId, code, reason);
    });

    ws.on('error', (error) => {
      this.handleConnectionError(connectionId, error);
    });

    ws.on('pong', () => {
      this.handlePong(connectionId);
    });

    // Send connection acknowledgment
    this.sendToConnection(connectionId, {
      type: 'connection',
      status: 'connected',
      connectionId,
      timestamp: new Date().toISOString()
    });

    // Notify renderer
    this.notifyRenderer('mcp-connected', { connectionId });
  }

  handleMessage(connectionId, data) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) return;

      // Update activity
      connection.lastActivity = Date.now();

      // Parse message
      const message = JSON.parse(data.toString());
      
      if (process.env.DEBUG) {
        console.log('[WS] Message received:', message);
      }

      // Route message
      switch (message.method) {
        case 'tools/call':
          this.handleToolCall(connectionId, message);
          break;
          
        case 'ping':
          this.handlePing(connectionId, message);
          break;
          
        case 'status':
          this.handleStatusRequest(connectionId, message);
          break;
          
        default:
          this.sendError(connectionId, message.id, -32601, 'Method not found');
      }
    } catch (error) {
      console.error('[WS] Message handling error:', error);
      this.sendError(connectionId, null, -32700, 'Parse error');
    }
  }

  handleToolCall(connectionId, message) {
    const { id, params } = message;
    const { name: tool, arguments: parameters } = params;

    // Validate tool
    if (!this.isValidTool(tool)) {
      this.sendError(connectionId, id, -32602, 'Invalid tool');
      return;
    }

    // Store pending request
    this.pendingRequests.set(id, {
      connectionId,
      tool,
      parameters,
      timestamp: Date.now()
    });

    // Forward to renderer
    this.notifyRenderer('dialog-request', {
      requestId: id,
      dialogType: tool,
      parameters,
      timestamp: new Date().toISOString()
    });
  }

  handleDialogResponse(requestId, response) {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) {
      console.warn('[WS] No pending request for:', requestId);
      return;
    }

    const { connectionId } = pending;
    
    // Clean up
    this.pendingRequests.delete(requestId);

    // Send response
    if (response.cancelled) {
      this.sendError(connectionId, requestId, -32603, 'User cancelled', response);
    } else {
      this.sendResult(connectionId, requestId, response);
    }
  }

  sendToConnection(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('[WS] Send error:', error);
      return false;
    }
  }

  sendResult(connectionId, id, result) {
    return this.sendToConnection(connectionId, {
      jsonrpc: '2.0',
      id,
      result
    });
  }

  sendError(connectionId, id, code, message, data = null) {
    return this.sendToConnection(connectionId, {
      jsonrpc: '2.0',
      id,
      error: { code, message, data }
    });
  }

  notifyRenderer(channel, data) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, data);
    }
  }

  // Heartbeat mechanism
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((connection, id) => {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.ping();
        }
      });
    }, 30000); // 30 seconds
  }

  cleanup() {
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }

    // Close connections
    this.connections.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close(1000, 'Server shutting down');
      }
    });

    // Close server
    if (this.wss) {
      this.wss.close();
    }
  }
}
```

### App Menu Configuration

```javascript
function setupAppMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Dialog',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'new-dialog');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'open-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://docs.claude-pause.ai');
          }
        },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/claude-pause/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'About Claude Pause',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'show-about');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => {
            mainWindow?.webContents.send('menu-action', 'open-settings');
          }
        },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
```

## Renderer Process

### Entry Point (src/renderer/main.tsx)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import './styles/app.css';
import './styles/magic-ui.css';
import './styles/magic-dialogs.css';

// Error boundary
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Send to main process for logging
  window.electronAPI?.logError({
    type: 'unhandledRejection',
    error: event.reason
  });
});

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  // React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function () {
      console.log('React DevTools connected');
    };
  }
  
  // Performance observer
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`[Performance] ${entry.name}: ${entry.duration}ms`);
    }
  });
  
  observer.observe({ entryTypes: ['measure', 'navigation'] });
}

// Render app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Preload Script (src/main/preload.js)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Validate channels
const validChannels = {
  invoke: [
    'dialog-response',
    'window-minimize',
    'window-maximize',
    'window-close',
    'get-settings',
    'save-settings',
    'get-app-info',
    'open-external'
  ],
  on: [
    'dialog-request',
    'mcp-connected',
    'mcp-disconnected',
    'mcp-message',
    'menu-action',
    'settings-changed'
  ]
};

// Expose protected methods
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog communication
  sendDialogResponse: (response) => {
    if (!response.requestId) {
      throw new Error('requestId is required');
    }
    return ipcRenderer.invoke('dialog-response', response);
  },

  onDialogRequest: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('dialog-request', subscription);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('dialog-request', subscription);
    };
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  onSettingsChanged: (callback) => {
    const subscription = (event, settings) => callback(settings);
    ipcRenderer.on('settings-changed', subscription);
    return () => {
      ipcRenderer.removeListener('settings-changed', subscription);
    };
  },

  // MCP communication
  onMCPMessage: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('mcp-message', subscription);
    return () => {
      ipcRenderer.removeListener('mcp-message', subscription);
    };
  },

  onMCPConnected: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('mcp-connected', subscription);
    return () => {
      ipcRenderer.removeListener('mcp-connected', subscription);
    };
  },

  onMCPDisconnected: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('mcp-disconnected', subscription);
    return () => {
      ipcRenderer.removeListener('mcp-disconnected', subscription);
    };
  },

  // App info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Menu actions
  onMenuAction: (callback) => {
    const subscription = (event, action) => callback(action);
    ipcRenderer.on('menu-action', subscription);
    return () => {
      ipcRenderer.removeListener('menu-action', subscription);
    };
  },

  // Logging
  logError: (error) => ipcRenderer.invoke('log-error', error),
  
  // Platform info
  platform: process.platform,
  arch: process.arch,
  versions: process.versions
});
```

## Build Configuration

### Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@components': resolve(__dirname, 'src/renderer/components'),
      '@utils': resolve(__dirname, 'src/renderer/utils'),
      '@styles': resolve(__dirname, 'src/renderer/styles'),
      '@types': resolve(__dirname, 'src/renderer/types'),
      '@hooks': resolve(__dirname, 'src/renderer/hooks'),
      '@context': resolve(__dirname, 'src/renderer/context')
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.html')
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'framer-motion': ['framer-motion'],
          'utils': ['marked', 'dompurify']
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion']
  }
});
```

### Electron Builder Configuration

```json
{
  "productName": "Claude Pause",
  "appId": "ai.claude.pause",
  "directories": {
    "output": "release",
    "buildResources": "build"
  },
  "files": [
    "dist/**/*",
    "src/main/**/*",
    "public/**/*",
    "package.json"
  ],
  "mac": {
    "category": "public.app-category.developer-tools",
    "icon": "public/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64", "ia32"]
      }
    ],
    "icon": "public/icon.ico"
  },
  "linux": {
    "target": [
      {
        "target": "AppImage",
        "arch": ["x64"]
      },
      {
        "target": "deb",
        "arch": ["x64"]
      }
    ],
    "icon": "public/icon.png",
    "category": "Development"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "deleteAppDataOnUninstall": true
  }
}
```

## Development Workflow

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# This starts:
# 1. Vite dev server (React app)
# 2. Electron in development mode
# 3. WebSocket server

# For debugging main process
npm run dev:main -- --inspect

# For debugging renderer process
# Use Chrome DevTools (automatically opened in dev mode)
```

### Hot Module Replacement

```typescript
// In renderer process
if (import.meta.hot) {
  import.meta.hot.accept();
  
  // Custom HMR handling
  import.meta.hot.accept('./components/dialogs/PlannerDialog', () => {
    console.log('PlannerDialog updated');
    // Force re-render if needed
  });
}
```

### Development Tools

```typescript
// DevTools component
export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const { activeDialogs, pendingRequests } = useDialogs();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="dev-tools">
      <button onClick={() => setIsOpen(!isOpen)}>
        DevTools
      </button>
      
      {isOpen && (
        <div className="dev-panel">
          <h3>Active Dialogs: {activeDialogs.length}</h3>
          <h3>Pending Requests: {pendingRequests.size}</h3>
          
          <button onClick={() => {
            // Simulate dialog request
            window.electronAPI.onDialogRequest({
              requestId: 'test-' + Date.now(),
              dialogType: 'planner',
              parameters: {
                decision_context: 'Test dialog',
                options: [
                  { label: 'Option 1', value: 'opt1' },
                  { label: 'Option 2', value: 'opt2' }
                ]
              }
            });
          }}>
            Test Dialog
          </button>
        </div>
      )}
    </div>
  );
}
```

## Performance Optimization

### Main Process Optimization

```javascript
// Lazy loading modules
let store;
function getStore() {
  if (!store) {
    store = require('electron-store');
  }
  return store;
}

// Debouncing expensive operations
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Resource cleanup
function cleanupResources() {
  // Close WebSocket connections
  if (mcpWebSocketServer) {
    mcpWebSocketServer.cleanup();
  }
  
  // Clear intervals
  clearInterval(heartbeatInterval);
  
  // Remove listeners
  app.removeAllListeners();
  ipcMain.removeAllListeners();
}
```

### Renderer Process Optimization

```typescript
// Code splitting
const PlannerDialog = lazy(() => 
  import('./components/dialogs/PlannerDialog')
);

// Memoization
const MemoizedDialog = memo(DialogComponent, (prevProps, nextProps) => {
  return prevProps.requestId === nextProps.requestId &&
         prevProps.parameters === nextProps.parameters;
});

// Virtual scrolling for large lists
import { FixedSizeList } from 'react-window';

function VirtualDialogList({ dialogs }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <DialogCard dialog={dialogs[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={dialogs.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### Memory Management

```javascript
// Main process memory monitoring
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory Usage:', {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`
  });
  
  // Alert if memory usage is high
  if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('High memory usage detected');
    // Trigger cleanup
    global.gc && global.gc();
  }
}, 60000); // Every minute
```

## Security Best Practices

### Content Security Policy

```javascript
// In main process
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // Only allow navigation to our app
    if (parsedUrl.origin !== 'http://localhost:5173' && 
        parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
  
  // Set CSP
  contents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "connect-src 'self' ws://localhost:3000"
        ].join('; ')
      }
    });
  });
});
```

### Input Validation

```javascript
// Validate all IPC inputs
function validateDialogResponse(response) {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid response format');
  }
  
  const { requestId, data } = response;
  
  if (!requestId || typeof requestId !== 'string') {
    throw new Error('Invalid requestId');
  }
  
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response data');
  }
  
  // Additional validation based on dialog type
  if (data.choice !== undefined && typeof data.choice !== 'string') {
    throw new Error('Invalid choice value');
  }
  
  return true;
}
```

## Troubleshooting Common Issues

### Issue: App won't start

```javascript
// Add verbose logging
app.on('ready', () => {
  console.log('App ready');
  console.log('Electron version:', process.versions.electron);
  console.log('Node version:', process.versions.node);
  console.log('Platform:', process.platform);
});

// Check for port conflicts
function checkPort(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}
```

### Issue: IPC communication fails

```javascript
// Debug IPC messages
ipcMain.on('*', (event, channel, ...args) => {
  console.log(`[IPC] ${channel}:`, args);
});

// Test IPC connection
ipcMain.handle('ping', () => 'pong');
```

### Issue: Memory leaks

```javascript
// Track event listeners
const listeners = new Map();

function trackListener(target, event, handler) {
  const key = `${target}-${event}`;
  const count = listeners.get(key) || 0;
  listeners.set(key, count + 1);
  
  if (count > 10) {
    console.warn(`Possible memory leak: ${key} has ${count} listeners`);
  }
}
```