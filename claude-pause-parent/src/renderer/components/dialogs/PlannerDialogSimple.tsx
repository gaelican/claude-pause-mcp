import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DialogWrapper from '../common/DialogWrapper';
import MagicDialog from '../ui/MagicDialog';
import { useDialogs } from '../../context/DialogContext';
import { PlannerParameters, PlannerResponse } from '../../types';
import { renderMarkdown } from '../../utils/markdown';

interface PlannerDialogProps {
  requestId: string;
  parameters: PlannerParameters;
}

export default function PlannerDialog({ requestId, parameters }: PlannerDialogProps) {
  const { sendResponse } = useDialogs();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [thinkingMode, setThinkingMode] = useState('normal');
  const [attachments] = useState<{ data: string; type: string; name: string }[]>([]);
  const visualContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parameters.visual_output && visualContentRef.current) {
      visualContentRef.current.innerHTML = renderMarkdown(parameters.visual_output);
    }
  }, [parameters.visual_output]);

  const handleSubmit = () => {
    const response: PlannerResponse = {
      choice: selectedOption,
      thinkingMode,
      additionalContext: textInput,
      attachments,
      timestamp: new Date().toISOString(),
    };
    sendResponse(requestId, response);
  };

  const handleOptionClick = (value: string) => {
    setSelectedOption(value);
    // Auto-submit on selection if no text input
    if (!textInput) {
      const response: PlannerResponse = {
        choice: value,
        thinkingMode,
        additionalContext: '',
        attachments,
        timestamp: new Date().toISOString(),
      };
      sendResponse(requestId, response);
    }
  };

  return (
    <DialogWrapper 
      requestId={requestId}
      onSwitchToText={() => {/* Handle switch to text */}}
    >
      <MagicDialog className="planner-dialog-magic planner-grid-layout">
        <div className="planner-header-magic">
          <motion.h2 
            className="magic-dialog-title text-3xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🌟 Decision Required
          </motion.h2>
          
          <div className="thinking-mode-magic">
            <AnimatePresence>
              {['quick', 'normal', 'deep', 'ultra'].map((mode, i) => (
                <motion.button
                  key={mode}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`mode-btn-magic ${thinkingMode === mode ? 'active' : ''}`}
                  onClick={() => setThinkingMode(mode)}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="mode-icon">
                    {mode === 'quick' ? '⚡' : mode === 'normal' ? '🎯' : mode === 'deep' ? '🧠' : '💎'}
                  </span>
                  <span className="mode-letter">{mode[0].toUpperCase()}</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="planner-grid-container">
          {/* Top Left - Plan */}
          <motion.div 
            className="planner-plan-magic grid-top-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="section-title-magic">📋 Plan</h3>
            <div className="plan-content-magic">
              {parameters.plan ? (
                <div className="plan-text">{parameters.plan}</div>
              ) : (
                <div className="plan-placeholder">No plan provided</div>
              )}
            </div>
          </motion.div>

          {/* Top Right - Details (Context + Visual Output) */}
          <motion.div 
            className="planner-visual-magic grid-top-right"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="section-title-magic">📝 Details</h3>
            <div className="details-container">
              <div className="context-section">
                <p className="text-gray-300">{parameters.decision_context}</p>
              </div>
              {parameters.visual_output && (
                <div className="visual-output-section">
                  <div ref={visualContentRef} className="markdown-content-magic" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Bottom Left - Options */}
          {parameters.options && parameters.options.length > 0 && (
            <div className="planner-options-magic grid-bottom-left">
              <h3 className="section-title-magic">Options</h3>
              <AnimatePresence>
                {parameters.options.map((option, i) => (
                  <motion.div
                    key={option.value}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  >
                    <motion.button
                      className={`magic-choice-card planner-option-magic ${selectedOption === option.value ? 'selected' : ''}`}
                      onClick={() => handleOptionClick(option.value)}
                      whileHover={{ x: 8 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="option-content">
                        <span className="option-label-magic">{option.label}</span>
                        {option.description && (
                          <span className="option-description-magic">{option.description}</span>
                        )}
                      </div>
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Bottom Right - Text Input */}
          <motion.div 
            className="planner-input-magic grid-bottom-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="section-title-magic">Your Input</h3>
            <div className="input-row-magic">
              <textarea
                className="magic-textarea planner-textarea"
                placeholder="Additional context or clarification (optional)"
                rows={3}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <motion.button 
                className="attachment-btn-magic"
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
              >
                📎
              </motion.button>
            </div>
          </motion.div>
        </div>

        <div className="magic-dialog-actions planner-actions-magic">
          <button 
            className="magic-button magic-button-secondary"
            onClick={() => sendResponse(requestId, { cancelled: true, timestamp: new Date().toISOString() })}
          >
            Cancel
          </button>
          <button className="magic-button magic-button-secondary">
            Switch to Text
          </button>
          <motion.button 
            className="magic-button magic-button-primary"
            onClick={handleSubmit}
            disabled={!selectedOption && !textInput}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Submit
            {thinkingMode === 'ultra' && <span className="ml-2">💎</span>}
          </motion.button>
        </div>
      </MagicDialog>
    </DialogWrapper>
  );
}