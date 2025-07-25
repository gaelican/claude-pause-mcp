// Renderer process for Claude Pause parent application

// Configure marked with syntax highlighting
if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (err) {}
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
  });
}

// Markdown rendering helper
function renderMarkdown(text) {
  if (typeof marked === 'undefined') {
    return text;
  }
  
  // Parse markdown
  let html = marked.parse(text);
  
  // Add copy buttons to code blocks
  html = html.replace(/<pre><code/g, '<div class="code-block-wrapper"><button class="copy-code-btn" onclick="copyCode(this)">Copy</button><pre><code');
  html = html.replace(/<\/code><\/pre>/g, '</code></pre></div>');
  
  return html;
}

// Copy code function
window.copyCode = function(button) {
  const codeBlock = button.nextElementSibling.querySelector('code');
  const text = codeBlock.textContent;
  
  navigator.clipboard.writeText(text).then(() => {
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
  });
};

class DialogManager {
  constructor() {
    this.activeDialogs = new Map();
    this.dialogHistory = [];
    this.components = new Map();
    this.initializeEventListeners();
    this.setupMCPHandlers();
    this.updateConnectionStatus('disconnected');
    this.loadHistory();
    this.clearActiveDialogs();
  }

  initializeEventListeners() {
    // Window controls
    document.getElementById('minimize-btn').addEventListener('click', () => {
      window.electronAPI.minimizeWindow();
    });

    // Settings
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettings = document.getElementById('close-settings');

    settingsBtn.addEventListener('click', () => {
      settingsPanel.classList.add('open');
      this.loadSettings();
    });

    closeSettings.addEventListener('click', () => {
      settingsPanel.classList.remove('open');
    });

    // Settings controls
    document.getElementById('theme-select').addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
      this.saveSettings();
    });
    
    document.getElementById('dialog-frequency').addEventListener('change', (e) => {
      this.updateDialogFrequency(e.target.value);
      this.saveSettings();
    });
    
    document.getElementById('auto-focus').addEventListener('change', () => {
      this.saveSettings();
    });
    
    document.getElementById('sound-notifications').addEventListener('change', () => {
      this.saveSettings();
    });
    
    document.getElementById('minimize-on-response').addEventListener('change', () => {
      this.saveSettings();
    });
    
    document.getElementById('clear-preferences').addEventListener('click', () => {
      this.clearStoredPreferences();
    });
    
    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });
    
    // History controls
    document.getElementById('clear-history').addEventListener('click', () => {
      this.clearHistory();
    });
    
    document.getElementById('history-search').addEventListener('input', (e) => {
      this.filterHistory(e.target.value);
    });
    
    // Load settings on startup
    this.loadSettings();
  }

  setupMCPHandlers() {
    // Handle dialog requests
    window.electronAPI.onDialogRequest((data) => {
      console.log('Dialog request received:', data);
      this.handleDialogRequest(data);
    });

    // Handle MCP messages
    window.electronAPI.onMCPMessage((data) => {
      console.log('MCP message received:', data);
      if (data.type === 'connection_status') {
        this.updateConnectionStatus(data.status);
      } else if (data.type === 'preference_count') {
        document.getElementById('stored-preferences').textContent = data.count || 0;
      } else if (data.type === 'settings_confirmed') {
        // Settings successfully updated
        if (data.setting === 'dialog_frequency') {
          this.showNotification('Dialog frequency updated');
        }
      }
    });

    // Handle settings
    window.electronAPI.onOpenSettings(() => {
      document.getElementById('settings-panel').classList.add('open');
    });
  }

  handleDialogRequest(data) {
    const { requestId, dialogType, parameters } = data;
    
    // Hide empty state
    document.getElementById('empty-state').style.display = 'none';
    
    // Create native component based on dialog type
    const component = this.createNativeComponent(dialogType, parameters);
    
    if (component) {
      // Store active dialog
      this.activeDialogs.set(requestId, {
        type: dialogType,
        component: component,
        data: parameters
      });
      
      // Update active count
      this.updateActiveCount();
      
      // Setup response handler
      component.onResponse = (response) => {
        // Store in history
        this.addToHistory({
          requestId: requestId,
          type: dialogType,
          parameters: parameters,
          response: response,
          timestamp: new Date().toISOString()
        });
        
        this.sendDialogResponse(requestId, response);
        this.removeDialog(requestId);
        
        // Check if minimize on response is enabled
        if (document.getElementById('minimize-on-response') && 
            document.getElementById('minimize-on-response').checked) {
          window.electronAPI.minimizeWindow();
        }
      };
      
      // Add to container
      const container = document.getElementById('dialog-container');
      container.appendChild(component.element);
      
      // Focus if enabled
      if (document.getElementById('auto-focus').checked) {
        component.focus();
      }
    }
  }

  createNativeComponent(dialogType, parameters) {
    switch (dialogType) {
      case 'planner':
        return new PlannerComponent(parameters);
      case 'text_input':
        return new TextInputComponent(parameters);
      case 'single_choice':
        return new SingleChoiceComponent(parameters);
      case 'multi_choice':
        return new MultiChoiceComponent(parameters);
      case 'screenshot_request':
        return new ScreenshotRequestComponent(parameters);
      case 'confirm':
        return new ConfirmComponent(parameters);
      default:
        console.warn('Unknown dialog type:', dialogType);
        return null;
    }
  }

  sendDialogResponse(requestId, response) {
    window.electronAPI.sendDialogResponse({
      requestId: requestId,
      data: response
    });
  }

  removeDialog(requestId) {
    const dialog = this.activeDialogs.get(requestId);
    if (dialog) {
      // Remove from DOM
      if (dialog.component && dialog.component.element) {
        dialog.component.element.remove();
      }
      
      // Remove from active dialogs map
      this.activeDialogs.delete(requestId);
      this.updateActiveCount();
      
      // Show empty state if no dialogs
      if (this.activeDialogs.size === 0) {
        document.getElementById('empty-state').style.display = 'flex';
      }
    }
  }

  updateActiveCount() {
    document.getElementById('active-dialogs').textContent = this.activeDialogs.size;
  }
  
  clearActiveDialogs() {
    // Clear the dialog container
    const container = document.getElementById('dialog-container');
    const emptyState = document.getElementById('empty-state');
    
    // Remove all dialog elements except empty state
    Array.from(container.children).forEach(child => {
      if (child.id !== 'empty-state' && child.classList.contains('component-wrapper')) {
        child.remove();
      }
    });
    
    // Clear the map
    this.activeDialogs.clear();
    
    // Update count and show empty state
    this.updateActiveCount();
    emptyState.style.display = 'flex';
  }

  updateConnectionStatus(status) {
    const indicator = document.getElementById('connection-status');
    indicator.className = 'status-indicator';
    
    switch (status) {
      case 'connected':
        indicator.classList.add('connected');
        break;
      case 'connecting':
        indicator.classList.add('connecting');
        break;
      default:
        // disconnected state (default red)
        break;
    }
  }

  applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }
  
  saveSettings() {
    const settings = {
      theme: document.getElementById('theme-select').value,
      dialogFrequency: document.getElementById('dialog-frequency').value,
      autoFocus: document.getElementById('auto-focus').checked,
      soundNotifications: document.getElementById('sound-notifications').checked,
      minimizeOnResponse: document.getElementById('minimize-on-response').checked
    };
    
    localStorage.setItem('claudePauseSettings', JSON.stringify(settings));
    
    // Send to MCP if connected
    this.sendSettingsToMCP(settings);
  }
  
  loadSettings() {
    const stored = localStorage.getItem('claudePauseSettings');
    if (stored) {
      const settings = JSON.parse(stored);
      
      // Apply settings to UI
      document.getElementById('theme-select').value = settings.theme || 'dark';
      document.getElementById('dialog-frequency').value = settings.dialogFrequency || 'normal';
      document.getElementById('auto-focus').checked = settings.autoFocus !== false;
      document.getElementById('sound-notifications').checked = settings.soundNotifications || false;
      document.getElementById('minimize-on-response').checked = settings.minimizeOnResponse || false;
      
      // Apply theme
      this.applyTheme(settings.theme || 'dark');
    }
    
    // Update preference count
    this.updatePreferenceCount();
  }
  
  updateDialogFrequency(frequency) {
    // Send frequency update to MCP
    this.sendToMCP({
      type: 'settings_update',
      setting: 'dialog_frequency',
      value: frequency
    });
  }
  
  clearStoredPreferences() {
    if (confirm('Are you sure you want to clear all stored preferences?')) {
      // Clear MCP preferences
      this.sendToMCP({
        type: 'clear_preferences'
      });
      
      // Update UI
      this.updatePreferenceCount();
    }
  }
  
  updatePreferenceCount() {
    // Request preference count from MCP
    this.sendToMCP({
      type: 'get_preference_count'
    });
  }
  
  sendSettingsToMCP(settings) {
    this.sendToMCP({
      type: 'settings_update',
      settings: settings
    });
  }
  
  sendToMCP(message) {
    // Send message through WebSocket if available
    if (window.mcpWebSocket && window.mcpWebSocket.readyState === WebSocket.OPEN) {
      window.mcpWebSocket.send(JSON.stringify(message));
    }
  }
  
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Tab management
  switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });
  }
  
  // History management
  addToHistory(dialogData) {
    this.dialogHistory.push(dialogData);
    this.saveHistory();
    this.renderHistory();
    this.updateHistoryCount();
  }
  
  loadHistory() {
    const stored = localStorage.getItem('claudePauseHistory');
    if (stored) {
      this.dialogHistory = JSON.parse(stored);
      this.renderHistory();
      this.updateHistoryCount();
    }
  }
  
  saveHistory() {
    localStorage.setItem('claudePauseHistory', JSON.stringify(this.dialogHistory));
  }
  
  clearHistory() {
    if (confirm('Are you sure you want to clear all dialog history?')) {
      this.dialogHistory = [];
      this.saveHistory();
      this.renderHistory();
      this.updateHistoryCount();
    }
  }
  
  updateHistoryCount() {
    document.getElementById('history-count').textContent = this.dialogHistory.length;
  }
  
  renderHistory() {
    const historyList = document.getElementById('history-list');
    
    if (this.dialogHistory.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h2>No History Yet</h2>
          <p>Completed dialogs will appear here</p>
        </div>
      `;
      return;
    }
    
    // Render history items in reverse chronological order
    historyList.innerHTML = this.dialogHistory
      .slice()
      .reverse()
      .map(item => this.renderHistoryItem(item))
      .join('');
  }
  
  renderHistoryItem(item) {
    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleTimeString();
    const dateStr = date.toLocaleDateString();
    
    let responseText = this.formatResponse(item.type, item.response);
    let question = this.getQuestionText(item.type, item.parameters);
    
    return `
      <div class="history-item" data-id="${item.requestId}">
        <div class="history-item-header">
          <span class="history-type">${item.type}</span>
          <span class="history-timestamp">${dateStr} ${timeStr}</span>
        </div>
        <div class="history-question">${question}</div>
        <div class="history-response">
          <div class="history-response-label">Response:</div>
          ${responseText}
        </div>
      </div>
    `;
  }
  
  getQuestionText(type, parameters) {
    switch (type) {
      case 'planner':
        return parameters.decision_context || 'Planning Decision';
      case 'text_input':
      case 'single_choice':
      case 'multi_choice':
      case 'confirm':
      case 'screenshot_request':
        return parameters.question || type;
      default:
        return type;
    }
  }
  
  formatResponse(type, response) {
    if (response.cancelled) {
      return '<em>Cancelled</em>';
    }
    
    if (response.switchToText) {
      return '<em>Switched to text input</em>';
    }
    
    switch (type) {
      case 'planner':
        let plannerResponse = response.choice || '<em>No selection</em>';
        if (response.thinkingMode) {
          plannerResponse = `<strong>Choice:</strong> ${plannerResponse}<br>`;
          plannerResponse += `<strong>Thinking Mode:</strong> ${response.thinkingMode}`;
          if (response.additionalContext) {
            plannerResponse += `<br><strong>Additional Context:</strong> ${response.additionalContext}`;
          }
          if (response.attachments && response.attachments.length > 0) {
            plannerResponse += `<br><strong>Attachments:</strong> ${response.attachments.length} image(s)`;
          }
        }
        return plannerResponse;
      case 'text_input':
        return response.text || '<em>No text entered</em>';
      case 'single_choice':
        return response.choice || '<em>No selection</em>';
      case 'multi_choice':
        return (response.choices || []).join(', ') || '<em>No selections</em>';
      case 'confirm':
        return response.confirmed ? 'Yes' : 'No';
      case 'screenshot_request':
        const count = (response.images || []).length;
        return `${count} image${count !== 1 ? 's' : ''} uploaded`;
      default:
        return JSON.stringify(response);
    }
  }
  
  filterHistory(searchTerm) {
    const items = document.querySelectorAll('.history-item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(term) ? 'block' : 'none';
    });
  }
}

// Base component class
class BaseComponent {
  constructor(type, parameters) {
    this.type = type;
    this.parameters = parameters;
    this.element = this.createElement();
    this.onResponse = null;
  }

  createElement() {
    const wrapper = document.createElement('div');
    wrapper.className = 'component-wrapper';
    wrapper.innerHTML = this.render();
    this.attachEventListeners(wrapper);
    this.attachCommonListeners(wrapper);
    return wrapper;
  }

  render() {
    // Override in subclasses
    return '';
  }

  attachEventListeners(wrapper) {
    // Override in subclasses
  }
  
  attachCommonListeners(wrapper) {
    // Add common Cancel and Switch to Text buttons
    const cancelBtn = wrapper.querySelector('.dialog-cancel');
    const switchBtn = wrapper.querySelector('.dialog-switch-text');
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.sendResponse({
          cancelled: true,
          timestamp: new Date().toISOString()
        });
      });
    }
    
    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        this.sendResponse({
          switchToText: true,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  focus() {
    // Override in subclasses
  }

  sendResponse(data) {
    if (this.onResponse) {
      this.onResponse(data);
    }
  }
  
  renderCommonButtons() {
    return `
      <div class="dialog-common-actions">
        <button class="dialog-cancel">Cancel</button>
        <button class="dialog-switch-text">Switch to Text Input</button>
      </div>
    `;
  }
}

// Planner component
class PlannerComponent extends BaseComponent {
  constructor(parameters) {
    super('planner', parameters);
  }

  render() {
    const { decision_context, visual_output, options } = this.parameters;
    
    return `
      <div class="planner-component compact">
        <div class="planner-header">
          <h3>Planning Decision</h3>
          <!-- Compact Thinking Mode Selector using Shoelace -->
          <sl-button-group label="Thinking Mode">
            <sl-button class="mode-btn" data-mode="quick" size="small" variant="default" pill>Q</sl-button>
            <sl-button class="mode-btn active" data-mode="normal" size="small" variant="primary" pill>N</sl-button>
            <sl-button class="mode-btn" data-mode="deep" size="small" variant="default" pill>D</sl-button>
            <sl-button class="mode-btn" data-mode="ultra" size="small" variant="default" pill>U</sl-button>
          </sl-button-group>
        </div>
        
        <sl-card class="planner-context-card">
          <div class="planner-context">${decision_context}</div>
        </sl-card>
        
        ${visual_output ? `<sl-details summary="Visual Output" class="planner-visual" open>
          <div class="collapsible-content">${renderMarkdown(visual_output)}</div>
        </sl-details>` : ''}
        
        <!-- Combined Input Section -->
        <div class="planner-input-section">
          <div class="input-row">
            <sl-textarea 
              class="planner-text-input compact" 
              placeholder="Additional context or paste image (Ctrl+V)..."
              rows="2"
              resize="auto"
            ></sl-textarea>
            <sl-button class="attachment-btn compact" size="medium" variant="default" circle>
              <sl-icon name="image" label="Attach Image"></sl-icon>
            </sl-button>
          </div>
          <input type="file" class="planner-file-input" accept="image/*" style="display: none;">
          <div class="planner-attachments"></div>
        </div>
        
        <!-- Options Grid -->
        <div class="planner-options grid">
          ${options.map((opt, i) => `
            <sl-button class="planner-option compact" data-value="${opt.value}" variant="default" size="medium">
              <sl-badge slot="prefix" variant="primary" pill>${i + 1}</sl-badge>
              <span class="option-text">${opt.label}</span>
            </sl-button>
          `).join('')}
        </div>
        
        <!-- Action Buttons Row -->
        <div class="planner-actions">
          <sl-button class="planner-submit-btn compact" variant="success" size="medium">
            <sl-icon slot="prefix" name="send"></sl-icon>
            Submit Text/Images
          </sl-button>
          <div class="action-buttons">
            <sl-button class="dialog-cancel compact" variant="danger" size="small" outline>Cancel</sl-button>
            <sl-button class="dialog-switch-text compact" variant="default" size="small" outline>Text Mode</sl-button>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners(wrapper) {
    // Option buttons (Shoelace)
    wrapper.querySelectorAll('.planner-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const activeMode = wrapper.querySelector('sl-button[variant="primary"]');
        const thinkingMode = activeMode ? activeMode.dataset.mode : 'normal';
        const textInput = wrapper.querySelector('sl-textarea').value;
        const attachments = this.getAttachments();
        
        this.sendResponse({
          choice: btn.dataset.value,
          thinkingMode: thinkingMode,
          additionalContext: textInput,
          attachments: attachments,
          timestamp: new Date().toISOString()
        });
      });
    });
    
    // Submit button for text/attachments only
    const submitBtn = wrapper.querySelector('.planner-submit-btn');
    submitBtn.addEventListener('click', () => {
      const activeMode = wrapper.querySelector('sl-button[variant="primary"]');
      const thinkingMode = activeMode ? activeMode.dataset.mode : 'normal';
      const textInput = wrapper.querySelector('sl-textarea').value;
      const attachments = this.getAttachments();
      
      // Check if there's any content to submit
      if (!textInput.trim() && attachments.length === 0) {
        // Use Shoelace alert
        const alert = Object.assign(document.createElement('sl-alert'), {
          variant: 'warning',
          closable: true,
          duration: 3000,
          innerHTML: `
            <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
            Please add text or attachments before submitting
          `
        });
        document.body.appendChild(alert);
        alert.toast();
        return;
      }
      
      this.sendResponse({
        choice: null,
        thinkingMode: thinkingMode,
        additionalContext: textInput,
        attachments: attachments,
        timestamp: new Date().toISOString()
      });
    });
    
    // Thinking mode buttons (Shoelace)
    wrapper.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wrapper.querySelectorAll('.mode-btn').forEach(b => {
          b.variant = 'default';
        });
        btn.variant = 'primary';
      });
    });
    
    // Shoelace details component handles collapsing automatically
    
    // Image attachment
    const attachBtn = wrapper.querySelector('.attachment-btn');
    const fileInput = wrapper.querySelector('.planner-file-input');
    
    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => fileInput.click());
    }
    
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(Array.from(e.target.files));
    });
    
    // Paste handling
    wrapper.addEventListener('paste', (e) => {
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter(item => item.type.indexOf('image') !== -1);
      imageItems.forEach(item => {
        const blob = item.getAsFile();
        if (blob) {
          this.handleFiles([blob]);
        }
      });
    });
    
    // Keyboard shortcuts
    wrapper.addEventListener('keydown', (e) => {
      // Ctrl+Enter to submit
      if (e.ctrlKey && e.key === 'Enter') {
        submitBtn.click();
        return;
      }
      
      // Q, N, D, U for thinking modes
      if (e.key.toLowerCase() === 'q') {
        wrapper.querySelector('[data-mode="quick"]').click();
      } else if (e.key.toLowerCase() === 'n') {
        wrapper.querySelector('[data-mode="normal"]').click();
      } else if (e.key.toLowerCase() === 'd') {
        wrapper.querySelector('[data-mode="deep"]').click();
      } else if (e.key.toLowerCase() === 'u') {
        wrapper.querySelector('[data-mode="ultra"]').click();
      }
      
      // Number keys for options
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const options = wrapper.querySelectorAll('.planner-option');
        if (options[num - 1]) {
          options[num - 1].click();
        }
      }
    });
  }
  
  handleFiles(files) {
    if (!this.attachments) {
      this.attachments = [];
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.attachments.push({
          data: e.target.result,
          type: file.type,
          name: file.name
        });
        this.updateAttachmentPreview();
      };
      reader.readAsDataURL(file);
    });
  }
  
  updateAttachmentPreview() {
    const container = this.element.querySelector('.planner-attachments');
    container.innerHTML = this.attachments.map((img, i) => `
      <div class="attachment-preview">
        <img src="${img.data}" alt="${img.name}">
        <button class="remove-attachment" data-index="${i}">×</button>
      </div>
    `).join('');
    
    // Add remove handlers
    container.querySelectorAll('.remove-attachment').forEach(btn => {
      btn.addEventListener('click', () => {
        this.attachments.splice(parseInt(btn.dataset.index), 1);
        this.updateAttachmentPreview();
      });
    });
  }
  
  getAttachments() {
    return this.attachments || [];
  }
}

