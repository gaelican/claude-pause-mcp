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

  const handlePlan = () => {
    const planningInstructions = '\n\nIMPORTANT: Please ONLY provide a detailed plan for this task. Do NOT make any modifications or implementations. Present your plan and wait for approval.';
    const response: PlannerResponse = {
      choice: selectedOption,
      thinkingMode,
      additionalContext: textInput + planningInstructions,
      attachments,
      timestamp: new Date().toISOString(),
    };
    sendResponse(requestId, response);
  };

  const handleExecute = () => {
    const response: PlannerResponse = {
      choice: selectedOption,
      thinkingMode,
      additionalContext: textInput,
      attachments,
      timestamp: new Date().toISOString(),
    };
    sendResponse(requestId, response);
  };

  const handleSubmitAndReopen = () => {
    const reopenInstructions = '\n\nWhen you complete this task, please reopen the planner dialog (pause_for_input) to ask what to do next.';
    const response: PlannerResponse = {
      choice: selectedOption,
      thinkingMode,
      additionalContext: textInput + reopenInstructions,
      attachments,
      timestamp: new Date().toISOString(),
    };
    sendResponse(requestId, response);
  };

  const handleOptionClick = (value: string) => {
    setSelectedOption(value);
    // Don't auto-submit anymore - let user choose which button to use
  };

  return (
    <DialogWrapper 
      requestId={requestId}
      onSwitchToText={() => {/* Handle switch to text */}}
    >
      <MagicDialog className="planner-dialog-magic">
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
                  data-mode={mode}
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

        <motion.div 
          className="planner-context-magic"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-gray-300">{parameters.decision_context}</p>
        </motion.div>

        {parameters.visual_output && (
          <motion.div 
            className="planner-visual-magic"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div ref={visualContentRef} className="markdown-content-magic" />
          </motion.div>
        )}

        <motion.div 
          className="planner-input-magic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
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

        {parameters.options && parameters.options.length > 0 && (
          <div className="planner-options-magic">
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

        <div className="magic-dialog-actions planner-actions-magic">
          <motion.button 
            className="magic-button magic-button-plan"
            onClick={handlePlan}
            disabled={!selectedOption && !textInput}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Plan
            <span className="ml-2">📋</span>
          </motion.button>
          <motion.button 
            className="magic-button magic-button-primary"
            onClick={handleExecute}
            disabled={!selectedOption && !textInput}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Execute
            {thinkingMode === 'ultra' && <span className="ml-2">💎</span>}
          </motion.button>
          <motion.button 
            className="magic-button magic-button-reopen"
            onClick={handleSubmitAndReopen}
            disabled={!selectedOption && !textInput}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Submit and Reopen
            <span className="ml-2">🔄</span>
          </motion.button>
        </div>
      </MagicDialog>
    </DialogWrapper>
  );
}