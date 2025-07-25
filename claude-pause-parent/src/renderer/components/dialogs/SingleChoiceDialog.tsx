import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DialogWrapper from '../common/DialogWrapper';
import MagicDialog from '../ui/MagicDialog';
import { useDialogs } from '../../context/DialogContext';
import { SingleChoiceParameters, SingleChoiceResponse } from '../../types';

interface SingleChoiceDialogProps {
  requestId: string;
  parameters: SingleChoiceParameters;
}

export default function SingleChoiceDialog({ requestId, parameters }: SingleChoiceDialogProps) {
  const { sendResponse } = useDialogs();
  const [selected, setSelected] = useState<string | null>(parameters.defaultValue || null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selected) {
      const response: SingleChoiceResponse = {
        choice: selected,
        timestamp: new Date().toISOString(),
      };
      sendResponse(requestId, response);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    const key = parseInt(e.key);
    if (key >= 1 && key <= parameters.options.length) {
      const option = parameters.options[key - 1];
      if (!option.disabled) {
        setSelected(option.value);
      }
    } else if (e.key === 'Enter' && selected) {
      handleSubmit();
    }
  };

  // Add keyboard listener
  useState(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  });

  return (
    <DialogWrapper requestId={requestId}>
      <MagicDialog>
        <div className="magic-dialog-header">
          <h2 className="magic-dialog-title">🎯 {parameters.question}</h2>
          {parameters.description && (
            <p className="magic-dialog-description">{parameters.description}</p>
          )}
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {parameters.options.map((opt, i) => (
              <motion.div
                key={opt.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className={`magic-choice-card ${selected === opt.value ? 'selected' : ''} ${opt.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => !opt.disabled && setSelected(opt.value)}
                >
                  <div className="magic-choice-label">
                    <div className={`magic-radio ${selected === opt.value ? 'checked' : ''}`} />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <motion.span 
                          className="text-sm font-semibold px-2 py-1 rounded-md"
                          style={{
                            background: hoveredIndex === i 
                              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.15))'
                              : 'rgba(148, 163, 184, 0.1)'
                          }}
                          animate={{
                            scale: hoveredIndex === i ? 1.05 : 1,
                          }}
                        >
                          {i + 1}
                        </motion.span>
                        <span className="font-medium">{opt.label}</span>
                      </div>
                      {opt.description && (
                        <p className="magic-choice-description mt-1 ml-12">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="magic-dialog-actions">
          <button 
            className="magic-button magic-button-secondary"
            onClick={() => sendResponse(requestId, { cancelled: true, timestamp: new Date().toISOString() })}
          >
            Cancel
          </button>
          <motion.button 
            className="magic-button magic-button-primary"
            disabled={!selected}
            onClick={handleSubmit}
            whileHover={{ scale: selected ? 1.02 : 1 }}
            whileTap={{ scale: selected ? 0.98 : 1 }}
          >
            Submit Selection
          </motion.button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          Press number keys (1-{parameters.options.length}) for quick selection
        </div>
      </MagicDialog>
    </DialogWrapper>
  );
}