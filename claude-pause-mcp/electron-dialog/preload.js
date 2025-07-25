const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getDialogData: () => ipcRenderer.invoke('get-dialog-data'),
    submitResponse: (response, mode, data) => ipcRenderer.invoke('submit-response', response, mode, data),
    cancelDialog: () => ipcRenderer.invoke('cancel-dialog'),
    getThinkingMode: () => ipcRenderer.invoke('get-thinking-mode'),
    saveThinkingMode: (mode) => ipcRenderer.invoke('save-thinking-mode', mode),
    getPlanningMode: () => ipcRenderer.invoke('get-planning-mode'),
    savePlanningMode: (enabled) => ipcRenderer.invoke('save-planning-mode', enabled),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    savePosition: () => ipcRenderer.invoke('save-position'),
    resetPosition: () => ipcRenderer.invoke('reset-position'),
    
    // WebSocket event listeners
    onNewRequest: (callback) => ipcRenderer.on('new-request', (event, data) => callback(data)),
    onRequestQueued: (callback) => ipcRenderer.on('request-queued', (event, data) => callback(data)),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});