// Text input component
class TextInputComponent extends BaseComponent {
  constructor(parameters) {
    super('text_input', parameters);
  }

  render() {
    const { question, placeholder, defaultText, maxLength } = this.parameters;
    
    return `
      <div class="text-input-component">
        <h3>${question}</h3>
        <textarea 
          class="text-input-field"
          placeholder="${placeholder || 'Enter your response...'}"
          maxlength="${maxLength || 10000}"
        >${defaultText || ''}</textarea>
        <div class="text-input-actions">
          <span class="char-count">0 / ${maxLength || 10000}</span>
          <button class="submit-btn">Submit</button>
        </div>
        ${this.renderCommonButtons()}
      </div>
    `;
  }

  attachEventListeners(wrapper) {
    const textarea = wrapper.querySelector('.text-input-field');
    const charCount = wrapper.querySelector('.char-count');
    const submitBtn = wrapper.querySelector('.submit-btn');

    textarea.addEventListener('input', () => {
      charCount.textContent = `${textarea.value.length} / ${this.parameters.maxLength || 10000}`;
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submit(textarea.value);
      }
    });

    submitBtn.addEventListener('click', () => {
      this.submit(textarea.value);
    });
  }

  submit(value) {
    this.sendResponse({
      text: value,
      timestamp: new Date().toISOString()
    });
  }

  focus() {
    this.element.querySelector('.text-input-field').focus();
  }
}

