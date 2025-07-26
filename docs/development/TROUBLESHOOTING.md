# Troubleshooting Guide

## Table of Contents
1. [Common Issues](#common-issues)
2. [Development Issues](#development-issues)
3. [Runtime Errors](#runtime-errors)
4. [Performance Issues](#performance-issues)
5. [Build Issues](#build-issues)
6. [Platform-Specific Issues](#platform-specific-issues)
7. [Debugging Tools](#debugging-tools)
8. [FAQ](#faq)

## Common Issues

### App Won't Start

#### Symptoms
- Electron window doesn't appear
- Process exits immediately
- No error messages

#### Solutions

1. **Check Node version**:
```bash
node --version  # Should be v18.0.0 or higher
```

2. **Clear cache and reinstall**:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

3. **Check for port conflicts**:
```bash
# Check if ports are in use
lsof -i :3000  # WebSocket port
lsof -i :5173  # Vite dev server

# Kill processes if needed
kill -9 $(lsof -t -i :3000)
```

4. **Enable verbose logging**:
```bash
DEBUG=* ELECTRON_ENABLE_LOGGING=1 npm run dev
```

5. **Check Electron installation**:
```bash
# Verify Electron is installed
npx electron --version

# Rebuild if needed
npm run rebuild
```

### WebSocket Connection Failed

#### Symptoms
- "Disconnected" status in app
- No dialog requests received
- WebSocket errors in console

#### Solutions

1. **Verify WebSocket server is running**:
```javascript
// Add to main process for debugging
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => console.log('WebSocket connected'));
ws.on('error', (err) => console.error('WebSocket error:', err));
```

2. **Check firewall settings**:
- Windows: Allow Node.js through Windows Defender Firewall
- macOS: Check Security & Privacy settings
- Linux: Check iptables rules

3. **Test with wscat**:
```bash
npm install -g wscat
wscat -c ws://localhost:3000
```

4. **Check for multiple instances**:
```bash
# Find all Electron processes
ps aux | grep electron

# Kill duplicates
pkill -f electron
```

### Dialog Not Appearing

#### Symptoms
- Dialog request sent but UI doesn't update
- Console shows request received
- No error messages

#### Solutions

1. **Check Dialog Context**:
```javascript
// In React DevTools Console
$r.context.state.activeDialogs
```

2. **Verify IPC communication**:
```javascript
// In main process
ipcMain.on('*', (event, channel, ...args) => {
  console.log(`IPC: ${channel}`, args);
});

// In renderer console
window.electronAPI.onDialogRequest((data) => {
  console.log('Dialog request received:', data);
});
```

3. **Check for React errors**:
```javascript
// Add error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('React error:', error, errorInfo);
  }
  render() {
    return this.props.children;
  }
}
```

4. **Verify dialog type mapping**:
```javascript
// Check if dialog type is registered
const dialogComponents = {
  'planner': PlannerDialog,
  'text_input': TextInputDialog,
  // ... make sure your type is here
};
```

## Development Issues

### Hot Reload Not Working

#### Symptoms
- Changes don't appear after saving
- Need to manually refresh
- HMR disconnected messages

#### Solutions

1. **Clear Vite cache**:
```bash
rm -rf node_modules/.vite
```

2. **Check Vite config**:
```typescript
// vite.config.ts
export default {
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    }
  }
}
```

3. **Disable antivirus for dev folder**:
- Some antivirus software interferes with file watching

4. **Use polling mode**:
```typescript
// vite.config.ts
export default {
  server: {
    watch: {
      usePolling: true,
      interval: 100
    }
  }
}
```

### TypeScript Errors

#### Symptoms
- Red squiggles in VS Code
- Build fails with type errors
- IntelliSense not working

#### Solutions

1. **Restart TS server**:
- VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

2. **Clear TS cache**:
```bash
rm -rf node_modules/.cache/typescript
```

3. **Check tsconfig.json**:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

4. **Regenerate types**:
```bash
npm run type-check -- --force
```

### ESLint/Prettier Conflicts

#### Symptoms
- Format on save creates loops
- Conflicting style rules
- CI fails on linting

#### Solutions

1. **Ensure correct order in .eslintrc**:
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier" // Must be last
  ]
}
```

2. **VS Code settings**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

3. **Run format fix**:
```bash
npm run format:fix
npm run lint:fix
```

## Runtime Errors

### Memory Leaks

#### Symptoms
- App becomes sluggish over time
- Memory usage increases continuously
- Eventual crash

#### Diagnosis

1. **Monitor memory usage**:
```javascript
// Add to main process
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory:', {
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`
  });
}, 30000);
```

2. **Use Chrome DevTools Memory Profiler**:
- Take heap snapshots
- Compare snapshots over time
- Look for detached DOM nodes

3. **Check for common leaks**:
```javascript
// Event listeners not removed
useEffect(() => {
  const handler = () => {};
  window.addEventListener('resize', handler);
  
  return () => {
    window.removeEventListener('resize', handler); // Don't forget!
  };
}, []);

// Timers not cleared
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  
  return () => {
    clearInterval(timer); // Clean up!
  };
}, []);
```

#### Solutions

1. **Use weak references**:
```javascript
const cache = new WeakMap();
```

2. **Limit array/history size**:
```javascript
const MAX_HISTORY = 100;
if (history.length > MAX_HISTORY) {
  history = history.slice(-MAX_HISTORY);
}
```

3. **Clean up on unmount**:
```javascript
useEffect(() => {
  return () => {
    // Clean up subscriptions, timers, etc.
    subscription.unsubscribe();
    clearTimeout(timeoutId);
    abortController.abort();
  };
}, []);
```

### Uncaught Promise Rejections

#### Symptoms
- Console warnings about unhandled rejections
- Async operations failing silently
- Inconsistent app state

#### Solutions

1. **Add global handler**:
```javascript
// Main process
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Send to logging service
});

// Renderer process
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});
```

2. **Always use try-catch with async/await**:
```javascript
const handleSubmit = async () => {
  try {
    await sendResponse(data);
  } catch (error) {
    console.error('Submit failed:', error);
    showErrorMessage(error.message);
  }
};
```

3. **Use error boundaries**:
```javascript
class AsyncErrorBoundary extends Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }
}
```

### IPC Communication Errors

#### Symptoms
- "Cannot read property 'invoke' of undefined"
- IPC calls not reaching main process
- Responses not received

#### Solutions

1. **Check preload script**:
```javascript
// Ensure contextBridge is set up correctly
contextBridge.exposeInMainWorld('electronAPI', {
  sendDialogResponse: (response) => 
    ipcRenderer.invoke('dialog-response', response)
});
```

2. **Verify handler registration**:
```javascript
// Main process - must be before window creation
ipcMain.handle('dialog-response', async (event, response) => {
  // Handler implementation
});
```

3. **Debug IPC messages**:
```javascript
// Main process
ipcMain.on('*', (event, channel) => {
  console.log('IPC received:', channel);
});

// Renderer
const originalInvoke = window.electronAPI.sendDialogResponse;
window.electronAPI.sendDialogResponse = async (...args) => {
  console.log('IPC sending:', args);
  return originalInvoke(...args);
};
```

## Performance Issues

### Slow Rendering

#### Symptoms
- Janky animations
- Delayed user input response
- Low FPS

#### Diagnosis

1. **React DevTools Profiler**:
- Record a session
- Look for components taking >16ms to render
- Check for unnecessary re-renders

2. **Chrome DevTools Performance**:
- Record performance profile
- Look for long tasks
- Check paint/layout thrashing

#### Solutions

1. **Optimize re-renders**:
```javascript
// Use React.memo
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* ... */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});

// Use useMemo for expensive computations
const processedData = useMemo(() => {
  return expensiveProcessing(rawData);
}, [rawData]);
```

2. **Virtualize long lists**:
```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {Row}
</FixedSizeList>
```

3. **Debounce updates**:
```javascript
const debouncedValue = useDebounce(value, 300);

useEffect(() => {
  // Only run expensive operation after debounce
  performSearch(debouncedValue);
}, [debouncedValue]);
```

### High CPU Usage

#### Symptoms
- Fan spinning constantly
- Battery draining quickly
- System lag

#### Solutions

1. **Profile CPU usage**:
```bash
# In Chrome DevTools
# Performance tab → CPU throttling → 4x slowdown
# Record and analyze
```

2. **Optimize animations**:
```css
/* Use transform instead of position */
.animated {
  will-change: transform;
  transform: translateX(0);
}

/* Disable animations on low-end devices */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

3. **Reduce particle effects**:
```javascript
// Detect performance
const reduceEffects = navigator.hardwareConcurrency < 4;

if (reduceEffects) {
  particleCount = 30; // Instead of 100
}
```

## Build Issues

### Build Fails

#### Common errors and solutions

1. **Native module errors**:
```bash
# Rebuild for Electron
npm run rebuild

# Or manually
npx electron-rebuild

# For specific module
npx electron-rebuild -f -w module-name
```

2. **Out of memory**:
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

3. **Path too long (Windows)**:
```bash
# Enable long paths
git config --system core.longpaths true

# Or move project closer to root
# C:\cp instead of C:\Users\Username\Documents\Projects\...
```

### Production Build Issues

1. **Missing dependencies**:
```bash
# Check for missing production deps
npm ls --production

# Move from devDependencies if needed
npm install --save package-name
```

2. **Environment variables**:
```javascript
// Use dotenv for production
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.local'
});
```

3. **Code signing issues**:
```bash
# macOS
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=password

# Windows
set CSC_LINK=C:\path\to\certificate.pfx
set CSC_KEY_PASSWORD=password
```

## Platform-Specific Issues

### Windows

1. **Blank white screen**:
```javascript
// Disable hardware acceleration
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
```

2. **Path separator issues**:
```javascript
// Use path.join instead of string concatenation
const configPath = path.join(__dirname, '..', 'config', 'settings.json');
```

3. **Window controls not working**:
```javascript
// Ensure proper window configuration
mainWindow = new BrowserWindow({
  frame: false,
  titleBarStyle: 'hidden',
  // Windows specific
  titleBarOverlay: {
    color: '#0f172a',
    symbolColor: '#ffffff'
  }
});
```

### macOS

1. **App not opening**:
```bash
# Clear quarantine
xattr -cr /Applications/Claude\ Pause.app

# Check code signing
codesign -vvv --deep --strict /Applications/Claude\ Pause.app
```

2. **Notarization issues**:
```bash
# Check notarization status
xcrun altool --notarization-info <RequestUUID> \
  --username <AppleID> \
  --password <AppSpecificPassword>
```

### Linux

1. **Missing libraries**:
```bash
# Install required libraries
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6

# For audio
sudo apt-get install libasound2
```

2. **Sandbox issues**:
```bash
# Run without sandbox (not recommended for production)
npm run start -- --no-sandbox
```

## Debugging Tools

### Chrome DevTools

1. **Open DevTools**:
```javascript
// Automatically in dev
if (isDev) {
  mainWindow.webContents.openDevTools();
}

// Or use F12 / Cmd+Opt+I
```

2. **Useful tabs**:
- **Console**: Errors and logs
- **Network**: WebSocket frames
- **Performance**: Rendering issues
- **Memory**: Leak detection
- **Application**: Local storage, IndexedDB

### Electron-specific Debugging

1. **Main process debugging**:
```bash
# Start with inspector
npm run dev:main -- --inspect

# Open chrome://inspect in Chrome
```

2. **IPC monitoring**:
```javascript
// Log all IPC in main
require('electron').ipcMain.on('*', (event, channel) => {
  console.log('IPC:', channel);
});
```

3. **WebContents debugging**:
```javascript
// Get all webContents
const { webContents } = require('electron');
webContents.getAllWebContents().forEach(wc => {
  console.log('WebContents:', wc.getURL());
});
```

### Logging

1. **Structured logging**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

2. **Debug namespaces**:
```javascript
const debug = require('debug');
const log = debug('app:dialog');

log('Dialog created', { id, type });

// Enable with DEBUG=app:* npm run dev
```

## FAQ

### Q: Why is my dialog not responding to clicks?

**A**: Check for:
- Overlapping elements with higher z-index
- Event propagation being stopped
- Disabled state on buttons
- CSS pointer-events: none

### Q: How do I debug a production build?

**A**: 
1. Enable DevTools in production:
```javascript
// main.js
if (process.env.DEBUG_PROD === 'true') {
  mainWindow.webContents.openDevTools();
}
```

2. Add source maps:
```javascript
// vite.config.ts
build: {
  sourcemap: true
}
```

### Q: Why does the app crash on startup?

**A**: Common causes:
- Missing native modules (run `npm run rebuild`)
- Port already in use
- Corrupted cache (clear node_modules)
- Antivirus blocking

### Q: How do I reset the app to default state?

**A**: Clear all app data:
```javascript
// Main process
const { app } = require('electron');
app.relaunch();
app.exit();

// Or manually:
// Windows: %APPDATA%/claude-pause
// macOS: ~/Library/Application Support/claude-pause
// Linux: ~/.config/claude-pause
```

### Q: Why are my changes not appearing?

**A**: Try:
1. Hard refresh: Ctrl/Cmd + Shift + R
2. Clear cache: DevTools → Application → Clear Storage
3. Restart dev server
4. Check for TypeScript errors

### Q: How do I add a new dialog type?

**A**: See [Dialog Development](./DEVELOPMENT_WORKFLOW.md#dialog-development) in the development guide.

### Q: What's the best way to handle errors?

**A**: 
1. Use try-catch for async operations
2. Add error boundaries for React components
3. Implement global error handlers
4. Log errors with context
5. Show user-friendly error messages

### Q: How can I improve performance?

**A**: 
1. Profile first (don't guess)
2. Use React DevTools Profiler
3. Implement virtualization for long lists
4. Memoize expensive computations
5. Optimize re-renders with React.memo
6. Use production build for testing

### Q: Where are logs stored?

**A**: 
- **Development**: Console output
- **Production**:
  - Windows: `%USERPROFILE%\AppData\Roaming\claude-pause\logs`
  - macOS: `~/Library/Logs/claude-pause`
  - Linux: `~/.config/claude-pause/logs`

### Q: How do I contribute a fix?

**A**: 
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `npm run test`
6. Submit a pull request

## Getting Help

If you're still stuck:

1. **Check existing issues**: GitHub Issues
2. **Ask on Discord**: Join our community
3. **File a bug report**: Use issue template
4. **Enable debug logging**: `DEBUG=* npm run dev`
5. **Provide reproduction steps**: Minimal example

Remember to include:
- OS and version
- Node.js version
- Error messages
- Steps to reproduce
- Expected vs actual behavior