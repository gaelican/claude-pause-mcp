
import { motion } from 'framer-motion';
import { useDialogs } from '../../context/DialogContext';

export default function StatusBar() {
  const { activeDialogs, dialogHistory, connectionStatus } = useDialogs();

  const statusEmoji = connectionStatus === 'connected' ? '✅' : 
                     connectionStatus === 'connecting' ? '🔄' : '❌';

  return (
    <motion.div 
      className="status-bar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <motion.div 
        className="status-item"
        whileHover={{ scale: 1.05 }}
      >
        <span className={`status-indicator ${connectionStatus}`}></span>
        <span className="status-text">
          {statusEmoji} MCP {connectionStatus}
        </span>
      </motion.div>
      <motion.div 
        className="status-item"
        whileHover={{ scale: 1.05 }}
      >
        <span className="active-count">{activeDialogs.size}</span>
        <span className="status-text">Active</span>
      </motion.div>
      <motion.div 
        className="status-item"
        whileHover={{ scale: 1.05 }}
      >
        <span className="history-count">{dialogHistory.length}</span>
        <span className="status-text">History</span>
      </motion.div>
    </motion.div>
  );
}