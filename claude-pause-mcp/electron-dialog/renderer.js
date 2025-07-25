let currentMode = 'normal';

// Alpine.js component for mode selector
function modeSelector() {
    return {
        expanded: false,
        currentMode: 'normal',
        modes: [
            { value: 'quick', icon: 'Q', label: 'Quick' },
            { value: 'normal', icon: 'N', label: 'Normal' },
            { value: 'ultra', icon: 'U', label: 'Ultrathink' }
        ],
        
        async init() {
            // Load saved mode preference
            if (window.electronAPI && window.electronAPI.getThinkingMode) {
                this.currentMode = await window.electronAPI.getThinkingMode();
                // Update global variable for compatibility
                currentMode = this.currentMode;
            }
            
            // Watch for changes to update global variable
            this.$watch('currentMode', value => {
                currentMode = value;
            });
        },
        
        getModeIcon() {
            const mode = this.modes.find(m => m.value === this.currentMode);
            return mode ? mode.icon : 'N';
        },
        
        selectMode(mode) {
            this.currentMode = mode;
            this.expanded = false;
            
            // Save preference
            if (window.electronAPI && window.electronAPI.saveThinkingMode) {
                window.electronAPI.saveThinkingMode(mode);
            }
            
            // Update global for compatibility with existing code
            setMode(mode);
        }
    };
}

// Make Alpine component available globally before Alpine initializes
window.modeSelector = modeSelector;

// Alpine.js component for options management
function optionsManager() {
    return {
        options: [],
        selectedOption: null,
        hasOptions: false,
        
        init() {
            // This will be called when dialog data is loaded
            this.hasOptions = false;
        },
        
        setOptions(newOptions) {
            this.options = newOptions || [];
            this.hasOptions = this.options.length > 0;
            this.selectedOption = null;
            
            // If we have a default option, select it
            const defaultOption = this.options.find(opt => opt.default);
            if (defaultOption) {
                this.selectedOption = defaultOption.value || defaultOption;
            }
        },
        
        selectOption(option) {
            const value = option.value || option;
            this.selectedOption = value;
            
            // Update the response field
            const responseField = document.getElementById('response');
            if (responseField) {
                responseField.value = value;
                responseField.focus();
            }
            
            // Trigger any additional handlers
            if (window.onOptionSelected) {
                window.onOptionSelected(value);
            }
        },
        
        clearSelection() {
            this.selectedOption = null;
            const responseField = document.getElementById('response');
            if (responseField) {
                responseField.value = '';
            }
        }
    };
}

// Make available globally
window.optionsManager = optionsManager;

// Performance optimization utilities
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Audio system for notifications
class AudioManager {
    constructor() {
        this.enabled = localStorage.getItem('audioEnabled') !== 'false';
        this.volume = parseFloat(localStorage.getItem('audioVolume') || '0.5');
        this.audioContext = null;
        
        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }
    
    playDialogOpen() {
        if (!this.enabled || !this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Pleasant notification sound for dialog open
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.3);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.volume, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        oscillator.start(now);
        oscillator.stop(now + 0.4);
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('audioEnabled', enabled);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('audioVolume', this.volume);
    }
}

const audioManager = new AudioManager();

// Configure marked for security (marked is loaded from index.html)
document.addEventListener('DOMContentLoaded', () => {
    if (window.marked) {
        window.marked.setOptions({
            breaks: true,  // Convert \n to <br>
            gfm: true,     // GitHub Flavored Markdown
            headerIds: false,  // Disable header IDs for security
            mangle: false, // Don't mangle email addresses
        });
    }
});

// Initialize the dialog
async function init() {
    // Get dialog data
    const data = await window.electronAPI.getDialogData();
    
    // Initialize planner dialog
    initPlannerDialog(data);
}

