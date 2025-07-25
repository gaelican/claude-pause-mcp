// Text Input Dialog Implementation

class TextInputDialog extends BaseDialog {
    constructor() {
        super('text_input');
        this.textArea = null;
        this.charCountElement = null;
        this.maxLength = 10000; // Default max length
    }

    async initialize() {
        await super.initialize();
        
        console.log('[TextInput] Dialog data:', this.dialogData);
        console.log('[TextInput] Tool type:', this.dialogData?.toolType);
        
        // Get elements
        this.textArea = document.getElementById('textInput');
        this.charCountElement = document.getElementById('charCount');
        
        // Set question and description
        const questionEl = document.getElementById('question');
        const descriptionEl = document.getElementById('description');
        
        if (this.dialogData.question) {
            questionEl.textContent = this.dialogData.question;
        }
        
        if (this.dialogData.description) {
            descriptionEl.textContent = this.dialogData.description;
            descriptionEl.style.display = 'block';
        } else {
            descriptionEl.style.display = 'none';
        }
        
        // Set default text if provided
        if (this.dialogData.defaultText) {
            this.textArea.value = this.dialogData.defaultText;
            this.updateCharCount();
        }
        
        // Set placeholder if provided
        if (this.dialogData.placeholder) {
            this.textArea.placeholder = this.dialogData.placeholder;
        }
        
        // Set max length if provided
        if (this.dialogData.maxLength) {
            this.maxLength = this.dialogData.maxLength;
            this.textArea.maxLength = this.maxLength;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Auto-resize textarea
        this.autoResizeTextarea();
        
        // Focus textarea
        this.textArea.focus();
        
        // Add syntax hint if code is expected
        if (this.dialogData.expectsCode) {
            this.addSyntaxHint();
        }
    }

    getTitle() {
        return 'Text Input';
    }

    setupEventListeners() {
        // Character count update
        this.textArea.addEventListener('input', () => {
            this.updateCharCount();
            this.autoResizeTextarea();
        });
        
        // Handle tab key for indentation
        this.textArea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.textArea.selectionStart;
                const end = this.textArea.selectionEnd;
                const value = this.textArea.value;
                
                // Insert tab character
                this.textArea.value = value.substring(0, start) + '\t' + value.substring(end);
                
                // Move cursor
                this.textArea.selectionStart = this.textArea.selectionEnd = start + 1;
                
                // Update char count
                this.updateCharCount();
            }
        });
        
        // Submit on Enter (when not Shift) or Ctrl/Cmd + Enter
        this.textArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.submit();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        });
    }

    updateCharCount() {
        const count = this.textArea.value.length;
        this.charCountElement.textContent = count;
        
        // Change color as approaching limit
        if (this.maxLength) {
            const percentage = count / this.maxLength;
            if (percentage > 0.9) {
                this.charCountElement.style.color = 'var(--ctp-red)';
            } else if (percentage > 0.8) {
                this.charCountElement.style.color = 'var(--ctp-yellow)';
            } else {
                this.charCountElement.style.color = 'var(--ctp-subtext0)';
            }
        }
    }

    autoResizeTextarea() {
        // Reset height to auto to get the correct scrollHeight
        this.textArea.style.height = 'auto';
        
        // Set new height based on content
        const newHeight = Math.min(this.textArea.scrollHeight, 400); // Max 400px
        this.textArea.style.height = newHeight + 'px';
    }

    addSyntaxHint() {
        const hint = document.createElement('div');
        hint.className = 'syntax-hint fade-in';
        hint.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10.5c-.414 0-.75-.336-.75-.75s.336-.75.75-.75.75.336.75.75-.336.75-.75.75zm.75-3.75c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-3c0-.414.336-.75.75-.75s.75.336.75.75v3z"/>
            </svg>
            <span>Tip: Use <code>Ctrl+Enter</code> to submit</span>
        `;
        
        const content = document.querySelector('.dialog-content');
        content.insertBefore(hint, content.firstChild);
    }

    gatherData() {
        const text = this.textArea.value.trim();
        
        if (!text && this.dialogData.required !== false) {
            this.showError('Please enter some text');
            this.textArea.classList.add('error');
            setTimeout(() => {
                this.textArea.classList.remove('error');
            }, 2000);
            throw new Error('No text entered');
        }
        
        return {
            text: text,
            length: text.length
        };
    }

    async submit() {
        try {
            const data = this.gatherData();
            
            // Show success state briefly
            this.textArea.classList.add('success');
            
            // Call parent submit
            await super.submit();
        } catch (error) {
            // Error already shown in gatherData
            return;
        }
    }
}

// Initialize dialog when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.textInputDialog = new TextInputDialog();
});