const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog handling
  onDialogRequest: (callback) => {
    ipcRenderer.on('dialog-request', (event, data) => callback(data));
  },
  sendDialogResponse: (response) => {
    return ipcRenderer.invoke('dialog-response', response);
  },
  
  // Settings
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback);
  },
  
  // MCP messages
  onMCPMessage: (callback) => {
    ipcRenderer.on('mcp-message', (event, data) => callback(data));
  },
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window')
});