// Initialize planner dialog (original functionality)
async function initPlannerDialog(data) {
    // Set context
    let contextText = data.decision_context || '';
    
    // Handle options with Alpine.js
    const leftColumn = document.querySelector('.left-column');
    
    // Get Alpine.js options component
    const optionsComponent = Alpine.$data(document.getElementById('optionsSection'));
    if (optionsComponent && data.options) {
        optionsComponent.setOptions(data.options);
    }
    
    // Handle visual output if provided
    const visualOutput = document.getElementById('visualOutput');
    const visualContent = document.getElementById('visualContent');
    
    if (data.visual_output) {
        visualOutput.style.display = 'flex';
        // Use marked to parse markdown with debouncing for performance
        try {
            if (window.marked && window.marked.parse) {
                // Use requestIdleCallback for non-critical rendering
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => {
                        visualContent.innerHTML = window.marked.parse(data.visual_output);
                    }, { timeout: 100 });
                } else {
                    visualContent.innerHTML = window.marked.parse(data.visual_output);
                }
            } else {
                // Marked not loaded yet, use plain text
                visualContent.textContent = data.visual_output;
            }
        } catch (error) {
            console.error('Markdown parsing error:', error);
            // Fallback to plain text if parsing fails
            visualContent.textContent = data.visual_output;
        }
    }
    
    // Show left column if either options or visual output are present
    if ((data.options && data.options.length > 0) || data.visual_output) {
        leftColumn.style.display = 'flex';
    }
    
    // Show horizontal divider if both options and visual output are present
    const horizontalHandle = document.getElementById('resizeHandleHorizontal');
    if ((data.options && data.options.length > 0) && data.visual_output) {
        horizontalHandle.style.display = 'block';
    }
    
    // Options are now handled by Alpine.js component above
    /*
    if (data.options && data.options.length > 0) {
        // Show options section
        optionsSection.style.display = 'flex';
        
        // Create option elements
        data.options.forEach((opt, i) => {
            // Handle both string and object formats
            const isObject = typeof opt === 'object' && opt !== null;
            const optionValue = isObject ? opt.value : opt;
            const optionLabel = isObject ? opt.label : opt;
            const optionDescription = isObject ? opt.description : '';
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item animate__animated animate__fadeInLeft';
            optionDiv.style.animationDelay = `${i * 0.1}s`;
            
            // Build HTML with optional description
            let optionHTML = `
                <input type="radio" name="option" class="option-radio" value="${optionValue}" id="option${i}">
                <label for="option${i}" class="option-text">
                    <span class="option-label">${optionLabel}</span>`;
            
            if (optionDescription) {
                optionHTML += `<span class="option-description">${optionDescription}</span>`;
            }
            
            optionHTML += `</label>
                <span class="option-number">${i + 1}</span>
            `;
            
            optionDiv.innerHTML = optionHTML;
            
            // Click handler for the entire option
            optionDiv.addEventListener('click', (e) => {
                if (e.target.type !== 'radio') {
                    const radio = optionDiv.querySelector('input[type="radio"]');
                    radio.checked = true;
                    selectOption(optionValue, optionDiv);
                }
            });
            
            // Hover sound removed - only dialog open sound is used
            
            // Radio change handler
            const radio = optionDiv.querySelector('input[type="radio"]');
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    selectOption(optionValue, optionDiv);
                }
            });
            
            optionsList.appendChild(optionDiv);
        });
        
        // Keyboard shortcuts for options (1-9) - now handled by Alpine.js
        document.addEventListener('keydown', (e) => {
            if (!e.target.matches('textarea') && e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                const optionsComponent = Alpine.$data(document.getElementById('optionsSection'));
                if (optionsComponent && optionsComponent.options[index]) {
                    optionsComponent.selectOption(optionsComponent.options[index]);
                }
            }
        });
    }
    */
    
    if (data.default_action) {
        contextText += `\n\nDefault: ${data.default_action}`;
        document.getElementById('response').value = data.default_action;
    }
    
    const contextEl = document.getElementById('context');
    contextEl.textContent = contextText;
    
    // Check if context is scrollable and add class for fade effect
    setTimeout(() => {
        if (contextEl.scrollHeight > contextEl.clientHeight) {
            contextEl.classList.add('scrollable');
        }
    }, 0);
    
    // Load saved thinking mode
    currentMode = await window.electronAPI.getThinkingMode();
    setMode(currentMode);
    
    // Update active mode option
    document.querySelectorAll('.mode-option').forEach(opt => {
        opt.classList.remove('active');
    });
    const activeOption = document.querySelector(`.mode-option[data-mode="${currentMode}"]`);
    if (activeOption) {
        activeOption.classList.add('active');
    }
    
    // Set up mode selector event handlers - now handled by Alpine.js
    // setupModeSelectorHandlers();
    
    // Load planning mode preference
    const planningMode = await window.electronAPI.getPlanningMode();
    document.getElementById('planningMode').checked = planningMode;
    
    // Focus response textarea
    document.getElementById('response').focus();
    document.getElementById('response').select();
}

