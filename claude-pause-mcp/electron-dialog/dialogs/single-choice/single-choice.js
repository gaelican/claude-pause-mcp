// Single Choice Dialog Implementation

class SingleChoiceDialog extends BaseDialog {
    constructor() {
        super('single_choice');
        this.selectedValue = null;
        this.optionsContainer = null;
    }

    async initialize() {
        await super.initialize();
        
        // Get elements
        this.optionsContainer = document.getElementById('optionsContainer');
        
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
        
        // Create options
        this.createOptions();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        // Auto-select default if provided
        if (this.dialogData.defaultValue) {
            this.selectOption(this.dialogData.defaultValue);
        }
        
        // Focus first option
        setTimeout(() => {
            const firstOption = this.optionsContainer.querySelector('.option-item');
            if (firstOption) {
                firstOption.querySelector('input').focus();
            }
        }, 100);
    }

    getTitle() {
        return 'Choose an Option';
    }

    createOptions() {
        if (!this.dialogData.options || !Array.isArray(this.dialogData.options)) {
            this.showError('No options provided');
            return;
        }
        
        // Check if we need compact mode (more than 5 options)
        if (this.dialogData.options.length > 5) {
            this.optionsContainer.classList.add('compact');
        }
        
        this.dialogData.options.forEach((option, index) => {
            const optionEl = this.createOptionElement(option, index);
            this.optionsContainer.appendChild(optionEl);
        });
    }

    createOptionElement(option, index) {
        const div = document.createElement('div');
        div.className = 'option-item';
        div.dataset.value = option.value;
        
        // Check if option is disabled
        if (option.disabled) {
            div.classList.add('disabled');
        }
        
        const radioId = `option-${index}`;
        
        div.innerHTML = `
            <input 
                type="radio" 
                name="single-choice" 
                id="${radioId}" 
                class="option-radio" 
                value="${option.value}"
                ${option.disabled ? 'disabled' : ''}
            >
            <div class="option-content">
                <label for="${radioId}" class="option-label">${option.label}</label>
                ${option.description ? `<span class="option-description">${option.description}</span>` : ''}
            </div>
            <span class="option-number">${index + 1}</span>
        `;
        
        // Event listeners
        const radio = div.querySelector('input');
        
        radio.addEventListener('change', () => {
            if (radio.checked) {
                this.selectOption(option.value);
            }
        });
        
        // Click on entire div
        div.addEventListener('click', (e) => {
            if (!option.disabled && e.target.tagName !== 'INPUT') {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        });
        
        // Double-click to submit
        div.addEventListener('dblclick', () => {
            if (!option.disabled && radio.checked) {
                this.submit();
            }
        });
        
        return div;
    }

    selectOption(value) {
        this.selectedValue = value;
        
        // Update UI
        this.optionsContainer.querySelectorAll('.option-item').forEach(item => {
            if (item.dataset.value === value) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
        
        // Enable submit button
        const submitBtn = document.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }

    setupKeyboardNavigation() {
        // Number key shortcuts
        document.addEventListener('keydown', (e) => {
            const num = parseInt(e.key);
            if (!isNaN(num) && num >= 1 && num <= 9) {
                const options = this.optionsContainer.querySelectorAll('.option-item:not(.disabled)');
                if (options[num - 1]) {
                    const radio = options[num - 1].querySelector('input');
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                    radio.focus();
                }
            }
        });
        
        // Enter key to submit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.selectedValue) {
                e.preventDefault();
                this.submit();
            }
        });
        
        // Tab navigation enhancement
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                const activeElement = document.activeElement;
                const options = this.optionsContainer.querySelectorAll('.option-item:not(.disabled) input');
                const isInOptions = Array.from(options).includes(activeElement);
                
                if (!isInOptions && options.length > 0) {
                    e.preventDefault();
                    options[0].focus();
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
                    const radio = newOption.querySelector('input');
                    radio.focus();
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
            }
        });
    }

    gatherData() {
        if (!this.selectedValue) {
            this.showError('Please select an option');
            this.optionsContainer.classList.add('error');
            setTimeout(() => {
                this.optionsContainer.classList.remove('error');
            }, 300);
            throw new Error('No option selected');
        }
        
        // Check if remember choice is checked
        const rememberCheckbox = document.getElementById('rememberChoice');
        const shouldRemember = rememberCheckbox ? rememberCheckbox.checked : false;
        
        // Find the selected option details
        const selectedOption = this.dialogData.options.find(opt => opt.value === this.selectedValue);
        
        return {
            value: this.selectedValue,
            label: selectedOption ? selectedOption.label : this.selectedValue,
            rememberChoice: shouldRemember
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
    window.singleChoiceDialog = new SingleChoiceDialog();
});