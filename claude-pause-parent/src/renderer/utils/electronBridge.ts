import { ElectronAPI } from '../types';

// Type-safe wrapper for Electron API
export const electronAPI: ElectronAPI = (window as any).electronAPI || {
  onDialogRequest: () => {},
  sendDialogResponse: () => Promise.resolve(),
  onOpenSettings: () => {},
  onMCPMessage: () => {},
  minimizeWindow: () => {},
  maximizeWindow: () => {},
  closeWindow: () => {},
};

// Helper to check if we're in Electron
export const isElectron = () => {
  return !!(window as any).electronAPI;
};