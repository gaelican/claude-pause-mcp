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
        
        // Enhanced paste handling
        this.textArea.addEventListener('paste', (e) => {
            // Get paste data
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            
            // If pasting code, auto-detect and format
            if (this.dialogData.expectsCode && this.looksLikeCode(paste)) {
                e.preventDefault();
                
                const start = this.textArea.selectionStart;
                const end = this.textArea.selectionEnd;
                const value = this.textArea.value;
                
                // Insert formatted paste
                const formattedPaste = this.formatCodePaste(paste);
                this.textArea.value = value.substring(0, start) + formattedPaste + value.substring(end);
                
                // Move cursor to end of pasted content
                this.textArea.selectionStart = this.textArea.selectionEnd = start + formattedPaste.length;
                
                // Update UI
                this.updateCharCount();
                this.autoResizeTextarea();
            }
        });
        
        // Add copy button for text area content
        this.addCopyButton();
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

    looksLikeCode(text) {
        // Simple heuristics to detect code
        const codePatterns = [
            /function\s+\w+\s*\(/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /var\s+\w+\s*=/,
            /class\s+\w+/,
            /import\s+.+from/,
            /export\s+/,
            /if\s*\(.+\)\s*{/,
            /for\s*\(.+\)\s*{/,
            /while\s*\(.+\)\s*{/,
            /=>\s*{/,
            /def\s+\w+\s*\(/,
            /#include\s*</
        ];
        
        return codePatterns.some(pattern => pattern.test(text));
    }
    
    formatCodePaste(code) {
        // Basic code formatting
        // Trim extra whitespace but preserve indentation structure
        const lines = code.split('\n');
        const trimmedLines = lines.map(line => line.trimEnd());
        return trimmedLines.join('\n');
    }
    
    addCopyButton() {
        // Create copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-button';
        copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10.5 1h-6A1.5 1.5 0 003 2.5v9A1.5 1.5 0 004.5 13h6a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 1zM11 11.5a.5.5 0 01-.5.5h-6a.5.5 0 01-.5-.5v-9a.5.5 0 01.5-.5h6a.5.5 0 01.5.5v9z"/>
                <path d="M13.5 4H13V3a1 1 0 00-1-1v1.5a.5.5 0 01-.5.5H11V13a1 1 0 001 1h2.5A1.5 1.5 0 0016 12.5v-7A1.5 1.5 0 0014.5 4h-1z"/>
            </svg>
            <span>Copy</span>
        `;
        copyBtn.title = 'Copy text to clipboard (Ctrl+C)';
        
        // Position it near the textarea
        const textAreaWrapper = this.textArea.parentElement;
        textAreaWrapper.style.position = 'relative';
        copyBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            padding: 4px 8px;
            font-size: 12px;
            background: var(--ctp-surface0);
            color: var(--ctp-text);
            border: 1px solid var(--ctp-surface2);
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            opacity: 0.7;
            transition: opacity 0.2s;
        `;
        
        copyBtn.addEventListener('mouseenter', () => {
            copyBtn.style.opacity = '1';
        });
        
        copyBtn.addEventListener('mouseleave', () => {
            copyBtn.style.opacity = '0.7';
        });
        
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(this.textArea.value);
                
                // Show success feedback
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--ctp-green)">
                        <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
                    </svg>
                    <span style="color: var(--ctp-green)">Copied!</span>
                `;
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                this.showError('Failed to copy to clipboard');
            }
        });
        
        textAreaWrapper.appendChild(copyBtn);
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