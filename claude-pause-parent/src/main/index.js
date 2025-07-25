const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const { WebSocketServer } = require('ws');

let mainWindow = null;
let tray = null;
let wss = null;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Enable live reload for Electron
if (process.argv.includes('--dev')) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e2e',
    show: false
  });

  // Load the renderer
  mainWindow.loadFile(path.join(__dirname, '../../public/index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent actual close, minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Create a tray icon
  const iconPath = path.join(__dirname, '../../public/icon.png');
  
  // Check if icon exists, if not create a simple nativeImage
  let trayIcon;
  try {
    if (require('fs').existsSync(iconPath)) {
      trayIcon = iconPath;
    } else {
      // Create a simple icon programmatically
      const { nativeImage } = require('electron');
      const size = 16;
      const buffer = Buffer.alloc(size * size * 4);
      
      // Fill with blue color
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = 137;     // R
        buffer[i + 1] = 180; // G
        buffer[i + 2] = 250; // B
        buffer[i + 3] = 255; // A
      }
      
      trayIcon = nativeImage.createFromBuffer(buffer, {
        width: size,
        height: size
      });
    }
  } catch (error) {
    console.error('Error loading icon:', error);
    // Create default icon
    const { nativeImage } = require('electron');
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Settings',
      click: () => {
        // TODO: Open settings
        if (mainWindow) {
          mainWindow.webContents.send('open-settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Claude Pause');
  tray.setContextMenu(contextMenu);
  
  // Click to show/hide
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
}

// Initialize WebSocket server for MCP communication
function initWebSocketServer() {
  wss = new WebSocketServer({ port: 3030 });
  
  wss.on('connection', (ws) => {
    console.log('MCP client connected');
    
    // Notify renderer of connection
    if (mainWindow) {
      mainWindow.webContents.send('mcp-message', {
        type: 'connection_status',
        status: 'connected'
      });
    }
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Received MCP message:', data.type);
        
        // Forward to renderer
        if (mainWindow) {
          mainWindow.webContents.send('mcp-message', data);
        }
        
        // Handle different message types
        switch (data.type) {
          case 'dialog_request':
            handleDialogRequest(ws, data);
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('MCP client disconnected');
      
      // Notify renderer of disconnection
      if (mainWindow) {
        mainWindow.webContents.send('mcp-message', {
          type: 'connection_status',
          status: 'disconnected'
        });
      }
    });
  });
  
  console.log('WebSocket server listening on port 3030');
}

function handleDialogRequest(ws, data) {
  // Ensure window is visible
  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.show();
  }
  
  // Store the WebSocket connection for response
  if (mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('dialog-request', {
        ...data,
        requestId: data.id
      });
    });
    
    // If already loaded, send immediately
    if (!mainWindow.webContents.isLoading()) {
      mainWindow.webContents.send('dialog-request', {
        ...data,
        requestId: data.id
      });
    }
  }
  
  // Store WebSocket for response
  global.activeConnections = global.activeConnections || new Map();
  global.activeConnections.set(data.id, ws);
}

// IPC handlers
ipcMain.handle('dialog-response', (event, response) => {
  const { requestId, data } = response;
  const ws = global.activeConnections?.get(requestId);
  
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({
      type: 'dialog_response',
      id: requestId,
      data: data
    }));
    global.activeConnections.delete(requestId);
  }
});

// Window control handlers
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

// App event handlers
app.whenReady().then(() => {
  createTray();
  createWindow();
  initWebSocketServer();
});

app.on('window-all-closed', () => {
  // Don't quit on window close, stay in tray
  if (process.platform !== 'darwin') {
    // Keep running
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  if (wss) {
    wss.close();
  }
});