import { useDialogs } from '../../context/DialogContext';
import { DialogResponse } from '../../types';

interface DialogWrapperProps {
  requestId: string;
  children: React.ReactNode;
  onCancel?: () => void;
  onSwitchToText?: () => void;
}

export default function DialogWrapper({ 
  requestId, 
  children,
  onCancel,
  onSwitchToText 
}: DialogWrapperProps) {
  const { sendResponse } = useDialogs();

  const handleCancel = () => {
    const response: DialogResponse = {
      cancelled: true,
      timestamp: new Date().toISOString(),
    };
    sendResponse(requestId, response);
    onCancel?.();
  };

  const handleSwitchToText = () => {
    const response: DialogResponse = {
      switchToText: true,
      timestamp: new Date().toISOString(),
    };
    sendResponse(requestId, response);
    onSwitchToText?.();
  };

  return (
    <div className="component-wrapper">
      {children}
      <div className="dialog-common-actions">
        <button className="dialog-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button className="dialog-switch-text" onClick={handleSwitchToText}>
          Switch to Text Input
        </button>
      </div>
    </div>
  );
}