// Set thinking mode
function setMode(mode) {
    currentMode = mode;
    updateModeDisplay();
}

// Alpine.js now handles these functions - keeping for compatibility
function toggleModeSelector() {
    // Handled by Alpine.js x-show and @click
}

function closeModeSelector(e) {
    // Handled by Alpine.js @click.outside
}

function selectMode(mode) {
    // Keep minimal functionality for compatibility
    currentMode = mode;
    updateModeDisplay();
}

// Update mode display
function updateModeDisplay() {
    const currentEl = document.querySelector('.mode-current');
    const iconEl = currentEl.querySelector('.mode-icon');
    
    // Update icon and color
    switch(currentMode) {
        case 'quick':
            iconEl.textContent = 'Q';
            currentEl.className = 'mode-current quick';
            break;
        case 'ultra':
            iconEl.textContent = 'U';
            currentEl.className = 'mode-current ultra';
            break;
        default:
            iconEl.textContent = 'N';
            currentEl.className = 'mode-current normal';
    }
}

// Select an option
function selectOption(value, optionDiv) {
    // Update visual selection
    document.querySelectorAll('.option-item').forEach(item => {
        item.classList.remove('selected');
    });
    optionDiv.classList.add('selected');
    
    // Fill the text input with the selected option
    document.getElementById('response').value = value;
    
    // Keep focus on the text input so user can modify if needed
    document.getElementById('response').focus();
}

// Toggle planning mode
async function togglePlanning() {
    const checkbox = document.getElementById('planningMode');
    checkbox.checked = !checkbox.checked;
    
    // Save preference
    if (window.electronAPI.savePlanningMode) {
        await window.electronAPI.savePlanningMode(checkbox.checked);
    }
}

// Submit response
async function submit() {
    // Handle planner tool submission
    await submitPlannerResponse();
}

// Submit planner response (original functionality)
async function submitPlannerResponse() {
    let response = document.getElementById('response').value;
    
    // Prepend mode-specific text
    if (currentMode === 'quick') {
        response = 'respond quickly. ' + response;
    } else if (currentMode === 'ultra') {
        response = 'use ultrathink. ' + response;
    }
    // Normal mode adds nothing
    
    // Append planning instruction if checkbox is checked
    const planningMode = document.getElementById('planningMode').checked;
    if (planningMode && response && !response.includes('pause_for_input')) {
        const planningText = '\n\nPlease continue planning this implementation and present your complete plan using the pause_for_input tool before making any code changes.';
        response += planningText;
    }
    
    // Include images if any are attached
    const responseData = {
        text: response,
        mode: currentMode,
        images: attachedImages
    };
    
    await window.electronAPI.submitResponse(response, currentMode, responseData);
}


// Cancel dialog
async function cancel() {
    await window.electronAPI.cancelDialog();
}

// Window controls
function minimizeWindow() {
    // Since we're using contextIsolation, we need to use IPC
    window.electronAPI.minimizeWindow && window.electronAPI.minimizeWindow();
}

function closeWindow() {
    cancel();
}

// Settings menu
function toggleSettings() {
    const menu = document.getElementById('settingsMenu');
    menu.classList.toggle('show');
    
    // Close menu when clicking outside
    if (menu.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', closeSettingsMenu);
        }, 0);
    }
}

function closeSettingsMenu(e) {
    const menu = document.getElementById('settingsMenu');
    if (!menu.contains(e.target) && !e.target.closest('.settings-button')) {
        menu.classList.remove('show');
        document.removeEventListener('click', closeSettingsMenu);
    }
}

async function savePosition() {
    if (window.electronAPI.savePosition) {
        await window.electronAPI.savePosition();
        closeSettingsMenu({ target: document.body });
    }
}

async function resetPosition() {
    if (window.electronAPI.resetPosition) {
        await window.electronAPI.resetPosition();
        closeSettingsMenu({ target: document.body });
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Submit with Enter (when not in textarea) or Ctrl+Enter (always)
    if (e.key === 'Enter') {
        if (e.ctrlKey) {
            submit();
        } else if (!e.target.matches('textarea')) {
            // If not in textarea, Enter submits
            submit();
        } else if (!e.shiftKey) {
            // In textarea: Enter submits, Shift+Enter adds newline
            e.preventDefault();
            submit();
        }
        // Shift+Enter in textarea allows newline (default behavior)
    }
    
    if (e.key === 'Escape') cancel();
});

