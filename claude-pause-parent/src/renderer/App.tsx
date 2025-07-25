import { useState } from 'react';
import { DialogProvider } from './context/DialogContext';
import { SettingsProvider } from './context/SettingsContext';
import Header from './components/layout/Header';
import StatusBar from './components/layout/StatusBar';
import TabNavigation from './components/layout/TabNavigation';
import SettingsPanel from './components/layout/SettingsPanel';
import ActiveDialogsTab from './components/layout/ActiveDialogsTab';
import HistoryTab from './components/layout/HistoryTab';
import ParticleBackground from './components/effects/ParticleBackground';
import AuroraBackground from './components/effects/AuroraBackground';
import './styles/app.css';
import './styles/magic-ui.css';
import './styles/planner-magic.css';
import './styles/magic-dialogs.css';

function App() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  return (
    <SettingsProvider>
      <DialogProvider>
        <div id="app">
          <ParticleBackground />
          <AuroraBackground />
          
          <Header 
            onSettingsClick={() => setSettingsPanelOpen(true)}
          />
          
          <main className="app-main">
            <StatusBar />
            
            <TabNavigation 
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            
            <div className="tab-content">
              {activeTab === 'active' ? (
                <ActiveDialogsTab />
              ) : (
                <HistoryTab />
              )}
            </div>
          </main>
          
          <SettingsPanel 
            isOpen={settingsPanelOpen}
            onClose={() => setSettingsPanelOpen(false)}
          />
        </div>
      </DialogProvider>
    </SettingsProvider>
  );
}

export default App;