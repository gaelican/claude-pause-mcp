
import { motion } from 'framer-motion';
import { electronAPI } from '../../utils/electronBridge';

interface HeaderProps {
  onSettingsClick: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-content">
        <motion.h1 
          className="app-title"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          🌟 Claude Pause
        </motion.h1>
        <div className="header-actions">
          <motion.button 
            className="icon-btn" 
            title="Settings"
            onClick={onSettingsClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m16.65 5.65l-4.24-4.24M7.59 7.59L3.35 3.35m0 17.3l4.24-4.24m9.82 0l4.24 4.24"></path>
            </svg>
          </motion.button>
          <motion.button 
            className="icon-btn" 
            title="Minimize"
            onClick={() => electronAPI.minimizeWindow()}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </motion.button>
          <motion.button 
            className="icon-btn close-btn" 
            title="Close"
            onClick={() => electronAPI.closeWindow()}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </motion.button>
        </div>
      </div>
    </header>
  );
}