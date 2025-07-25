import { useState } from 'react';
import { motion } from 'framer-motion';
import DialogWrapper from '../common/DialogWrapper';
import MagicDialog from '../ui/MagicDialog';
import { useDialogs } from '../../context/DialogContext';
import { TextInputParameters, TextInputResponse } from '../../types';

interface TextInputDialogProps {
  requestId: string;
  parameters: TextInputParameters;
}

export default function TextInputDialog({ requestId, parameters }: TextInputDialogProps) {
  const { sendResponse } = useDialogs();
  const [text, setText] = useState(parameters.defaultText || '');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (!parameters.required || text.trim()) {
      const response: TextInputResponse = {
        text,
        timestamp: new Date().toISOString(),
      };
      sendResponse(requestId, response);
    }
  };

  const maxLength = parameters.maxLength || 10000;
  const charPercentage = (text.length / maxLength) * 100;

  return (
    <DialogWrapper requestId={requestId}>
      <MagicDialog>
        <div className="magic-dialog-header">
          <h2 className="magic-dialog-title">✨ {parameters.question}</h2>
          {parameters.description && (
            <p className="magic-dialog-description">{parameters.description}</p>
          )}
        </div>

        <div className="relative">
          <textarea 
            className="magic-textarea"
            placeholder={parameters.placeholder || 'Enter your response...'}
            maxLength={maxLength}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={parameters.expectsCode ? 8 : 4}
            style={{ fontFamily: parameters.expectsCode ? 'monospace' : 'inherit' }}
          />
          
          {/* Character count indicator */}
          <motion.div 
            className="absolute bottom-2 right-2 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: isFocused ? 1 : 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  background: charPercentage > 90 
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : charPercentage > 70
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                }}
                animate={{ width: `${charPercentage}%` }}
                transition={{ type: "spring", damping: 20 }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {text.length}/{maxLength}
            </span>
          </motion.div>
        </div>

        <div className="magic-dialog-actions">
          <button 
            className="magic-button magic-button-secondary"
            onClick={() => sendResponse(requestId, { cancelled: true, timestamp: new Date().toISOString() })}
          >
            Cancel
          </button>
          <button 
            className="magic-button magic-button-primary"
            onClick={handleSubmit}
            disabled={parameters.required && !text.trim()}
          >
            Submit
            <span className="ml-2 text-xs opacity-60">(Ctrl+Enter)</span>
          </button>
        </div>
      </MagicDialog>
    </DialogWrapper>
  );
}