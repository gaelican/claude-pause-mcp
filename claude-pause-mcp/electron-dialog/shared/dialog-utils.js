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
        // Auto-focus first interactive element
        setTimeout(() => {
            const firstInput = document.querySelector('input, textarea, button');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
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
        });
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