import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Settings } from '../types';

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  theme: 'dark',
  dialogFrequency: 'normal',
  autoFocus: true,
  soundNotifications: false,
  minimizeOnResponse: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('claudePauseSettings');
    if (stored) {
      try {
        const loaded = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...loaded });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('claudePauseSettings', JSON.stringify(settings));
    
    // Apply theme
    if (settings.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    
    // Send to MCP if needed
    if (key === 'dialogFrequency') {
      // TODO: Send frequency update to MCP via WebSocket
    }
  }, []);

  const resetSettings = useCallback(() => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(defaultSettings);
    }
  }, []);

  const value: SettingsContextType = {
    settings,
    updateSetting,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}