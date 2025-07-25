
import { motion, AnimatePresence } from 'framer-motion';
import { useDialogs } from '../../context/DialogContext';
import PlannerDialog from '../dialogs/PlannerDialogSimple';
import TextInputDialog from '../dialogs/TextInputDialog';
import SingleChoiceDialog from '../dialogs/SingleChoiceDialog';
import MultiChoiceDialog from '../dialogs/MultiChoiceDialog';
import ScreenshotDialog from '../dialogs/ScreenshotDialog';
import ConfirmDialog from '../dialogs/ConfirmDialog';

export default function ActiveDialogsTab() {
  const { activeDialogs } = useDialogs();

  const renderDialog = (dialog: any) => {
    const props = {
      key: dialog.requestId,
      requestId: dialog.requestId,
      parameters: dialog.parameters,
    };

    switch (dialog.dialogType) {
      case 'planner':
        return <PlannerDialog {...props} />;
      case 'text_input':
        return <TextInputDialog {...props} />;
      case 'single_choice':
        return <SingleChoiceDialog {...props} />;
      case 'multi_choice':
        return <MultiChoiceDialog {...props} />;
      case 'screenshot_request':
        return <ScreenshotDialog {...props} />;
      case 'confirm':
        return <ConfirmDialog {...props} />;
      default:
        return null;
    }
  };

  if (activeDialogs.size === 0) {
    return (
      <div className="magic-content-container">
        <div className="empty-state">
          <motion.div 
            className="empty-icon"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, duration: 0.6 }}
          >
            💬
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            No Active Dialogs
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Dialog requests from Claude will appear here
          </motion.p>
          <motion.div 
            className="empty-state-graphic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: 0.4 }}
          >
            <svg width="400" height="300" viewBox="0 0 400 300" fill="none">
              <path d="M50 150 Q 200 50 350 150" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="5,5" opacity="0.5" />
              <circle cx="50" cy="150" r="5" fill="#60a5fa" />
              <circle cx="350" cy="150" r="5" fill="#a78bfa" />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </div>
      </div>
    );
  }

  // Stack layout for better space efficiency
  return (
    <div className="magic-content-container">
      <div className="dialogs-stack">
        <AnimatePresence mode="popLayout">
          {Array.from(activeDialogs.values()).map((dialog, index) => (
            <motion.div
              key={dialog.requestId}
              className="dialog-stack-item"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: { delay: index * 0.1 }
              }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              layout
            >
              {renderDialog(dialog)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}