// Visual output functions
function copyVisual() {
    const content = document.getElementById('visualContent').textContent;
    navigator.clipboard.writeText(content).then(() => {
        // Visual feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 1000);
    });
}

function toggleExpand() {
    const container = document.getElementById('visualOutput');
    const btn = event.target;
    
    if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        btn.textContent = 'Expand';
    } else {
        container.classList.add('expanded');
        btn.textContent = 'Collapse';
    }
}

function clearVisual() {
    document.getElementById('visualContent').textContent = '';
}

// Image handling
let attachedImages = [];

function attachImage() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                addImageToPreview(file);
            }
        });
    };
    
    input.click();
}

function addImageToPreview(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const imageData = {
            data: e.target.result,
            name: file.name,
            type: file.type,
            size: file.size
        };
        
        // Check size limit (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('Image size must be less than 10MB');
            return;
        }
        
        attachedImages.push(imageData);
        displayImagePreviews();
    };
    
    reader.readAsDataURL(file);
}

function displayImagePreviews() {
    const container = document.getElementById('imagePreviewContainer');
    const grid = document.getElementById('imagePreviewGrid');
    
    if (attachedImages.length === 0) {
        container.style.display = 'none';
        grid.innerHTML = '';
        return;
    }
    
    container.style.display = 'block';
    grid.innerHTML = attachedImages.map((img, index) => `
        <div class="image-preview-item">
            <img src="${img.data}" alt="${img.name}">
            <button class="image-remove-btn" onclick="removeImage(${index})">×</button>
        </div>
    `).join('');
}

function removeImage(index) {
    attachedImages.splice(index, 1);
    displayImagePreviews();
}

// Clipboard paste handler
document.addEventListener('paste', async (e) => {
    const items = e.clipboardData.items;
    
    for (let item of items) {
        if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
                addImageToPreview(file);
                // Show success toast for pasted screenshots
                showToast(`✅ Image pasted! (${(file.size / 1024).toFixed(0)}KB)`);
            }
        }
    }
});

// Screenshot functionality - now using clipboard paste
function showScreenshotInstructions() {
    const tooltip = document.createElement('div');
    tooltip.id = 'screenshotTooltip';
    tooltip.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: rgba(30, 30, 46, 0.95);
        color: #cdd6f4;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px;">📸 To add a screenshot:</div>
        <ol style="margin: 0; padding-left: 20px; line-height: 1.6;">
            <li>Press <kbd style="background: #45475a; padding: 2px 6px; border-radius: 3px;">Win+Shift+S</kbd></li>
            <li>Select area to capture</li>
            <li>Press <kbd style="background: #45475a; padding: 2px 6px; border-radius: 3px;">Ctrl+V</kbd> here to paste</li>
        </ol>
        <div style="margin-top: 8px; font-size: 12px; opacity: 0.7;">Click anywhere to close</div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
    
    // Remove on click
    setTimeout(() => {
        document.addEventListener('click', function removeTooltip() {
            if (tooltip.parentNode) {
                tooltip.remove();
                style.remove();
            }
            document.removeEventListener('click', removeTooltip);
        });
    }, 100);
    
    // Focus textarea for paste
    document.getElementById('response').focus();
}

// Toast notification function
function showToast(message, duration = 3000) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #313244;
        color: #cdd6f4;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: toastSlideIn 0.3s ease;
    `;
    
    // Add animation if not already added
    if (!document.getElementById('toastStyles')) {
        const style = document.createElement('style');
        style.id = 'toastStyles';
        style.textContent = `
            @keyframes toastSlideIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// Remove old keyboard shortcut - no longer needed

// Drag and drop handlers
function setupDragAndDrop() {
    const container = document.getElementById('imagePreviewContainer');
    const textarea = document.getElementById('response');
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        document.body.addEventListener(eventName, () => {
            container.style.display = 'block';
            container.classList.add('drag-over');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, (e) => {
            // Only remove drag-over if we're leaving the body
            if (e.target === document.body || eventName === 'drop') {
                container.classList.remove('drag-over');
                if (attachedImages.length === 0 && eventName === 'dragleave') {
                    container.style.display = 'none';
                }
            }
        });
    });
    
    // Handle dropped files
    document.body.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                addImageToPreview(file);
            }
        });
    });
}

