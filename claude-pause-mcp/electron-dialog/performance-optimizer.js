// Performance Optimizer for Windows
class PerformanceOptimizer {
    constructor() {
        this.isWindows = navigator.platform.includes('Win');
        this.frameTimeTarget = 16.67; // 60 FPS
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;
        
        // Debounce timers
        this.debounceTimers = new Map();
        
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        console.log('Initializing performance optimizations...');
        
        // Apply Windows-specific optimizations
        if (this.isWindows) {
            this.optimizeForWindows();
        }
        
        // Disable continuous animations
        this.disableContinuousAnimations();
        
        // Optimize shadows
        this.optimizeShadows();
        
        // Add performance monitoring
        this.setupPerformanceMonitoring();
        
        // Optimize event handlers
        this.optimizeEventHandlers();
        
        // Optimize markdown rendering
        this.optimizeMarkdownRendering();
        
        // Clean up memory leaks
        this.setupMemoryCleanup();
    }
    
    optimizeForWindows() {
        // Add Windows-specific class
        document.body.classList.add('windows-optimized');
        
        // Create and inject optimization styles
        const style = document.createElement('style');
        style.id = 'windows-optimizations';
        style.textContent = `
            .windows-optimized * {
                /* Force hardware acceleration */
                transform: translateZ(0);
                backface-visibility: hidden;
            }
            
            /* Disable backdrop filters on Windows */
            .windows-optimized .header,
            .windows-optimized .mode-toggle,
            .windows-optimized .settings-menu,
            .windows-optimized .visual-output-container,
            .windows-optimized .context {
                backdrop-filter: none !important;
                background: rgba(30, 30, 46, 0.98) !important;
            }
            
            /* Simplify shadows */
            .windows-optimized .dialog-container {
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3) !important;
            }
            
            .windows-optimized .mode-button {
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
            }
            
            .windows-optimized .submit-button {
                box-shadow: 0 4px 8px rgba(166, 227, 161, 0.3) !important;
            }
            
            /* Remove inset shadows */
            .windows-optimized *:not(input):not(textarea) {
                box-shadow: none !important;
            }
            
            /* Optimize fonts */
            .windows-optimized {
                font-family: 'Segoe UI', system-ui, sans-serif !important;
                -webkit-font-smoothing: auto !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    disableContinuousAnimations() {
        // Find all elements with continuous animations
        const animatedElements = document.querySelectorAll('[style*="animation"]');
        animatedElements.forEach(el => {
            const style = el.getAttribute('style');
            if (style && style.includes('infinite')) {
                // Remove infinite animations
                el.style.animationIterationCount = '1';
                el.style.animationPlayState = 'paused';
            }
        });
        
        // Disable gradient animations
        const gradientBg = document.querySelector('.gradient-background');
        if (gradientBg) {
            gradientBg.style.animation = 'none';
        }
    }
    
    optimizeShadows() {
        // Replace complex shadows with simpler ones
        const shadowElements = document.querySelectorAll('[style*="box-shadow"]');
        shadowElements.forEach(el => {
            const shadow = getComputedStyle(el).boxShadow;
            if (shadow && shadow.includes('inset')) {
                // Remove inset shadows
                const newShadow = shadow.split(',')
                    .filter(s => !s.includes('inset'))
                    .join(',');
                el.style.boxShadow = newShadow || '0 2px 4px rgba(0,0,0,0.1)';
            }
        });
    }
    
    setupPerformanceMonitoring() {
        // FPS counter
        const fpsCounter = document.createElement('div');
        fpsCounter.id = 'fps-counter';
        fpsCounter.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: #0f0;
            padding: 4px 8px;
            font-family: monospace;
            font-size: 12px;
            border-radius: 4px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(fpsCounter);
        
        // Update FPS
        const updateFPS = () => {
            const now = performance.now();
            const delta = now - this.lastFrameTime;
            this.frameCount++;
            
            if (this.frameCount % 30 === 0) {
                this.fps = Math.round(1000 / delta);
                fpsCounter.textContent = `FPS: ${this.fps}`;
                fpsCounter.style.color = this.fps >= 50 ? '#0f0' : (this.fps >= 30 ? '#ff0' : '#f00');
            }
            
            this.lastFrameTime = now;
            requestAnimationFrame(updateFPS);
        };
        
        requestAnimationFrame(updateFPS);
    }
    
    optimizeEventHandlers() {
        // Debounce helper
        this.debounce = (func, wait, immediate) => {
            let timeout;
            return (...args) => {
                const later = () => {
                    timeout = null;
                    if (!immediate) func(...args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func(...args);
            };
        };
        
        // Optimize resize events
        const originalResize = window.onresize;
        window.onresize = this.debounce(() => {
            if (originalResize) originalResize();
        }, 100);
        
        // Optimize scroll events
        const scrollElements = document.querySelectorAll('[onscroll]');
        scrollElements.forEach(el => {
            const originalHandler = el.onscroll;
            el.onscroll = this.debounce(() => {
                if (originalHandler) originalHandler();
            }, 16);
        });
    }
    
    optimizeMarkdownRendering() {
        // Override renderMarkdown if it exists
        if (typeof window.renderMarkdown === 'function') {
            const originalRender = window.renderMarkdown;
            window.renderMarkdown = this.debounce((text) => {
                // Use requestIdleCallback for non-critical rendering
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(() => originalRender(text));
                } else {
                    originalRender(text);
                }
            }, 100);
        }
    }
    
    setupMemoryCleanup() {
        // Clean up event listeners periodically
        this.listenerCleanupInterval = setInterval(() => {
            // Remove orphaned event listeners
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const listeners = getEventListeners ? getEventListeners(el) : {};
                Object.keys(listeners).forEach(event => {
                    if (listeners[event].length > 5) {
                        console.warn(`Element has ${listeners[event].length} ${event} listeners, cleaning up...`);
                        // Keep only last 5 listeners
                        listeners[event].slice(0, -5).forEach(listener => {
                            el.removeEventListener(event, listener.listener);
                        });
                    }
                });
            });
        }, 30000); // Every 30 seconds
        
        // Clean up on window unload
        window.addEventListener('beforeunload', () => {
            clearInterval(this.listenerCleanupInterval);
            // Remove all custom styles
            document.getElementById('windows-optimizations')?.remove();
            document.getElementById('fps-counter')?.remove();
        });
    }
    
    // Public API
    enableAnimations() {
        document.body.classList.remove('windows-optimized');
    }
    
    disableAnimations() {
        document.body.classList.add('windows-optimized');
    }
    
    getPerformanceStats() {
        return {
            fps: this.fps,
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
                total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
            } : 'N/A'
        };
    }
}

// Auto-initialize
const performanceOptimizer = new PerformanceOptimizer();

// Export for use in other scripts
window.performanceOptimizer = performanceOptimizer;