// Single choice component
class SingleChoiceComponent extends BaseComponent {
  constructor(parameters) {
    super('single_choice', parameters);
  }

  render() {
    const { question, options } = this.parameters;
    
    return `
      <div class="single-choice-component">
        <h3>${question}</h3>
        <div class="choice-options">
          ${options.map((opt, i) => `
            <label class="choice-option">
              <input type="radio" name="choice" value="${opt.value}">
              <span class="choice-number">${i + 1}</span>
              <span class="choice-label">${opt.label}</span>
              ${opt.description ? `<span class="choice-description">${opt.description}</span>` : ''}
            </label>
          `).join('')}
        </div>
        <button class="submit-btn" disabled>Submit</button>
        ${this.renderCommonButtons()}
      </div>
    `;
  }

  attachEventListeners(wrapper) {
    const radios = wrapper.querySelectorAll('input[type="radio"]');
    const submitBtn = wrapper.querySelector('.submit-btn');

    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        submitBtn.disabled = false;
      });
    });

    submitBtn.addEventListener('click', () => {
      const selected = wrapper.querySelector('input[type="radio"]:checked');
      if (selected) {
        this.sendResponse({
          choice: selected.value,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Keyboard navigation
    wrapper.addEventListener('keydown', (e) => {
      const key = parseInt(e.key);
      if (key >= 1 && key <= radios.length) {
        radios[key - 1].checked = true;
        submitBtn.disabled = false;
      }
    });
  }
}

// Multi choice component
class MultiChoiceComponent extends BaseComponent {
  constructor(parameters) {
    super('multi_choice', parameters);
  }

  render() {
    const { question, options } = this.parameters;
    
    return `
      <div class="multi-choice-component">
        <h3>${question}</h3>
        <div class="multi-actions">
          <button class="select-all-btn">Select All</button>
          <button class="clear-all-btn">Clear All</button>
        </div>
        <div class="choice-options">
          ${options.map((opt) => `
            <label class="choice-option">
              <input type="checkbox" value="${opt.value}" ${opt.checked ? 'checked' : ''}>
              <span class="choice-label">${opt.label}</span>
              ${opt.description ? `<span class="choice-description">${opt.description}</span>` : ''}
            </label>
          `).join('')}
        </div>
        <button class="submit-btn">Submit</button>
        ${this.renderCommonButtons()}
      </div>
    `;
  }

  attachEventListeners(wrapper) {
    const checkboxes = wrapper.querySelectorAll('input[type="checkbox"]');
    const submitBtn = wrapper.querySelector('.submit-btn');
    const selectAllBtn = wrapper.querySelector('.select-all-btn');
    const clearAllBtn = wrapper.querySelector('.clear-all-btn');

    selectAllBtn.addEventListener('click', () => {
      checkboxes.forEach(cb => cb.checked = true);
    });

    clearAllBtn.addEventListener('click', () => {
      checkboxes.forEach(cb => cb.checked = false);
    });

    submitBtn.addEventListener('click', () => {
      const selected = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      
      this.sendResponse({
        choices: selected,
        timestamp: new Date().toISOString()
      });
    });
  }
}

// Screenshot request component
class ScreenshotRequestComponent extends BaseComponent {
  constructor(parameters) {
    super('screenshot_request', parameters);
    this.images = [];
  }

  render() {
    const { question, description } = this.parameters;
    
    return `
      <div class="screenshot-component">
        <h3>${question}</h3>
        ${description ? `<p class="screenshot-description">${description}</p>` : ''}
        <div class="screenshot-area">
          <div class="screenshot-dropzone">
            <p>Drag & drop images here or paste from clipboard</p>
            <button class="browse-btn">Browse Files</button>
            <input type="file" class="file-input" accept="image/*" multiple style="display: none;">
          </div>
          <div class="screenshot-preview"></div>
        </div>
        <button class="submit-btn" disabled>Submit</button>
        ${this.renderCommonButtons()}
      </div>
    `;
  }

  attachEventListeners(wrapper) {
    const dropzone = wrapper.querySelector('.screenshot-dropzone');
    const fileInput = wrapper.querySelector('.file-input');
    const browseBtn = wrapper.querySelector('.browse-btn');
    const submitBtn = wrapper.querySelector('.submit-btn');

    browseBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      this.handleFiles(Array.from(e.target.files));
    });

    // Paste handling
    document.addEventListener('paste', (e) => {
      if (this.element.contains(document.activeElement)) {
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter(item => item.type.indexOf('image') !== -1);
        imageItems.forEach(item => {
          const blob = item.getAsFile();
          if (blob) {
            this.handleFiles([blob]);
          }
        });
      }
    });

    // Submit
    submitBtn.addEventListener('click', () => {
      this.sendResponse({
        images: this.images,
        timestamp: new Date().toISOString()
      });
    });
  }

  handleFiles(files) {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.images.push({
          data: e.target.result,
          type: file.type,
          name: file.name
        });
        this.updatePreview();
      };
      reader.readAsDataURL(file);
    });
  }

  updatePreview() {
    const preview = this.element.querySelector('.screenshot-preview');
    const submitBtn = this.element.querySelector('.submit-btn');
    
    preview.innerHTML = this.images.map((img, i) => `
      <div class="image-thumb">
        <img src="${img.data}" alt="${img.name}">
        <button class="remove-image" data-index="${i}">×</button>
      </div>
    `).join('');
    
    submitBtn.disabled = this.images.length === 0;
    
    // Add remove handlers
    preview.querySelectorAll('.remove-image').forEach(btn => {
      btn.addEventListener('click', () => {
        this.images.splice(parseInt(btn.dataset.index), 1);
        this.updatePreview();
      });
    });
  }
}