// WebSocket message handlers
function setupWebSocketHandlers() {
    if (window.electronAPI.onNewRequest) {
        window.electronAPI.onNewRequest((request) => {
            // Update dialog with new request data
            updateDialog(request.data);
            
            // Clear any previous response
            document.getElementById('response').value = '';
            
            // Focus response field
            document.getElementById('response').focus();
        });
    }
    
    if (window.electronAPI.onRequestQueued) {
        window.electronAPI.onRequestQueued((data) => {
            // Show queue status
            showQueueStatus(data.queueLength);
        });
    }
}

// Update dialog with new data
function updateDialog(data) {
    // Update context
    let contextText = data.decision_context || '';
    if (data.default_action) {
        contextText += `\n\nDefault: ${data.default_action}`;
    }
    
    const contextEl = document.getElementById('context');
    contextEl.textContent = contextText;
    
    // Check if context is scrollable
    setTimeout(() => {
        contextEl.classList.toggle('scrollable', contextEl.scrollHeight > contextEl.clientHeight);
    }, 0);
    
    // Update options using Alpine.js
    const optionsComponent = Alpine.$data(document.getElementById('optionsSection'));
    if (optionsComponent) {
        optionsComponent.setOptions(data.options);
    }
    
    const leftColumn = document.querySelector('.left-column');
    
    // Update visual output
    const visualOutput = document.getElementById('visualOutput');
    const visualContent = document.getElementById('visualContent');
    
    if (data.visual_output) {
        visualOutput.style.display = 'flex';
        // Use marked to parse markdown with debouncing for performance
        try {
            if (window.marked && window.marked.parse) {
                // Use requestIdleCallback for non-critical rendering
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => {
                        visualContent.innerHTML = window.marked.parse(data.visual_output);
                    }, { timeout: 100 });
                } else {
                    visualContent.innerHTML = window.marked.parse(data.visual_output);
                }
            } else {
                // Marked not loaded yet, use plain text
                visualContent.textContent = data.visual_output;
            }
        } catch (error) {
            console.error('Markdown parsing error:', error);
            // Fallback to plain text if parsing fails
            visualContent.textContent = data.visual_output;
        }
    } else {
        visualOutput.style.display = 'none';
        visualContent.textContent = '';
    }
    
    // Show left column if needed
    leftColumn.style.display = ((data.options && data.options.length > 0) || data.visual_output) ? 'flex' : 'none';
    
    if (data.options && data.options.length > 0) {
        optionsSection.style.display = 'flex';
        
        data.options.forEach((opt, i) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.innerHTML = `
                <input type="radio" name="option" class="option-radio" value="${opt}" id="option${i}">
                <label for="option${i}" class="option-text">${opt}</label>
                <span class="option-number">${i + 1}</span>
            `;
            
            optionDiv.addEventListener('click', (e) => {
                if (e.target.type !== 'radio') {
                    const radio = optionDiv.querySelector('input[type="radio"]');
                    radio.checked = true;
                    selectOption(opt, optionDiv);
                }
            });
            
            const radio = optionDiv.querySelector('input[type="radio"]');
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    selectOption(opt, optionDiv);
                }
            });
            
            optionsList.appendChild(optionDiv);
        });
    } else {
        optionsSection.style.display = 'none';
    }
}

// Show queue status
function showQueueStatus(queueLength) {
    // Could add a visual indicator for queue status
    console.log(`Requests in queue: ${queueLength}`);
}

