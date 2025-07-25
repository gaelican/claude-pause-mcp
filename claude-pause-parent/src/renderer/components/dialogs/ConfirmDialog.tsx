import { useEffect } from 'react';
import { motion } from 'framer-motion';
import DialogWrapper from '../common/DialogWrapper';
import MagicDialog from '../ui/MagicDialog';
import { useDialogs } from '../../context/DialogContext';
import { ConfirmParameters, ConfirmResponse } from '../../types';

interface ConfirmDialogProps {
  requestId: string;
  parameters: ConfirmParameters;
}

export default function ConfirmDialog({ requestId, parameters }: ConfirmDialogProps) {
  const { sendResponse } = useDialogs();

  const handleConfirm = (confirmed: boolean) => {
    const response: ConfirmResponse = {
      confirmed,
      timestamp: new Date().toISOString(),
    };
    sendResponse(requestId, response);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') {
        handleConfirm(true);
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        handleConfirm(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const isDangerous = parameters.isDangerous;

  return (
    <DialogWrapper requestId={requestId}>
      <MagicDialog>
        {/* Icon */}
        <motion.div 
          className="magic-confirm-icon mx-auto mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <div className={`magic-confirm-icon-${isDangerous ? 'danger' : 'warning'} flex items-center justify-center`}>
            {isDangerous ? '⚠️' : '❓'}
          </div>
        </motion.div>

        <div className="magic-dialog-header">
          <h2 className="magic-dialog-title">
            {parameters.title || (isDangerous ? '⚡ Dangerous Action' : '🤔 Confirmation Required')}
          </h2>
          <p className="magic-dialog-description text-lg mt-3">
            {parameters.question}
          </p>
          {parameters.description && (
            <p className="magic-dialog-description mt-2">
              {parameters.description}
            </p>
          )}
        </div>

        {parameters.warning && (
          <motion.div 
            className="mt-6 p-4 rounded-lg border"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-red-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>{parameters.warning}</span>
            </p>
          </motion.div>
        )}

        <div className="magic-dialog-actions mt-8">
          <motion.button 
            className={`magic-button ${parameters.defaultToNo ? 'magic-button-primary' : 'magic-button-secondary'}`}
            onClick={() => handleConfirm(false)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            autoFocus={parameters.defaultToNo}
          >
            {parameters.noLabel || 'No'}
            <span className="ml-2 text-xs opacity-60">(N)</span>
          </motion.button>
          
          <motion.button 
            className={`magic-button ${isDangerous ? 'magic-button-danger' : 'magic-button-primary'} ${parameters.defaultToNo ? '' : ''}`}
            onClick={() => handleConfirm(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            autoFocus={!parameters.defaultToNo}
          >
            {parameters.yesLabel || 'Yes'}
            <span className="ml-2 text-xs opacity-60">(Y)</span>
          </motion.button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          Press Y for Yes, N for No, or Escape to cancel
        </div>
      </MagicDialog>
    </DialogWrapper>
  );
}