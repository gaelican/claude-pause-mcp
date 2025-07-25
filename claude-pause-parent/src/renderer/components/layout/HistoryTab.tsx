import { useState } from 'react';
import { useDialogs } from '../../context/DialogContext';
import { DialogHistoryItem } from '../../types';

export default function HistoryTab() {
  const { dialogHistory, clearHistory, searchHistory } = useDialogs();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = searchTerm ? searchHistory(searchTerm) : dialogHistory;

  const formatResponse = (type: string, response: any): string => {
    if (response.cancelled) return 'Cancelled';
    if (response.switchToText) return 'Switched to text input';

    switch (type) {
      case 'planner':
        if (response.choice) return `Choice: ${response.choice}`;
        return response.additionalContext || 'No selection';
      case 'text_input':
        return response.text || 'No text entered';
      case 'single_choice':
        return response.choice || 'No selection';
      case 'multi_choice':
        return (response.choices || []).join(', ') || 'No selections';
      case 'confirm':
        return response.confirmed ? 'Yes' : 'No';
      case 'screenshot_request':
        const count = (response.images || []).length;
        return `${count} image${count !== 1 ? 's' : ''} uploaded`;
      default:
        return JSON.stringify(response);
    }
  };

  const getQuestionText = (item: DialogHistoryItem): string => {
    const params = item.parameters as any;
    switch (item.type) {
      case 'planner':
        return params.decision_context || 'Planning Decision';
      default:
        return params.question || item.type;
    }
  };

  if (filteredHistory.length === 0 && !searchTerm) {
    return (
      <div className="tab-pane" id="history-tab">
        <div className="history-container">
          <div className="history-controls">
            <input 
              type="text" 
              placeholder="Search history..." 
              className="history-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="clear-history-btn" onClick={clearHistory}>
              Clear History
            </button>
          </div>
          <div className="history-list">
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h2>No History Yet</h2>
              <p>Completed dialogs will appear here</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-pane" id="history-tab">
      <div className="history-container">
        <div className="history-controls">
          <input 
            type="text" 
            placeholder="Search history..." 
            className="history-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="clear-history-btn" onClick={clearHistory}>
            Clear History
          </button>
        </div>
        <div className="history-list">
          {filteredHistory.slice().reverse().map((item) => {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString();
            const dateStr = date.toLocaleDateString();

            return (
              <div key={item.requestId} className="history-item">
                <div className="history-item-header">
                  <span className="history-type">{item.type}</span>
                  <span className="history-timestamp">{dateStr} {timeStr}</span>
                </div>
                <div className="history-question">{getQuestionText(item)}</div>
                <div className="history-response">
                  <div className="history-response-label">Response:</div>
                  {formatResponse(item.type, item.response)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}