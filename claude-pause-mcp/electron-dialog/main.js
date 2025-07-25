const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const DialogWebSocketServer = require('./websocket-server');
const { trayIconBase64 } = require('./tray-icon');

let mainWindow;
let dialogData;
let result = null;
let tray = null;
let wsServer = null;
let isQuitting = false;

// Parse command line arguments
const args = process.argv.slice(2);
let isPersistentMode = false;

// Check for persistent mode flag
if (args.includes('--persistent')) {
    isPersistentMode = true;
    // Remove the flag from args
    const flagIndex = args.indexOf('--persistent');
    args.splice(flagIndex, 1);
}

// Parse dialog data if provided
if (args.length > 0) {
    try {
        let jsonString = args[0];
        
        // Check if argument is Base64 encoded (for Windows compatibility)
        // Base64 strings don't contain spaces and have specific character sets
        if (/^[A-Za-z0-9+/]+=*$/.test(jsonString) && !jsonString.includes(' ')) {
            console.error('Detected Base64 input, decoding...');
            jsonString = Buffer.from(jsonString, 'base64').toString('utf8');
        }
        // Check if argument is a file path
        else if (jsonString.endsWith('.json') && fs.existsSync(jsonString)) {
            console.error('Reading JSON from file:', jsonString);
            jsonString = fs.readFileSync(jsonString, 'utf8');
        }
        
        // Parse the JSON
        dialogData = JSON.parse(jsonString);
        console.error('Successfully parsed dialog data');
    } catch (e) {
        console.error('Invalid JSON input:', e);
        console.error('Raw argument:', args[0]);
        if (!isPersistentMode) {
            process.exit(1);
        }
    }
} else if (!isPersistentMode) {
    console.error('No input provided');
    process.exit(1);
}

// Get proper config directory for Windows
function getConfigPath() {
    const appData = app.getPath('userData');
    // Ensure directory exists
    if (!fs.existsSync(appData)) {
        fs.mkdirSync(appData, { recursive: true });
    }
    return appData;
}

function getWindowStateFile() {
    return path.join(getConfigPath(), 'window-state.json');
}

function loadWindowState() {
    try {
        const stateFile = getWindowStateFile();
        if (fs.existsSync(stateFile)) {
            const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
            // Validate the saved state
            if (state.width && state.height) {
                // Check if position is still valid (monitor might have changed)
                const displays = screen.getAllDisplays();
                const displayMatch = displays.some(display => {
                    const bounds = display.bounds;
                    return state.x >= bounds.x && 
                           state.y >= bounds.y && 
                           state.x + state.width <= bounds.x + bounds.width &&
                           state.y + state.height <= bounds.y + bounds.height;
                });
                
                if (displayMatch) {
                    return state;
                } else {
                    // Window is outside visible area, reset to center
                    console.log('Window position invalid, centering...');
                    return null;
                }
            }
        }
    } catch (e) {
        console.error('Error loading window state:', e);
    }
    return null;
}

function saveWindowState() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        try {
            const bounds = mainWindow.getBounds();
            const state = {
                ...bounds,
                isMaximized: mainWindow.isMaximized(),
                isFullScreen: mainWindow.isFullScreen(),
                displayBounds: screen.getDisplayMatching(bounds).bounds
            };
            
            const stateFile = getWindowStateFile();
            fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
        } catch (e) {
            console.error('Error saving window state:', e);
        }
    }
}

function createWindow() {
    // Load saved window state
    const savedState = loadWindowState();
    let windowOptions = {
        width: savedState?.width || 900,
        height: savedState?.height || 700,
        x: savedState?.x,
        y: savedState?.y,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            // Performance optimizations
            backgroundThrottling: false,
            offscreen: false,
            enableBlinkFeatures: 'PreciseMemoryInfo',
            // Hardware acceleration
            webgl: true,
            experimentalFeatures: true
        },
        backgroundColor: '#1e1e2e',
        titleBarStyle: 'hidden',
        frame: false,
        resizable: true,
        show: false,
        // Windows-specific optimizations
        ...(process.platform === 'win32' && {
            transparent: false, // Disable transparency on Windows
            hasShadow: true,
            thickFrame: true
        })
    };
    
    // Set minimum size constraints
    windowOptions.minWidth = 600;
    windowOptions.minHeight = 400;
    
    // Create the browser window
    mainWindow = new BrowserWindow(windowOptions);

    // Load the HTML file
    mainWindow.loadFile('index.html');

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        if (savedState?.isMaximized) {
            mainWindow.maximize();
        }
        mainWindow.show();
    });

    // Save window state on move, resize, or state change
    let saveTimeout;
    const debouncedSave = () => {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveWindowState, 500);
    };
    
    mainWindow.on('move', debouncedSave);
    mainWindow.on('resize', debouncedSave);
    mainWindow.on('maximize', saveWindowState);
    mainWindow.on('unmaximize', saveWindowState);
    mainWindow.on('enter-full-screen', saveWindowState);
    mainWindow.on('leave-full-screen', saveWindowState);
    
    // Handle window close
    mainWindow.on('close', (event) => {
        // Save state before closing
        saveWindowState();
        
        if (!isQuitting && tray) {
            // In persistent mode, hide instead of closing
            event.preventDefault();
            mainWindow.hide();
        } else {
            // Normal close behavior
            if (result) {
                console.log(result);
            } else {
                console.log('CANCELLED');
            }
        }
    });
    
    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// IPC handlers
