// Confirm Dialog Implementation

class ConfirmDialog extends BaseDialog {
    constructor() {
        super('confirm');
        this.selectedValue = null;
        this.yesBtn = null;
        this.noBtn = null;
    }

    async initialize() {
        await super.initialize();
        
        // Get elements
        this.yesBtn = document.getElementById('confirmYes');
        this.noBtn = document.getElementById('confirmNo');
        
        // Set question and description
        const questionEl = document.getElementById('question');
        const descriptionEl = document.getElementById('description');
        
        if (this.dialogData.question) {
            questionEl.textContent = this.dialogData.question;
        } else {
            questionEl.textContent = 'Are you sure?';
        }
        
        if (this.dialogData.description) {
            descriptionEl.textContent = this.dialogData.description;
            descriptionEl.style.display = 'block';
        } else {
            descriptionEl.style.display = 'none';
        }
        
        // Show warning if provided
        if (this.dialogData.warning) {
            this.showWarning(this.dialogData.warning);
        }
        
        // Apply danger mode if specified
        if (this.dialogData.isDangerous) {
            document.querySelector('.dialog-container').classList.add('danger');
        }
        
        // Apply compact mode for simple confirms
        if (!this.dialogData.description && !this.dialogData.warning) {
            document.querySelector('.dialog-container').classList.add('compact');
        }
        
        // Customize button labels if provided
        if (this.dialogData.yesLabel) {
            this.yesBtn.querySelector('.confirm-label').textContent = this.dialogData.yesLabel;
        }
        if (this.dialogData.noLabel) {
            this.noBtn.querySelector('.confirm-label').textContent = this.dialogData.noLabel;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Focus based on default or danger
        if (this.dialogData.isDangerous || this.dialogData.defaultToNo) {
            this.noBtn.focus();
        } else {
            this.yesBtn.focus();
        }
    }

    getTitle() {
        return this.dialogData.title || 'Confirm Action';
    }

    showWarning(warningText) {
        const warningEl = document.getElementById('warningMessage');
        const warningTextEl = warningEl.querySelector('.warning-text');
        warningTextEl.textContent = warningText;
        warningEl.classList.remove('hidden');
    }

    setupEventListeners() {
        // Button clicks
        this.yesBtn.addEventListener('click', () => this.selectOption(true));
        this.noBtn.addEventListener('click', () => this.selectOption(false));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Y key for Yes
            if (e.key.toLowerCase() === 'y' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.selectOption(true);
            }
            
            // N key for No
            if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.selectOption(false);
            }
            
            // Enter for focused button
            if (e.key === 'Enter') {
                if (document.activeElement === this.yesBtn) {
                    e.preventDefault();
                    this.selectOption(true);
                } else if (document.activeElement === this.noBtn) {
                    e.preventDefault();
                    this.selectOption(false);
                }
            }
            
            // Tab to switch between buttons
            if (e.key === 'Tab') {
                e.preventDefault();
                if (document.activeElement === this.yesBtn) {
                    this.noBtn.focus();
                } else {
                    this.yesBtn.focus();
                }
            }
            
            // Arrow keys to switch
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                if (document.activeElement === this.yesBtn) {
                    this.noBtn.focus();
                } else {
                    this.yesBtn.focus();
                }
            }
        });
        
        // Visual feedback on keypress
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'y') {
                this.yesBtn.classList.add('selected');
                // Add subtle vibration effect
                this.yesBtn.style.animation = 'none';
                setTimeout(() => {
                    this.yesBtn.style.animation = '';
                }, 10);
            } else if (e.key.toLowerCase() === 'n') {
                this.noBtn.classList.add('selected');
                // Add subtle vibration effect
                this.noBtn.style.animation = 'none';
                setTimeout(() => {
                    this.noBtn.style.animation = '';
                }, 10);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === 'y') {
                this.yesBtn.classList.remove('selected');
            } else if (e.key.toLowerCase() === 'n') {
                this.noBtn.classList.remove('selected');
            }
        });
        
        // Add hover sound effect preparation (visual feedback)
        [this.yesBtn, this.noBtn].forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        });
    }

    async selectOption(value) {
        this.selectedValue = value;
        
        // Visual feedback
        const btn = value ? this.yesBtn : this.noBtn;
        btn.classList.add('selected');
        
        // Add loading state if there's an async action
        if (this.dialogData.requiresConfirmation && value) {
            btn.classList.add('loading');
            
            // Simulate confirmation delay
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Submit immediately
        await this.submit();
    }

    gatherData() {
        if (this.selectedValue === null) {
            this.showError('Please select Yes or No');
            throw new Error('No selection made');
        }
        
        return {
            confirmed: this.selectedValue,
            response: this.selectedValue ? 'yes' : 'no'
        };
    }

    // Override submit to handle the response directly
    async submit() {
        try {
            const data = this.gatherData();
            const response = {
                type: RESPONSE_TYPES.SUBMIT,
                dialogType: this.dialogType,
                data: data
            };
            await window.electronAPI.submitResponse(JSON.stringify(response));
        } catch (error) {
            // Error already handled in gatherData
        }
    }
}

// Initialize dialog when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.confirmDialog = new ConfirmDialog();
});