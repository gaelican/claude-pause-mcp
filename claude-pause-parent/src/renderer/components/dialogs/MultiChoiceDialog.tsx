import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DialogWrapper from '../common/DialogWrapper';
import MagicDialog from '../ui/MagicDialog';
import { useDialogs } from '../../context/DialogContext';
import { MultiChoiceParameters, MultiChoiceResponse } from '../../types';

interface MultiChoiceDialogProps {
  requestId: string;
  parameters: MultiChoiceParameters;
}

export default function MultiChoiceDialog({ requestId, parameters }: MultiChoiceDialogProps) {
  const { sendResponse } = useDialogs();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(parameters.options.filter(opt => opt.checked).map(opt => opt.value))
  );
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);

  const handleToggle = (value: string, disabled?: boolean) => {
    if (disabled) return;
    
    const newSelected = new Set(selected);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      if (parameters.maxSelections && newSelected.size >= parameters.maxSelections) {
        // Optionally show a message about max selections reached
        return;
      }
      newSelected.add(value);
    }
    setSelected(newSelected);
  };

  const handleSelectAll = () => {
    const enabledOptions = parameters.options.filter(opt => !opt.disabled);
    if (parameters.maxSelections) {
      setSelected(new Set(enabledOptions.slice(0, parameters.maxSelections).map(opt => opt.value)));
    } else {
      setSelected(new Set(enabledOptions.map(opt => opt.value)));
    }
  };

  const handleClearAll = () => {
    setSelected(new Set());
  };

  const handleSubmit = () => {
    const minRequired = parameters.minSelections || 0;
    if (selected.size < minRequired) return;
    
    const response: MultiChoiceResponse = {
      choices: Array.from(selected),
      timestamp: new Date().toISOString(),
    };
    sendResponse(requestId, response);
  };

  // Keyboard shortcut for select all
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      } else if (e.key === 'Enter' && selected.size >= (parameters.minSelections || 0)) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selected]);

  const isSubmitDisabled = selected.size < (parameters.minSelections || 0) || 
    (parameters.allowEmpty === false && selected.size === 0);

  // Group options if groups are provided
  const groupedOptions = parameters.options.reduce((acc, option) => {
    const group = option.group || 'default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {} as Record<string, typeof parameters.options>);

  return (
    <DialogWrapper requestId={requestId}>
      <MagicDialog className="multi-choice-dialog-magic">
        <div className="magic-dialog-header">
          <h2 className="magic-dialog-title">🎨 {parameters.question}</h2>
          {parameters.description && (
            <p className="magic-dialog-description">{parameters.description}</p>
          )}
        </div>

        {/* Selection info and actions */}
        <div className="multi-choice-header-magic">
          <div className="selection-info-magic">
            <motion.span 
              className="selection-count-magic"
              animate={{ scale: selected.size > 0 ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.2 }}
            >
              {selected.size} selected
            </motion.span>
            {parameters.minSelections && (
              <span className="selection-requirement">
                (min: {parameters.minSelections})
              </span>
            )}
            {parameters.maxSelections && (
              <span className="selection-requirement">
                (max: {parameters.maxSelections})
              </span>
            )}
          </div>
          
          <div className="multi-choice-actions-magic">
            <motion.button 
              className="action-btn-magic"
              onClick={handleSelectAll}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>📋</span>
              <span>Select All</span>
              <span className="shortcut">Ctrl+A</span>
            </motion.button>
            <motion.button 
              className="action-btn-magic clear"
              onClick={handleClearAll}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>🗑️</span>
              <span>Clear All</span>
            </motion.button>
          </div>
        </div>

        {/* Options */}
        <div className="multi-choice-options-magic">
          <AnimatePresence>
            {Object.entries(groupedOptions).map(([group, options], groupIndex) => (
              <motion.div 
                key={group}
                className="option-group-magic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
              >
                {group !== 'default' && (
                  <h3 className="group-title-magic">{group}</h3>
                )}
                
                <div className="options-list-magic">
                  {options.map((opt, i) => (
                    <motion.div
                      key={opt.value}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIndex * 0.1 + i * 0.05 }}
                      onMouseEnter={() => setHoveredValue(opt.value)}
                      onMouseLeave={() => setHoveredValue(null)}
                    >
                      <motion.div
                        className={`magic-multi-choice-card ${selected.has(opt.value) ? 'selected' : ''} ${opt.disabled ? 'disabled' : ''}`}
                        onClick={() => handleToggle(opt.value, opt.disabled)}
                        animate={{
                          x: hoveredValue === opt.value ? 8 : 0,
                          scale: selected.has(opt.value) ? 1.02 : 1
                        }}
                        transition={{ type: "spring", damping: 20 }}
                      >
                        <div className="choice-content-magic">
                          <div className={`magic-checkbox ${selected.has(opt.value) ? 'checked' : ''}`}>
                            <AnimatePresence>
                              {selected.has(opt.value) && (
                                <motion.div
                                  className="check-icon"
                                  initial={{ scale: 0, rotate: -30 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 30 }}
                                  transition={{ type: "spring", damping: 15 }}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                          
                          <div className="choice-text-magic">
                            <div className="choice-label-magic">
                              {opt.label}
                              {opt.tags && opt.tags.length > 0 && (
                                <div className="choice-tags-magic">
                                  {opt.tags.map(tag => (
                                    <span key={tag} className="tag-magic">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {opt.description && (
                              <p className="choice-description-magic">{opt.description}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
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
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            whileHover={{ scale: !isSubmitDisabled ? 1.02 : 1 }}
            whileTap={{ scale: !isSubmitDisabled ? 0.98 : 1 }}
          >
            Submit Selection{selected.size > 0 && ` (${selected.size})`}
          </motion.button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          Press Ctrl+A to select all, Enter to submit
        </div>
      </MagicDialog>
    </DialogWrapper>
  );
}