ipcMain.handle('get-dialog-data', () => {
    return dialogData;
});

ipcMain.handle('submit-response', (event, response, mode, data) => {
    // Save thinking mode preference
    const prefFile = path.join(__dirname, '..', '.thinking_mode_preference');
    try {
        fs.writeFileSync(prefFile, mode);
    } catch (e) {
        // Ignore errors
    }
    
    // Handle response with images
    let finalResult;
    if (data && data.images && data.images.length > 0) {
        // Include images in the response
        finalResult = JSON.stringify({
            text: response,
            mode: mode,
            images: data.images
        });
    } else {
        // Original format for backward compatibility
        finalResult = `${response}|||${mode}`;
    }
    
    if (wsServer && wsServer.getCurrentRequest()) {
        // Persistent mode - send via WebSocket
        const currentRequest = wsServer.getCurrentRequest();
        wsServer.sendResponse(currentRequest.id, finalResult);
        mainWindow.hide();
    } else {
        // Normal mode - return result and close
        result = finalResult;
        mainWindow.close();
    }
});

ipcMain.handle('cancel-dialog', () => {
    if (wsServer && wsServer.getCurrentRequest()) {
        // Persistent mode - send cancellation via WebSocket
        const currentRequest = wsServer.getCurrentRequest();
        wsServer.sendResponse(currentRequest.id, 'CANCELLED');
        mainWindow.hide();
    } else {
        // Normal mode - return result and close
        result = 'CANCELLED';
        mainWindow.close();
    }
});

ipcMain.handle('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.handle('save-position', () => {
    try {
        saveWindowState();
        return true;
    } catch (e) {
        console.error('Error saving position:', e);
        return false;
    }
});

ipcMain.handle('reset-position', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        // Unmaximize if needed
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        }
        
        // Center the window
        const { width, height } = mainWindow.getBounds();
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
        const x = Math.round((screenWidth - width) / 2);
        const y = Math.round((screenHeight - height) / 2);
        mainWindow.setBounds({ x, y, width, height });
        
        // Save the new position
        saveWindowState();
        return true;
    }
    return false;
});

// Screenshot functionality removed - using clipboard paste approach instead

ipcMain.handle('get-thinking-mode', () => {
    const prefFile = path.join(__dirname, '..', '.thinking_mode_preference');
    try {
        if (fs.existsSync(prefFile)) {
            const mode = fs.readFileSync(prefFile, 'utf8').trim();
            if (['normal', 'ultra', 'quick'].includes(mode)) {
                return mode;
            }
        }
    } catch (e) {
        // Ignore errors
    }
    return 'normal';
});

ipcMain.handle('save-thinking-mode', (event, mode) => {
    const prefFile = path.join(__dirname, '..', '.thinking_mode_preference');
    try {
        fs.writeFileSync(prefFile, mode);
    } catch (e) {
        // Ignore errors
    }
});

ipcMain.handle('get-planning-mode', () => {
    const prefFile = path.join(__dirname, '..', '.planning_mode_preference');
    try {
        if (fs.existsSync(prefFile)) {
            const value = fs.readFileSync(prefFile, 'utf8').trim();
            return value === 'true';
        }
    } catch (e) {
        // Ignore errors
    }
    return false;
});

ipcMain.handle('save-planning-mode', (event, enabled) => {
    const prefFile = path.join(__dirname, '..', '.planning_mode_preference');
    try {
        fs.writeFileSync(prefFile, enabled.toString());
    } catch (e) {
        // Ignore errors
    }
});