// Resizable panels functionality
function setupResizablePanels() {
    const resizeHandle = document.getElementById('resizeHandle');
    const resizeHandleHorizontal = document.getElementById('resizeHandleHorizontal');
    const leftColumn = document.querySelector('.left-column');
    const responseArea = document.querySelector('.response-area');
    const inputSection = document.querySelector('.input-section');
    const optionsSection = document.getElementById('optionsSection');
    const visualOutput = document.getElementById('visualOutput');
    
    let isResizing = false;
    let startX = 0;
    let startLeftWidth = 0;
    let currentLeftWidth = 45; // Default 45%
    
    // Load saved width preference
    const savedWidth = localStorage.getItem('leftColumnWidth');
    if (savedWidth) {
        currentLeftWidth = parseFloat(savedWidth);
        leftColumn.style.flex = `0 0 ${currentLeftWidth}%`;
    }
    
    // Start resize
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startLeftWidth = leftColumn.offsetWidth;
        resizeHandle.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });
    
    // Do resize
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const containerWidth = inputSection.offsetWidth;
        const newLeftWidth = startLeftWidth + deltaX;
        const newLeftPercent = (newLeftWidth / containerWidth) * 100;
        
        // Apply constraints (30% to 70%)
        if (newLeftPercent >= 30 && newLeftPercent <= 70) {
            leftColumn.style.flex = `0 0 ${newLeftPercent}%`;
            currentLeftWidth = newLeftPercent;
        }
    });
    
    // Stop resize
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizeHandle.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // Save preference
            localStorage.setItem('leftColumnWidth', currentLeftWidth);
        }
    });
    
    // Double-click to reset
    resizeHandle.addEventListener('dblclick', () => {
        currentLeftWidth = 45;
        leftColumn.style.flex = '0 0 45%';
        localStorage.setItem('leftColumnWidth', currentLeftWidth);
    });
    
    // Horizontal resize functionality
    let isResizingHorizontal = false;
    let startY = 0;
    let startOptionsHeight = 0;
    let currentOptionsHeight = 50; // Default 50%
    
    // Load saved height preference
    const savedHeight = localStorage.getItem('optionsHeight');
    if (savedHeight && resizeHandleHorizontal) {
        currentOptionsHeight = parseFloat(savedHeight);
        if (optionsSection.style.display !== 'none') {
            optionsSection.style.flex = `0 0 ${currentOptionsHeight}%`;
        }
    }
    
    // Start horizontal resize
    if (resizeHandleHorizontal) {
        resizeHandleHorizontal.addEventListener('mousedown', (e) => {
            isResizingHorizontal = true;
            startY = e.clientY;
            startOptionsHeight = optionsSection.offsetHeight;
            resizeHandleHorizontal.classList.add('dragging');
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
    }
    
    // Do horizontal resize
    document.addEventListener('mousemove', (e) => {
        if (!isResizingHorizontal || !resizeHandleHorizontal) return;
        
        const deltaY = e.clientY - startY;
        const containerHeight = leftColumn.offsetHeight;
        const newOptionsHeight = startOptionsHeight + deltaY;
        const newOptionsPercent = (newOptionsHeight / containerHeight) * 100;
        
        // Apply constraints (20% to 80%)
        if (newOptionsPercent >= 20 && newOptionsPercent <= 80) {
            optionsSection.style.flex = `0 0 ${newOptionsPercent}%`;
            visualOutput.style.flex = `1 1 auto`;
            currentOptionsHeight = newOptionsPercent;
        }
    });
    
    // Stop horizontal resize
    document.addEventListener('mouseup', () => {
        if (isResizingHorizontal && resizeHandleHorizontal) {
            isResizingHorizontal = false;
            resizeHandleHorizontal.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            
            // Save preference
            localStorage.setItem('optionsHeight', currentOptionsHeight);
        }
    });
    
    // Double-click to reset horizontal
    if (resizeHandleHorizontal) {
        resizeHandleHorizontal.addEventListener('dblclick', () => {
            currentOptionsHeight = 50;
            optionsSection.style.flex = '0 0 50%';
            visualOutput.style.flex = '1 1 auto';
            localStorage.setItem('optionsHeight', currentOptionsHeight);
        });
    }
}

// Audio control functions
function toggleAudio() {
    audioManager.setEnabled(!audioManager.enabled);
    updateAudioUI();
}

function updateVolume(value) {
    audioManager.setVolume(value / 100);
    document.getElementById('volumeValue').textContent = value + '%';
}

function updateAudioUI() {
    const audioText = document.getElementById('audioToggleText');
    const volumeSlider = document.getElementById('volumeSlider');
    
    audioText.textContent = audioManager.enabled ? '🔊 Sound: On' : '🔇 Sound: Off';
    volumeSlider.value = audioManager.volume * 100;
    document.getElementById('volumeValue').textContent = Math.round(audioManager.volume * 100) + '%';
}

// Memory leak prevention
const memoryCleanup = {
    intervals: new Set(),
    timeouts: new Set(),
    listeners: [],
    
    cleanup() {
        // Clear all intervals
        this.intervals.forEach(id => clearInterval(id));
        this.intervals.clear();
        
        // Clear all timeouts
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts.clear();
        
        // Remove WebSocket listeners
        if (window.electronAPI && window.electronAPI.removeAllListeners) {
            window.electronAPI.removeAllListeners('new-request');
            window.electronAPI.removeAllListeners('request-queued');
        }
        
        // Remove tracked listeners
        this.listeners.forEach(({ target, event, handler }) => {
            target.removeEventListener(event, handler);
        });
        this.listeners = [];
    }
};

// Track intervals and timeouts
const originalSetInterval = window.setInterval;
const originalSetTimeout = window.setTimeout;

window.setInterval = function(...args) {
    const id = originalSetInterval(...args);
    memoryCleanup.intervals.add(id);
    return id;
};

window.setTimeout = function(...args) {
    const id = originalSetTimeout(...args);
    memoryCleanup.timeouts.add(id);
    return id;
};

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    memoryCleanup.cleanup();
});

