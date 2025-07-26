import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogResponse, DialogHistoryItem } from '../types';
import { wsClient } from '../utils/websocket';

interface DialogContextType {
  activeDialogs: Map<string, Dialog>;
  dialogHistory: DialogHistoryItem[];
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  addDialog: (dialog: Dialog) => void;
  removeDialog: (requestId: string) => void;
  sendResponse: (requestId: string, response: DialogResponse) => void;
  clearHistory: () => void;
  searchHistory: (term: string) => DialogHistoryItem[];
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [activeDialogs, setActiveDialogs] = useState<Map<string, Dialog>>(new Map());
  const [dialogHistory, setDialogHistory] = useState<DialogHistoryItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('claudePauseHistory');
    if (stored) {
      try {
        setDialogHistory(JSON.parse(stored));
      } catch (error) {
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('claudePauseHistory', JSON.stringify(dialogHistory));
  }, [dialogHistory]);

  // Handle dialog requests from WebSocket
  useEffect(() => {
    const handleDialogRequest = (dialog: Dialog) => {
      setActiveDialogs(prev => new Map(prev).set(dialog.requestId, dialog));
      setConnectionStatus('connected');
    };

    wsClient.onDialogRequest(handleDialogRequest);

    // Clear active dialogs on mount (refresh handling)
    setActiveDialogs(new Map());
    
    // Set initial connection status
    setConnectionStatus('connecting');
  }, []);

  const addDialog = useCallback((dialog: Dialog) => {
    setActiveDialogs(prev => new Map(prev).set(dialog.requestId, dialog));
  }, []);

  const removeDialog = useCallback((requestId: string) => {
    setActiveDialogs(prev => {
      const next = new Map(prev);
      next.delete(requestId);
      return next;
    });
  }, []);

  const sendResponse = useCallback((requestId: string, response: DialogResponse) => {
    const dialog = activeDialogs.get(requestId);
    if (!dialog) return;

    // Add to history
    const historyItem: DialogHistoryItem = {
      requestId,
      type: dialog.dialogType,
      parameters: dialog.parameters,
      response,
      timestamp: new Date().toISOString(),
    };
    setDialogHistory(prev => [...prev, historyItem]);

    // Send response via WebSocket
    wsClient.sendResponse(requestId, response);

    // Remove from active dialogs
    removeDialog(requestId);
  }, [activeDialogs, removeDialog]);

  const clearHistory = useCallback(() => {
    if (confirm('Are you sure you want to clear all dialog history?')) {
      setDialogHistory([]);
    }
  }, []);

  const searchHistory = useCallback((term: string) => {
    const lowerTerm = term.toLowerCase();
    return dialogHistory.filter(item => {
      const searchText = JSON.stringify(item).toLowerCase();
      return searchText.includes(lowerTerm);
    });
  }, [dialogHistory]);

  const value: DialogContextType = {
    activeDialogs,
    dialogHistory,
    connectionStatus,
    addDialog,
    removeDialog,
    sendResponse,
    clearHistory,
    searchHistory,
  };

  return (
    <DialogContext.Provider value={value}>
      {children}
    </DialogContext.Provider>
  );
}

export function useDialogs() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialogs must be used within DialogProvider');
  }
  return context;
}