// Create system tray
function createTray() {
    const icon = nativeImage.createFromDataURL(trayIconBase64);
    tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Dialog',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Queue Status',
            click: () => {
                const queueLength = wsServer ? wsServer.getQueueLength() : 0;
                const { dialog } = require('electron');
                dialog.showMessageBox({
                    type: 'info',
                    title: 'Queue Status',
                    message: `Requests in queue: ${queueLength}`
                });
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setToolTip('Claude Code Dialog');
    tray.setContextMenu(contextMenu);
    
    // Show window on tray click
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
}

// Initialize WebSocket server
async function initializeWebSocketServer() {
    wsServer = new DialogWebSocketServer();
    
    wsServer.on('showDialog', (request) => {
        dialogData = request.data;
        
        if (!mainWindow) {
            // Create window if it doesn't exist
            createWindow();
            mainWindow.once('ready-to-show', () => {
                mainWindow.webContents.send('new-request', request);
            });
        } else {
            mainWindow.webContents.send('new-request', request);
            mainWindow.show();
            mainWindow.focus();
        }
        
        // Update tray icon to show active state
        if (tray) {
            tray.setToolTip('Claude Code Dialog - Active Request');
        }
    });
    
    wsServer.on('requestQueued', (request) => {
        if (mainWindow) {
            mainWindow.webContents.send('request-queued', {
                queueLength: wsServer.getQueueLength()
            });
        }
    });
    
    wsServer.on('idle', () => {
        if (tray) {
            tray.setToolTip('Claude Code Dialog - Idle');
        }
    });
    
    try {
        await wsServer.start();
        console.log('WebSocket server started successfully');
    } catch (error) {
        console.error('Failed to start WebSocket server:', error);
    }
}

// Handle WebSocket response
ipcMain.handle('ws-response', (event, requestId, response) => {
    if (wsServer) {
        wsServer.sendResponse(requestId, response);
    }
});

// Performance optimizations for Windows
if (process.platform === 'win32') {
    // GPU acceleration
    app.commandLine.appendSwitch('enable-gpu-rasterization');
    app.commandLine.appendSwitch('enable-zero-copy');
    app.commandLine.appendSwitch('disable-gpu-vsync');
    app.commandLine.appendSwitch('disable-software-rasterizer');
    app.commandLine.appendSwitch('num-raster-threads', '4');
    
    // DPI awareness for Windows
    app.commandLine.appendSwitch('high-dpi-support', '1');
    app.commandLine.appendSwitch('force-device-scale-factor', '1');
    
    // Disable animations if system prefers reduced motion
    const { systemPreferences } = require('electron');
    if (systemPreferences.getAnimationSettings && systemPreferences.getAnimationSettings().prefersReducedMotion) {
        app.commandLine.appendSwitch('disable-smooth-scrolling');
    }
}

// App event handlers
app.whenReady().then(async () => {
    // Handle display changes (monitor added/removed) - must be after app is ready
    screen.on('display-added', () => {
        console.log('Display added, window state may need adjustment');
    });

    screen.on('display-removed', () => {
        console.log('Display removed, checking window position...');
        if (mainWindow && !mainWindow.isDestroyed()) {
            // Check if window is still visible
            const bounds = mainWindow.getBounds();
            const visible = screen.getAllDisplays().some(display => {
                const displayBounds = display.bounds;
                return bounds.x < displayBounds.x + displayBounds.width &&
                       bounds.x + bounds.width > displayBounds.x &&
                       bounds.y < displayBounds.y + displayBounds.height &&
                       bounds.y + bounds.height > displayBounds.y;
            });
            
            if (!visible) {
                // Window is not visible, move to primary display
                const primaryDisplay = screen.getPrimaryDisplay();
                const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
                const x = Math.round((screenWidth - bounds.width) / 2);
                const y = Math.round((screenHeight - bounds.height) / 2);
                mainWindow.setBounds({ x, y, width: bounds.width, height: bounds.height });
            }
        }
    });
    if (isPersistentMode) {
        createTray();
        await initializeWebSocketServer();
        
        // In persistent mode without initial data, just wait for WebSocket connections
        if (!dialogData) {
            console.log('Electron dialog running in persistent mode, waiting for connections...');
            // Don't create window immediately
            return;
        }
    }
    
    createWindow();
});

app.on('window-all-closed', () => {
    if (!isQuitting && tray) {
        // Keep app running in tray
        return;
    }
    app.quit();
});

app.on('before-quit', async () => {
    if (wsServer) {
        await wsServer.stop();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});