// Set up mode selector event handlers - NOW HANDLED BY ALPINE.JS
// function setupModeSelectorHandlers() {
//     // Toggle expansion on current mode click
//     const modeCurrent = document.querySelector('.mode-current');
//     if (modeCurrent) {
//         modeCurrent.addEventListener('click', (e) => {
//             e.stopPropagation();
//             toggleModeSelector();
//         });
//     }
//     
//     // Handle mode option clicks
//     document.querySelectorAll('.mode-option').forEach(option => {
//         option.addEventListener('click', (e) => {
//             e.stopPropagation();
//             const mode = option.getAttribute('data-mode');
//             selectMode(mode);
//         });
//     });
// }

// Make functions globally available for backward compatibility
window.toggleModeSelector = toggleModeSelector;
window.selectMode = selectMode;
window.setMode = setMode;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Apply Windows-specific optimizations
    if (navigator.platform.includes('Win')) {
        document.body.classList.add('windows-platform');
        injectWindowsOptimizations();
    }
    
    init();
    setupWebSocketHandlers();
    setupDragAndDrop();
    setupResizablePanels();
    updateAudioUI();
    
    // Play dialog open sound
    audioManager.playDialogOpen();
    
    // Performance: Remove unused one-time listeners after init
    setTimeout(() => {
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            // Only available in dev tools, but helps identify leaks
            if (window.getEventListeners) {
                const listeners = getEventListeners(el);
                Object.keys(listeners).forEach(event => {
                    if (listeners[event].length > 10) {
                        console.warn(`Element has ${listeners[event].length} ${event} listeners`, el);
                    }
                });
            }
        });
    }, 5000);
});

// Inject Windows-specific optimizations
function injectWindowsOptimizations() {
    const style = document.createElement('style');
    style.id = 'windows-platform-optimizations';
    style.textContent = `
        /* Windows-specific optimizations */
        .windows-platform * {
            /* Force hardware acceleration */
            transform: translateZ(0);
            backface-visibility: hidden;
        }
        
        /* Remove text shadows on Windows for better performance */
        .windows-platform .mode-button,
        .windows-platform .submit-button,
        .windows-platform .cancel-btn {
            text-shadow: none !important;
        }
        
        /* Optimize box shadows for Windows */
        .windows-platform .dialog-container {
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
        }
        
        .windows-platform .mode-button.active {
            box-shadow: 0 2px 8px rgba(137, 180, 250, 0.3) !important;
        }
        
        /* Use system fonts on Windows */
        .windows-platform {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif !important;
        }
        
        /* Disable backdrop filters completely on Windows */
        .windows-platform .header,
        .windows-platform .mode-toggle,
        .windows-platform .settings-menu,
        .windows-platform .visual-output-container {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
        }
        
        /* Native Windows borders */
        .windows-platform .option-item {
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .windows-platform .option-item:hover {
            border-color: rgba(137, 180, 250, 0.3);
        }
        
        .windows-platform .option-item.selected {
            border-color: rgba(137, 180, 250, 0.6);
        }
        
        /* Optimize textarea for Windows */
        .windows-platform #response {
            /* Remove all effects */
            backdrop-filter: none !important;
            filter: none !important;
            text-shadow: none !important;
            /* Optimize caret rendering */
            caret-color: #89b4fa;
            /* Disable selection effects */
            -webkit-user-select: text;
            user-select: text;
        }
        
        .windows-platform #response::selection {
            background: rgba(137, 180, 250, 0.3);
            color: inherit;
        }
        
        .windows-platform #response::-webkit-input-placeholder {
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);
}