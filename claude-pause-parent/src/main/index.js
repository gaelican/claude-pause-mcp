const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');

let mainWindow = null;
let tray = null;
let wss = null;

// Preferences handling
const userDataPath = app.getPath('userData');
const prefsPath = path.join(userDataPath, 'preferences.json');

function loadPreferences() {
  try {
    if (fs.existsSync(prefsPath)) {
      return JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
    }
  } catch (e) {
  }
  return {};
}

function savePreferences(prefs) {
  try {
    fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));
  } catch (e) {
  }
}

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
    frame: false, // Remove default frame
    titleBarStyle: 'hidden', // Hide title bar
    backgroundColor: '#0f172a', // Match magic-bg-primary
    show: true,
    hasShadow: true,
    roundedCorners: true
  });

  // Load the renderer
  if (process.argv.includes('--dev')) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:3001');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the original app for now
    mainWindow.loadFile(path.join(__dirname, '../../public/index.html'));
  }

  // Window is already shown on creation

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
  
  // Store all connected clients
  const clients = new Set();
  
  wss.on('connection', (ws) => {
    clients.add(ws);
    
    // Add error handler to prevent EPIPE crashes
    ws.on('error', (error) => {
      if (error.code === 'EPIPE') {
      } else {
      }
      clients.delete(ws);
    });
    
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
        
        // Forward to renderer
        if (mainWindow) {
          mainWindow.webContents.send('mcp-message', data);
        }
        
        // Handle different message types
        switch (data.type) {
          case 'dialog_request':
            handleDialogRequest(ws, data, clients);
            break;
          case 'dialog_response':
            // Handle response from React app
            const responseWs = global.activeConnections?.get(data.requestId);
            if (responseWs && responseWs.readyState === responseWs.OPEN) {
              responseWs.send(JSON.stringify({
                type: 'dialog_response',
                id: data.requestId,
                data: data.response
              }));
              global.activeConnections.delete(data.requestId);
            }
            break;
          case 'ping':
            if (ws.readyState === ws.OPEN) {
              try {
                ws.send(JSON.stringify({ type: 'pong' }));
              } catch (error) {
                console.error('Error sending pong:', error);
              }
            }
            break;
          case 'settings_update':
            console.log('Settings update received:', data.settings || data);
            // Echo back confirmation
            if (ws.readyState === ws.OPEN) {
              try {
                ws.send(JSON.stringify({ 
                  type: 'settings_confirmed',
                  setting: data.setting,
                  value: data.value
                }));
              } catch (error) {
                console.error('Error sending settings confirmation:', error);
              }
            }
            break;
          case 'get_preference_count':
            // In a real app, this would query stored preferences
            if (ws.readyState === ws.OPEN) {
              try {
                ws.send(JSON.stringify({ 
                  type: 'preference_count',
                  count: 5 // Example count
                }));
              } catch (error) {
                console.error('Error sending preference count:', error);
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('MCP client disconnected');
      clients.delete(ws);
      
      // Notify renderer of disconnection
      if (mainWindow) {
        mainWindow.webContents.send('mcp-message', {
          type: 'connection_status',
          status: 'disconnected'
        });
      }
    });
  });
  
}

function handleDialogRequest(ws, data, clients) {
  // Ensure window is visible
  if (!mainWindow) {
    createWindow();
  } else {
    mainWindow.show();
  }
  
  // Create dialog object
  const dialog = {
    requestId: data.id,
    dialogType: data.dialogType,
    parameters: data.parameters
  };
  
  // Broadcast to all connected WebSocket clients (including React app)
  clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(JSON.stringify({
          type: 'dialog_request',
          dialog: dialog
        }));
      } catch (error) {
        console.error('Error broadcasting dialog request:', error);
        clients.delete(client);
      }
    }
  });
  
  // Also send via IPC for vanilla JS version
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
// Preference IPC handlers
ipcMain.handle('get-preference', (event, key) => {
  const prefs = loadPreferences();
  return prefs[key];
});

ipcMain.handle('set-preference', (event, key, value) => {
  const prefs = loadPreferences();
  prefs[key] = value;
  savePreferences(prefs);
  return true;
});

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