
import { useSettings } from '../../context/SettingsContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, updateSetting } = useSettings();

  return (
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <div className="settings-header">
        <h2>Settings</h2>
        <button className="icon-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div className="settings-content">
        <div className="setting-group">
          <label>Theme</label>
          <select 
            value={settings.theme}
            onChange={(e) => updateSetting('theme', e.target.value as 'light' | 'dark')}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label>Dialog Frequency</label>
          <select 
            value={settings.dialogFrequency}
            onChange={(e) => updateSetting('dialogFrequency', e.target.value as any)}
          >
            <option value="minimal">Minimal - Only critical decisions</option>
            <option value="low">Low - Important decisions only</option>
            <option value="normal">Normal - Balanced approach</option>
            <option value="high">High - Most decisions</option>
          </select>
          <p className="setting-description">Controls how often Claude asks for input</p>
        </div>
        
        <div className="setting-group">
          <label>Dialog Behavior</label>
          <div className="checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={settings.autoFocus}
                onChange={(e) => updateSetting('autoFocus', e.target.checked)}
              />
              <span>Auto-focus new dialogs</span>
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={settings.soundNotifications}
                onChange={(e) => updateSetting('soundNotifications', e.target.checked)}
              />
              <span>Sound notifications</span>
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={settings.minimizeOnResponse}
                onChange={(e) => updateSetting('minimizeOnResponse', e.target.checked)}
              />
              <span>Minimize after responding</span>
            </label>
          </div>
        </div>
        
        <div className="setting-group">
          <label>Stored Preferences</label>
          <div className="preference-stats">
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Saved Preferences</span>
            </div>
          </div>
          <button className="clear-preferences-btn">Clear All Preferences</button>
        </div>
        
        <div className="setting-group">
          <label>WebSocket Connection</label>
          <div className="connection-info">
            <div className="info-row">
              <span className="info-label">Port:</span>
              <span className="info-value">3030</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="info-value">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}