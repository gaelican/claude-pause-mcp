// Renderer process for Claude Pause parent application

class DialogManager {
  constructor() {
    this.activeDialogs = new Map();
    this.components = new Map();
    this.initializeEventListeners();
    this.setupMCPHandlers();
    this.updateConnectionStatus('disconnected');
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
    });

    closeSettings.addEventListener('click', () => {
      settingsPanel.classList.remove('open');
    });

    // Settings controls
    document.getElementById('theme-select').addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });
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
        this.sendDialogResponse(requestId, response);
        this.removeDialog(requestId);
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
      dialog.component.element.remove();
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
    // TODO: Implement theme switching
    console.log('Applying theme:', theme);
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
    return wrapper;
  }

  render() {
    // Override in subclasses
    return '';
  }

  attachEventListeners(wrapper) {
    // Override in subclasses
  }

  focus() {
    // Override in subclasses
  }

  sendResponse(data) {
    if (this.onResponse) {
      this.onResponse(data);
    }
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
      <div class="planner-component">
        <h3>Planning Decision</h3>
        <div class="planner-context">${decision_context}</div>
        ${visual_output ? `<div class="planner-visual">${visual_output}</div>` : ''}
        <div class="planner-options">
          ${options.map((opt, i) => `
            <button class="planner-option" data-value="${opt.value}">
              <span class="option-number">${i + 1}</span>
              <span class="option-label">${opt.label}</span>
              ${opt.description ? `<span class="option-description">${opt.description}</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  attachEventListeners(wrapper) {
    wrapper.querySelectorAll('.planner-option').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sendResponse({
          choice: btn.dataset.value,
          timestamp: new Date().toISOString()
        });
      });
    });
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

.planner-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
`;
document.head.appendChild(componentStyles);

// Initialize
const dialogManager = new DialogManager();