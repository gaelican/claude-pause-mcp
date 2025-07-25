// Multi Choice Dialog Implementation

class MultiChoiceDialog extends BaseDialog {
    constructor() {
        super('multi_choice');
        this.selectedValues = new Set();
        this.optionsContainer = null;
        this.summaryElement = null;
        this.clearAllBtn = null;
    }

    async initialize() {
        await super.initialize();
        
        // Get elements
        this.optionsContainer = document.getElementById('optionsContainer');
        this.summaryElement = document.querySelector('.summary-text');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        
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
        
        // Add min/max requirements if specified
        if (this.dialogData.minSelections || this.dialogData.maxSelections) {
            this.addSelectionRequirements();
        }
        
        // Create options
        this.createOptions();
        
        // Create select all button
        this.createSelectAllButton();
        
        // Setup clear all button
        this.clearAllBtn.addEventListener('click', () => this.clearAll());
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        // Update summary
        this.updateSummary();
        
        // Focus first option
        setTimeout(() => {
            const firstOption = this.optionsContainer.querySelector('.option-item');
            if (firstOption) {
                firstOption.querySelector('input').focus();
            }
        }, 100);
    }

    getTitle() {
        return 'Select Multiple Options';
    }

    addSelectionRequirements() {
        const requirements = document.createElement('div');
        requirements.className = 'selection-requirements';
        
        const parts = [];
        if (this.dialogData.minSelections) {
            parts.push(`Minimum: ${this.dialogData.minSelections}`);
        }
        if (this.dialogData.maxSelections) {
            parts.push(`Maximum: ${this.dialogData.maxSelections}`);
        }
        
        requirements.textContent = parts.join(' • ');
        
        const summaryContainer = document.querySelector('.selection-summary');
        summaryContainer.appendChild(requirements);
    }

    createOptions() {
        if (!this.dialogData.options || !Array.isArray(this.dialogData.options)) {
            this.showError('No options provided');
            return;
        }
        
        // Check if we need compact mode
        if (this.dialogData.options.length > 6) {
            this.optionsContainer.classList.add('compact');
        }
        
        // Check if options have groups
        const hasGroups = this.dialogData.options.some(opt => opt.group);
        
        if (hasGroups) {
            this.createGroupedOptions();
        } else {
            this.dialogData.options.forEach((option, index) => {
                const optionEl = this.createOptionElement(option, index);
                this.optionsContainer.appendChild(optionEl);
            });
        }
    }

    createGroupedOptions() {
        const groups = {};
        const ungrouped = [];
        
        // Group options
        this.dialogData.options.forEach((option, index) => {
            if (option.group) {
                if (!groups[option.group]) {
                    groups[option.group] = [];
                }
                groups[option.group].push({ option, index });
            } else {
                ungrouped.push({ option, index });
            }
        });
        
        // Create ungrouped options first
        ungrouped.forEach(({ option, index }) => {
            const optionEl = this.createOptionElement(option, index);
            this.optionsContainer.appendChild(optionEl);
        });
        
        // Create grouped options
        Object.entries(groups).forEach(([groupName, items]) => {
            const header = document.createElement('div');
            header.className = 'option-group-header';
            header.textContent = groupName;
            this.optionsContainer.appendChild(header);
            
            items.forEach(({ option, index }) => {
                const optionEl = this.createOptionElement(option, index);
                this.optionsContainer.appendChild(optionEl);
            });
        });
    }