// Confirm component
class ConfirmComponent extends BaseComponent {
  constructor(parameters) {
    super('confirm', parameters);
  }

  render() {
    const { question, description, warning, isDangerous, yesLabel, noLabel } = this.parameters;
    
    return `
      <div class="confirm-component ${isDangerous ? 'dangerous' : ''}">
        <h3>${question}</h3>
        ${description ? `<p class="confirm-description">${description}</p>` : ''}
        ${warning ? `<div class="confirm-warning">${warning}</div>` : ''}
        <div class="confirm-actions">
          <button class="confirm-yes ${isDangerous ? 'danger' : ''}">${yesLabel || 'Yes'}</button>
          <button class="confirm-no">${noLabel || 'No'}</button>
        </div>
        ${this.renderCommonButtons()}
      </div>
    `;
  }

  attachEventListeners(wrapper) {
    const yesBtn = wrapper.querySelector('.confirm-yes');
    const noBtn = wrapper.querySelector('.confirm-no');

    yesBtn.addEventListener('click', () => {
      this.sendResponse({
        confirmed: true,
        timestamp: new Date().toISOString()
      });
    });

    noBtn.addEventListener('click', () => {
      this.sendResponse({
        confirmed: false,
        timestamp: new Date().toISOString()
      });
    });

    // Keyboard shortcuts
    wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'y' || e.key === 'Y') {
        yesBtn.click();
      } else if (e.key === 'n' || e.key === 'N') {
        noBtn.click();
      }
    });
  }

  focus() {
    this.element.querySelector('.confirm-no').focus();
  }
}

