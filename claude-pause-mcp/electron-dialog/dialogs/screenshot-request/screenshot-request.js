// Screenshot Request Dialog Implementation

class ScreenshotRequestDialog extends BaseDialog {
    constructor() {
        super('screenshot_request');
        this.images = [];
        this.dropzone = null;
        this.previewContainer = null;
        this.additionalTextArea = null;
        this.submitBtn = null;
        this.pasteBtn = null;
        this.maxImages = 5;
    }

    async initialize() {
        await super.initialize();
        
        // Get elements
        this.dropzone = document.getElementById('dropzone');
        this.previewContainer = document.getElementById('previewContainer');
        this.additionalTextArea = document.getElementById('additionalText');
        this.submitBtn = document.querySelector('.btn-submit');
        this.pasteBtn = document.getElementById('pasteBtn');
        
        // Set question and description
        const questionEl = document.getElementById('question');
        const descriptionEl = document.getElementById('description');
        
        if (this.dialogData.question) {
            questionEl.textContent = this.dialogData.question;
        } else {
            questionEl.textContent = 'Please provide a screenshot';
        }
        
        if (this.dialogData.description) {
            descriptionEl.textContent = this.dialogData.description;
            descriptionEl.style.display = 'block';
        } else {
            descriptionEl.style.display = 'none';
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Focus additional text area
        this.additionalTextArea.focus();
    }

    getTitle() {
        return 'Screenshot Request';
    }

    setupEventListeners() {
        // Paste event
        document.addEventListener('paste', (e) => this.handlePaste(e));
        
        // Drag and drop
        this.dropzone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropzone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropzone.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Paste button click
        this.pasteBtn.addEventListener('click', async () => {
            try {
                const clipboardItems = await navigator.clipboard.read();
                for (const item of clipboardItems) {
                    for (const type of item.types) {
                        if (type.startsWith('image/')) {
                            const blob = await item.getType(type);
                            const file = new File([blob], 'pasted-image.png', { type });
                            this.processImage(file);
                            break;
                        }
                    }
                }
            } catch (err) {
                // Fallback to showing paste instruction
                this.showError('Please use Ctrl+V to paste, or click while focused on the window');
            }
        });
        
        // File input fallback (hidden, but useful)
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        document.body.appendChild(fileInput);
        
        // Double click dropzone to open file dialog
        this.dropzone.addEventListener('dblclick', () => {
            fileInput.click();
        });
    }

    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;
        
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                this.processImage(file);
                break;
            }
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === this.dropzone) {
            this.dropzone.classList.remove('dragover');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('dragover');
        
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            // Process all image files
            let processedCount = 0;
            for (const file of files) {
                if (file.type.startsWith('image/')) {
                    if (this.images.length >= this.maxImages) {
                        this.showError(`Maximum ${this.maxImages} images allowed`);
                        break;
                    }
                    this.processImage(file);
                    processedCount++;
                }
            }
            if (processedCount === 0) {
                this.showError('Please drop image files only');
            }
        }
    }

    handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            this.processImage(file);
        }
    }

    async processImage(file) {
        if (this.images.length >= this.maxImages) {
            this.showError(`Maximum ${this.maxImages} images allowed`);
            return;
        }
        
        // Show loading state
        this.dropzone.classList.add('loading');
        
        try {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('Image too large (max 10MB)');
            }
            
            // Read file as data URL
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                
                // Create image to check dimensions
                const img = new Image();
                img.onload = () => {
                    // Create unique ID
                    const imageId = Date.now() + Math.random();
                    
                    // Store image data
                    const imageData = {
                        id: imageId,
                        dataUrl: dataUrl,
                        width: img.width,
                        height: img.height,
                        size: file.size,
                        type: file.type,
                        name: file.name || `screenshot-${this.images.length + 1}.png`
                    };
                    
                    this.images.push(imageData);
                    
                    // Show preview
                    this.addPreview(imageData);
                    
                    // Update UI
                    this.updateUI();
                };
                
                img.onerror = () => {
                    this.showError('Failed to load image');
                    this.dropzone.classList.remove('loading');
                };
                
                img.src = dataUrl;
            };
            
            reader.onerror = () => {
                this.showError('Failed to read image file');
                this.dropzone.classList.remove('loading');
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            this.showError(error.message);
            this.dropzone.classList.remove('loading');
        }
    }

    addPreview(imageData) {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'image-preview-item';
        previewDiv.dataset.imageId = imageData.id;
        
        const img = document.createElement('img');
        img.src = imageData.dataUrl;
        img.alt = 'Screenshot preview';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
        removeBtn.addEventListener('click', () => this.removeImage(imageData.id));
        
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.textContent = `${Math.round(imageData.size / 1024)}KB`;
        
        previewDiv.appendChild(img);
        previewDiv.appendChild(removeBtn);
        previewDiv.appendChild(fileInfo);
        
        this.previewContainer.appendChild(previewDiv);
        this.previewContainer.classList.remove('hidden');
        this.dropzone.classList.remove('loading');
        
        // Animate in
        setTimeout(() => previewDiv.classList.add('show'), 10);
    }

    removeImage(imageId) {
        // Remove from array
        this.images = this.images.filter(img => img.id !== imageId);
        
        // Remove preview element
        const previewEl = this.previewContainer.querySelector(`[data-image-id="${imageId}"]`);
        if (previewEl) {
            previewEl.classList.remove('show');
            setTimeout(() => previewEl.remove(), 300);
        }
        
        // Update UI
        this.updateUI();
    }
    
    updateUI() {
        // Update submit button
        this.submitBtn.disabled = this.images.length === 0;
        
        // Update counter
        const counter = document.getElementById('imageCounter');
        if (counter) {
            counter.textContent = `${this.images.length}/${this.maxImages} images`;
        }
        
        // Hide preview container if no images
        if (this.images.length === 0) {
            this.previewContainer.classList.add('hidden');
        }
        
        // Update dropzone text
        const dropzoneText = this.dropzone.querySelector('.dropzone-text');
        if (dropzoneText) {
            if (this.images.length > 0) {
                dropzoneText.textContent = 'Add more screenshots';
            } else {
                dropzoneText.textContent = 'Paste screenshot here';
            }
        }
    }

    gatherData() {
        if (this.images.length === 0) {
            this.showError('Please provide at least one screenshot');
            this.dropzone.classList.add('error');
            setTimeout(() => {
                this.dropzone.classList.remove('error');
            }, 300);
            throw new Error('No screenshots provided');
        }
        
        return {
            images: this.images.map(img => ({
                dataUrl: img.dataUrl,
                width: img.width,
                height: img.height,
                size: img.size,
                type: img.type,
                name: img.name
            })),
            additionalText: this.additionalTextArea.value.trim()
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
    window.screenshotRequestDialog = new ScreenshotRequestDialog();
});