// Shared utilities for all dialog types

// Dialog response types
const RESPONSE_TYPES = {
    CANCEL_TO_PLANNER: 'cancel_to_planner',
    TEXT_RESPONSE: 'text_response',
    SUBMIT: 'submit',
    CANCELLED: 'cancelled'
};

// Base dialog class that other dialogs can extend
class BaseDialog {
    constructor(dialogType) {
        this.dialogType = dialogType;
        this.dialogData = null;
        this.initPromise = this.initialize();
    }

    async initialize() {
        // Get dialog data from main process
        this.dialogData = await window.electronAPI.getDialogData();
        
        // Set up base UI
        this.setupTitlebar();
        this.setupFooterButtons();
        
        // Set window title
        const titleElement = document.querySelector('.titlebar-title');
        if (titleElement) {
            titleElement.textContent = this.getTitle();
        }
        
        // Focus management
        this.setupFocusManagement();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    getTitle() {
        // Override in subclasses
        return 'Dialog';
    }

    setupTitlebar() {
        // Close button
        const closeBtn = document.querySelector('.titlebar-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.cancel());
        }
        
        // Minimize button
        const minimizeBtn = document.querySelector('.titlebar-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                window.electronAPI.minimizeWindow();
            });
        }
    }

    setupFooterButtons() {
        // Cancel & Return to Planner button
        const cancelBtn = document.querySelector('.btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelToPlanner());
        }
        
        // Text Response button
        const textBtn = document.querySelector('.btn-text');
        if (textBtn) {
            textBtn.addEventListener('click', () => this.switchToTextResponse());
        }
        
        // Submit button
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submit());
        }
    }

    setupFocusManagement() {
        // Smart auto-focus with priority order
        setTimeout(() => {
            // Priority order for focus:
            // 1. Elements with autofocus attribute
            // 2. Primary input elements (textarea, text input)
            // 3. First radio/checkbox if it's the main interaction
            // 4. Primary action button if no inputs
            // 5. First focusable element
            
            const autofocusElement = document.querySelector('[autofocus]');
            if (autofocusElement) {
                autofocusElement.focus();
                autofocusElement.select && autofocusElement.select();
                return;
            }
            
            // Look for primary input
            const primaryInput = document.querySelector('textarea, input[type="text"], input[type="search"]');
            if (primaryInput) {
                primaryInput.focus();
                // Select text if there's default content
                if (primaryInput.value && primaryInput.select) {
                    primaryInput.select();
                }
                return;
            }
            
            // For choice dialogs, focus first option
            const firstChoice = document.querySelector('input[type="radio"]:not(:disabled), input[type="checkbox"]:not(:disabled)');
            if (firstChoice) {
                firstChoice.focus();
                return;
            }
            
            // Focus primary button if no inputs
            const primaryButton = document.querySelector('.btn-primary, .btn-submit');
            if (primaryButton) {
                primaryButton.focus();
                return;
            }
            
            // Fallback to first focusable element
            const firstFocusable = document.querySelector('input, textarea, button, select, a[href], [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 100);
        
        // Trap focus within dialog
        this.setupFocusTrap();
    }
    
    setupFocusTrap() {
        // Get all focusable elements
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            
            const focusableElements = Array.from(document.querySelectorAll(focusableSelectors))
                .filter(el => !el.disabled && el.offsetParent !== null);
            
            if (focusableElements.length === 0) return;
            
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape to cancel
            if (e.key === 'Escape') {
                e.preventDefault();
                this.cancel();
            }
            
            // Ctrl/Cmd + Enter to submit
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
            
            // Alt + P to return to planner
            if (e.altKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                this.cancelToPlanner();
            }
            
            // Alt + T for text response
            if (e.altKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                this.switchToTextResponse();
            }
            
            // Ctrl/Cmd + A to select all (ensure it works in all contexts)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                // Let default behavior handle this, but ensure focus
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    // Default behavior will work
                } else {
                    // Try to select content in the main content area
                    const contentEl = document.querySelector('.dialog-content');
                    if (contentEl) {
                        e.preventDefault();
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(contentEl);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }
        });
        
        // Add copy event handler for better formatting
        document.addEventListener('copy', (e) => {
            const selection = window.getSelection();
            if (selection.toString()) {
                // For code blocks, preserve formatting
                const selectedElements = this.getSelectedElements();
                if (selectedElements.some(el => el.tagName === 'CODE' || el.tagName === 'PRE')) {
                    e.clipboardData.setData('text/plain', selection.toString());
                    e.preventDefault();
                }
            }
        });
    }
    
    getSelectedElements() {
        const selection = window.getSelection();
        const elements = [];
        
        for (let i = 0; i < selection.rangeCount; i++) {
            const range = selection.getRangeAt(i);
            const container = range.commonAncestorContainer;
            const parent = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
            elements.push(parent);
        }
        
        return elements;
    }

    // Response methods
    async cancelToPlanner() {
        const response = {
            type: RESPONSE_TYPES.CANCEL_TO_PLANNER,
            dialogType: this.dialogType,
            data: null
        };
        await window.electronAPI.submitResponse(JSON.stringify(response));
    }

    async switchToTextResponse() {
        const response = {
            type: RESPONSE_TYPES.TEXT_RESPONSE,
            dialogType: this.dialogType,
            data: {
                originalQuestion: this.dialogData.question || this.dialogData.prompt || ''
            }
        };
        await window.electronAPI.submitResponse(JSON.stringify(response));
    }

    async submit() {
        // Override in subclasses to gather specific data
        const data = this.gatherData();
        const response = {
            type: RESPONSE_TYPES.SUBMIT,
            dialogType: this.dialogType,
            data: data
        };
        await window.electronAPI.submitResponse(JSON.stringify(response));
    }

    async cancel() {
        const response = {
            type: RESPONSE_TYPES.CANCELLED,
            dialogType: this.dialogType,
            data: null
        };
        await window.electronAPI.submitResponse(JSON.stringify(response));
    }

    gatherData() {
        // Override in subclasses
        return {};
    }

    // Utility methods
    showError(message) {
        // Simple error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message fade-in';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--ctp-red);
            color: var(--ctp-crust);
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    showLoading(show = true) {
        const container = document.querySelector('.dialog-container');
        if (container) {
            if (show) {
                container.classList.add('loading');
            } else {
                container.classList.remove('loading');
            }
        }
    }
}

// Animation utilities
function animateElement(element, animationClass = 'fade-in') {
    element.classList.add(animationClass);
    element.addEventListener('animationend', () => {
        element.classList.remove(animationClass);
    }, { once: true });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BaseDialog,
        RESPONSE_TYPES,
        animateElement
    };
}