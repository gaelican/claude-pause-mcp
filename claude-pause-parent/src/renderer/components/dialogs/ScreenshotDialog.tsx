import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DialogWrapper from '../common/DialogWrapper';
import MagicDialog from '../ui/MagicDialog';
import { useDialogs } from '../../context/DialogContext';
import { ScreenshotParameters, ScreenshotResponse } from '../../types';

interface ScreenshotDialogProps {
  requestId: string;
  parameters: ScreenshotParameters;
}

export default function ScreenshotDialog({ requestId, parameters }: ScreenshotDialogProps) {
  const { sendResponse } = useDialogs();
  const [images, setImages] = useState<Array<{
    data: string;
    type: string;
    name: string;
  }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    setIsUploading(true);
    const promises = Array.from(files).map(file => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImages(prev => [...prev, {
            data: e.target?.result as string,
            type: file.type,
            name: file.name
          }]);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(() => {
      setIsUploading(false);
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.indexOf('image') !== -1);
    
    setIsUploading(true);
    const promises = imageItems.map(item => {
      return new Promise<void>((resolve) => {
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setImages(prev => [...prev, {
              data: event.target?.result as string,
              type: blob.type,
              name: `clipboard-${Date.now()}.png`
            }]);
            resolve();
          };
          reader.readAsDataURL(blob);
        } else {
          resolve();
        }
      });
    });

    Promise.all(promises).then(() => {
      setIsUploading(false);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const response: ScreenshotResponse = {
      images,
      additionalText: '',
      timestamp: new Date().toISOString(),
    };
    sendResponse(requestId, response);
  };

  const totalSize = images.reduce((acc, img) => acc + (img.data.length * 0.75 / 1024), 0); // Approximate KB

  return (
    <DialogWrapper requestId={requestId}>
      <MagicDialog className="screenshot-dialog-magic">
        <div className="magic-dialog-header">
          <h2 className="magic-dialog-title">📸 {parameters.question}</h2>
          {parameters.description && (
            <p className="magic-dialog-description">{parameters.description}</p>
          )}
        </div>

        <div 
          className="screenshot-area-magic"
          onPaste={handlePaste}
        >
          <motion.div
            className={`magic-screenshot-zone ${isDragging ? 'drag-over' : ''} ${images.length > 0 ? 'has-images' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !images.length && fileInputRef.current?.click()}
            whileHover={{ scale: images.length === 0 ? 1.02 : 1 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <AnimatePresence mode="wait">
              {isUploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="upload-state-magic"
                >
                  <div className="magic-loading">
                    <div className="magic-loading-dot" />
                    <div className="magic-loading-dot" />
                    <div className="magic-loading-dot" />
                  </div>
                  <p className="magic-screenshot-text">Processing images...</p>
                </motion.div>
              ) : images.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="drop-content-magic"
                >
                  <motion.div 
                    className="magic-screenshot-icon"
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    📷
                  </motion.div>
                  <p className="magic-screenshot-text">
                    Drop images here or paste from clipboard
                    <br />
                    <span className="text-sm opacity-60">Win+Shift+S to capture screen</span>
                  </p>
                  <motion.button 
                    className="magic-button magic-button-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>📁</span>
                    <span>Browse Files</span>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="has-images"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="images-grid-magic"
                >
                  <AnimatePresence>
                    {images.map((img, i) => (
                      <motion.div
                        key={`${img.name}-${i}`}
                        className="image-item-magic"
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.05, zIndex: 10 }}
                      >
                        <div className="image-wrapper-magic">
                          <img src={img.data} alt={img.name} />
                          <motion.button 
                            className="remove-image-magic"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(i);
                            }}
                            whileHover={{ scale: 1.2, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            ✕
                          </motion.button>
                        </div>
                        <p className="image-name-magic">{img.name}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  <motion.div
                    className="add-more-magic"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="add-icon">+</span>
                    <span className="add-text">Add More</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              multiple 
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </motion.div>

          {images.length > 0 && (
            <motion.div 
              className="screenshot-info-magic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="info-item">
                <span className="info-icon">🖼️</span>
                <span>{images.length} image{images.length !== 1 ? 's' : ''}</span>
              </span>
              <span className="info-item">
                <span className="info-icon">💾</span>
                <span>~{totalSize.toFixed(1)} KB</span>
              </span>
            </motion.div>
          )}
        </div>

        <div className="screenshot-tips-magic">
          <h4 className="tips-title">💡 Quick Tips:</h4>
          <ul className="tips-list">
            <li>Use <kbd>Win</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> to capture a screenshot</li>
            <li>Paste directly with <kbd>Ctrl</kbd>+<kbd>V</kbd></li>
            <li>Drag & drop multiple images at once</li>
          </ul>
        </div>

        <div className="magic-dialog-actions">
          <button 
            className="magic-button magic-button-secondary"
            onClick={() => sendResponse(requestId, { cancelled: true, timestamp: new Date().toISOString() })}
          >
            Cancel
          </button>
          <motion.button 
            className="magic-button magic-button-primary"
            onClick={handleSubmit}
            disabled={images.length === 0}
            whileHover={{ scale: images.length > 0 ? 1.02 : 1 }}
            whileTap={{ scale: images.length > 0 ? 0.98 : 1 }}
          >
            Submit {images.length > 0 && `(${images.length})`}
          </motion.button>
        </div>
      </MagicDialog>
    </DialogWrapper>
  );
}