    createOptionElement(option, index) {
        const div = document.createElement('div');
        div.className = 'option-item';
        div.dataset.value = option.value;
        
        const checkboxId = `option-${index}`;
        
        div.innerHTML = `
            <input 
                type="checkbox" 
                id="${checkboxId}" 
                class="option-checkbox" 
                value="${option.value}"
                ${option.checked ? 'checked' : ''}
                ${option.disabled ? 'disabled' : ''}
            >
            <div class="option-content">
                <label for="${checkboxId}" class="option-label">${option.label}</label>
                ${option.description ? `<span class="option-description">${option.description}</span>` : ''}
                ${option.tags && option.tags.length > 0 ? `
                    <div class="option-tags">
                        ${option.tags.map(tag => `<span class="option-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Initialize selected state
        if (option.checked) {
            this.selectedValues.add(option.value);
            div.classList.add('checked');
        }
        
        // Event listeners
        const checkbox = div.querySelector('input');
        
        checkbox.addEventListener('change', () => {
            this.toggleOption(option.value, checkbox.checked);
        });
        
        // Click on entire div
        div.addEventListener('click', (e) => {
            if (!option.disabled && e.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
        
        return div;
    }

    toggleOption(value, checked) {
        const optionDiv = this.optionsContainer.querySelector(`[data-value="${value}"]`);
        
        if (checked) {
            // Check max selections
            if (this.dialogData.maxSelections && 
                this.selectedValues.size >= this.dialogData.maxSelections) {
                // Prevent selection
                const checkbox = optionDiv.querySelector('input');
                checkbox.checked = false;
                this.showError(`Maximum ${this.dialogData.maxSelections} selections allowed`);
                return;
            }
            
            this.selectedValues.add(value);
            optionDiv.classList.add('checked');
        } else {
            this.selectedValues.delete(value);
            optionDiv.classList.remove('checked');
        }
        
        this.updateSummary();
    }

    createSelectAllButton() {
        // Add select all button next to clear all
        const summaryContainer = document.querySelector('.selection-summary');
        this.selectAllBtn = document.createElement('button');
        this.selectAllBtn.className = 'select-all-btn';
        this.selectAllBtn.textContent = 'Select All';
        this.selectAllBtn.style.display = 'none';
        
        // Insert before clear all button
        summaryContainer.insertBefore(this.selectAllBtn, this.clearAllBtn);
        
        this.selectAllBtn.addEventListener('click', () => this.selectAll());
    }
    
    selectAll() {
        const checkboxes = this.optionsContainer.querySelectorAll('.option-checkbox:not(:disabled)');
        const maxAllowed = this.dialogData.maxSelections || checkboxes.length;
        let selected = this.selectedValues.size;
        
        checkboxes.forEach(checkbox => {
            if (selected < maxAllowed && !checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
                selected++;
            }
        });
    }

    updateSummary() {
        const count = this.selectedValues.size;
        const totalOptions = this.optionsContainer.querySelectorAll('.option-checkbox:not(:disabled)').length;
        this.summaryElement.textContent = `${count} selected`;
        
        // Show/hide buttons
        this.clearAllBtn.style.display = count > 0 ? 'inline-block' : 'none';
        
        // Show select all button if not all are selected and no max limit or under max limit
        const maxAllowed = this.dialogData.maxSelections || totalOptions;
        this.selectAllBtn.style.display = count < Math.min(totalOptions, maxAllowed) ? 'inline-block' : 'none';
        
        // Check min/max requirements
        const summaryContainer = document.querySelector('.selection-summary');
        if (this.dialogData.minSelections && count < this.dialogData.minSelections) {
            summaryContainer.classList.add('error');
        } else {
            summaryContainer.classList.remove('error');
        }
    }

    clearAll() {
        this.selectedValues.clear();
        this.optionsContainer.querySelectorAll('.option-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.optionsContainer.querySelectorAll('.option-item').forEach(item => {
            item.classList.remove('checked');
        });
        this.updateSummary();
    }

    setupKeyboardNavigation() {
        // Ctrl/Cmd + A to select all
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.selectAll();
            }
        });
        
        // Enter key to submit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            }
        });
        
        // Tab navigation enhancement
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                const activeElement = document.activeElement;
                const checkboxes = this.optionsContainer.querySelectorAll('.option-item:not(.disabled) input');
                const isInOptions = Array.from(checkboxes).includes(activeElement);
                
                if (!isInOptions && checkboxes.length > 0) {
                    e.preventDefault();
                    checkboxes[0].focus();
                }
            }
        });
        
        // Arrow key navigation
        this.optionsContainer.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                
                const options = Array.from(this.optionsContainer.querySelectorAll('.option-item:not(.disabled)'));
                const currentIndex = options.findIndex(opt => 
                    opt.querySelector('input') === document.activeElement
                );
                
                let newIndex;
                if (e.key === 'ArrowDown') {
                    newIndex = (currentIndex + 1) % options.length;
                } else {
                    newIndex = currentIndex === -1 ? options.length - 1 : 
                              (currentIndex - 1 + options.length) % options.length;
                }
                
                const newOption = options[newIndex];
                if (newOption) {
                    const checkbox = newOption.querySelector('input');
                    checkbox.focus();
                }
            }
            
            // Space to toggle
            if (e.key === ' ' && document.activeElement.type === 'checkbox') {
                e.preventDefault();
                document.activeElement.click();
            }
        });
    }

    gatherData() {
        const count = this.selectedValues.size;
        
        // Check min selections
        if (this.dialogData.minSelections && count < this.dialogData.minSelections) {
            this.showError(`Please select at least ${this.dialogData.minSelections} options`);
            throw new Error('Minimum selections not met');
        }
        
        // Check if any selections made when not required
        if (count === 0 && !this.dialogData.allowEmpty) {
            this.showError('Please select at least one option');
            throw new Error('No selections made');
        }
        
        // Get selected option details
        const selectedOptions = this.dialogData.options.filter(opt => 
            this.selectedValues.has(opt.value)
        );
        
        return {
            values: Array.from(this.selectedValues),
            options: selectedOptions.map(opt => ({
                value: opt.value,
                label: opt.label
            })),
            count: count
        };
    }

    async submit() {
        try {
            await super.submit();
        } catch (error) {
            // Error already handled in gatherData
        }
    }
}

// Initialize dialog when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.multiChoiceDialog = new MultiChoiceDialog();
});