// Add component-specific styles
const componentStyles = document.createElement('style');
componentStyles.textContent = `
/* Planner Component */
.planner-context {
  margin-bottom: 16px;
  line-height: 1.6;
}

.planner-visual {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
  font-family: monospace;
  font-size: 13px;
  white-space: pre-wrap;
}

/* Thinking Mode Section */
.thinking-mode-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.thinking-mode-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.thinking-mode-buttons {
  display: flex;
  gap: 8px;
}

.thinking-mode-btn {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.thinking-mode-btn:hover {
  border-color: var(--accent);
}

.thinking-mode-btn.active {
  background: var(--accent);
  color: var(--bg-primary);
  border-color: var(--accent);
}

.mode-letter {
  font-size: 16px;
  font-weight: 600;
}

.mode-text {
  font-size: 11px;
}

/* Text Input Section */
.planner-text-section {
  margin-bottom: 16px;
}

.planner-text-input {
  width: 100%;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
}

.planner-text-input:focus {
  outline: none;
  border-color: var(--accent);
}

/* Attachment Section */
.planner-attachment-section {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.attachment-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: var(--text-secondary);
}

.attachment-btn:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.attachment-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.planner-attachments {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
}

.attachment-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.attachment-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-attachment {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.planner-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

/* Submit Section */
.planner-submit-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.planner-submit-btn {
  padding: 10px 20px;
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.planner-submit-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--shadow);
}

.submit-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  font-style: italic;
}

.planner-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.planner-option:hover {
  background: var(--accent);
  color: var(--bg-primary);
  transform: translateX(4px);
}

.option-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--bg-secondary);
  border-radius: 50%;
  font-weight: 600;
  font-size: 12px;
}

.option-label {
  font-weight: 500;
}

.option-description {
  font-size: 12px;
  opacity: 0.8;
  display: block;
  margin-top: 4px;
}

/* Text Input Component */
.text-input-field {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  margin: 12px 0;
}

.text-input-field:focus {
  outline: none;
  border-color: var(--accent);
}

.text-input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Choice Components */
.choice-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}

.choice-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.choice-option:hover {
  border-color: var(--accent);
}

.choice-option input {
  margin: 0;
}

.choice-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: var(--bg-secondary);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.choice-description {
  font-size: 12px;
  color: var(--text-tertiary);
  display: block;
  margin-top: 4px;
}

.multi-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.select-all-btn,
.clear-all-btn {
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.select-all-btn:hover,
.clear-all-btn:hover {
  background: var(--accent);
  color: var(--bg-primary);
}

/* Screenshot Component */
.screenshot-description {
  margin: 8px 0 16px;
  color: var(--text-secondary);
}

.screenshot-dropzone {
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  background: var(--bg-tertiary);
  transition: all 0.2s;
}

.screenshot-dropzone.dragover {
  border-color: var(--accent);
  background: var(--bg-secondary);
}

.browse-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.browse-btn:hover {
  background: var(--accent-hover);
}

.screenshot-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.image-thumb {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
}

.image-thumb img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Confirm Component */
.confirm-description {
  margin: 8px 0 16px;
  color: var(--text-secondary);
}

.confirm-warning {
  background: var(--warning);
  color: var(--bg-primary);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-weight: 500;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.confirm-yes,
.confirm-no {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-yes {
  background: var(--accent);
  color: var(--bg-primary);
}

.confirm-yes:hover {
  background: var(--accent-hover);
}

.confirm-yes.danger {
  background: var(--error);
}

.confirm-no {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.confirm-no:hover {
  background: var(--bg-secondary);
}

/* Common Elements */
.submit-btn {
  padding: 10px 24px;
  background: var(--accent);
  color: var(--bg-primary);
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Notifications */
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--accent);
  color: white;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px var(--shadow);
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}

.notification.show {
  transform: translateY(0);
  opacity: 1;
}

/* Common Dialog Actions */
.dialog-common-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.dialog-cancel,
.dialog-switch-text {
  padding: 8px 16px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-cancel:hover {
  background: var(--error);
  color: white;
  border-color: var(--error);
}

.dialog-switch-text:hover {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

/* Markdown Styles */
.planner-visual h1,
.planner-visual h2,
.planner-visual h3,
.planner-visual h4,
.planner-visual h5,
.planner-visual h6 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--text-primary);
}

.planner-visual h1 { font-size: 24px; }
.planner-visual h2 { font-size: 20px; }
.planner-visual h3 { font-size: 18px; }
.planner-visual h4 { font-size: 16px; }
.planner-visual h5 { font-size: 14px; }
.planner-visual h6 { font-size: 13px; }

.planner-visual p {
  margin-bottom: 12px;
  line-height: 1.6;
}

.planner-visual ul,
.planner-visual ol {
  margin-bottom: 12px;
  padding-left: 24px;
}

.planner-visual li {
  margin-bottom: 4px;
  line-height: 1.6;
}

.planner-visual code {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: var(--accent);
}

.planner-visual pre {
  margin: 0;
  border-radius: 6px;
  overflow-x: auto;
}

.planner-visual pre code {
  display: block;
  padding: 16px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.5;
}

/* Code block wrapper */
.code-block-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.copy-code-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s;
  z-index: 10;
}

.copy-code-btn:hover {
  opacity: 1;
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.planner-visual blockquote {
  border-left: 4px solid var(--accent);
  padding-left: 16px;
  margin: 16px 0;
  color: var(--text-secondary);
}

.planner-visual table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.planner-visual th,
.planner-visual td {
  border: 1px solid var(--border);
  padding: 8px 12px;
  text-align: left;
}

.planner-visual th {
  background: var(--bg-secondary);
  font-weight: 600;
}

.planner-visual hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 16px 0;
}

.planner-visual a {
  color: var(--accent);
  text-decoration: none;
}

.planner-visual a:hover {
  text-decoration: underline;
}

.planner-visual strong {
  font-weight: 600;
  color: var(--text-primary);
}

.planner-visual em {
  font-style: italic;
}
`;
document.head.appendChild(componentStyles);

// Initialize
const dialogManager = new DialogManager();