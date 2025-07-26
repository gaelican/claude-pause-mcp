# Claude Pause Troubleshooting Guide

This guide covers common issues and their solutions when working with Claude Pause MCP server and parent application.

## Common Issues

### 1. ERESOLVE Dependency Conflicts

**Symptoms**:
```
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error While resolving: react-native@0.71.14
npm error Found: react@19.1.0
```

**Root Cause**: Version conflicts between React dependencies in the project.

**Solutions**:
1. **Use legacy peer deps** (Recommended):
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Force install** (Use with caution):
   ```bash
   npm install --force
   ```

3. **Clear npm cache and retry**:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

### 2. EPIPE WebSocket Errors

**Symptoms**:
```
Error: EPIPE: broken pipe, write
at Socket._write (node:internal/net:61:25)
at WebSocket.emit (node:events:517:28)
```

**Root Cause**: WebSocket connection closed while trying to write data.

**Solutions**:
1. **Update to latest version** - This issue has been fixed with proper error handlers
2. **Manual fix** - Add error handlers to WebSocket connections:
   ```javascript
   ws.on('error', (error) => {
     if (error.code === 'EPIPE') {
       console.log('WebSocket EPIPE error - client disconnected');
     }
     clients.delete(ws);
   });
   ```

### 3. MCP Server Not Recognized

**Symptoms**:
- Claude Code doesn't show the MCP tools
- "MCP server not found" errors

**Solutions**:
1. **Verify configuration path**:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **Check JSON syntax**:
   ```json
   {
     "mcpServers": {
       "claude-pause": {
         "command": "node",
         "args": ["C:/full/path/to/claude-pause-mcp/src/index.js"],
         "cwd": "C:/full/path/to/claude-pause-mcp"
       }
     }
   }
   ```

3. **Restart Claude Code** after configuration changes

### 4. Dialog Window Not Appearing

**Symptoms**:
- MCP tool runs but no dialog appears
- Timeout errors

**Solutions**:
1. **Check Electron dependencies**:
   ```bash
   cd claude-pause-mcp/electron-dialog
   npm install
   ```

2. **Test dialog directly**:
   ```bash
   # Windows
   cd claude-pause-mcp
   dialog.bat "{\"decision_context\":\"Test\"}"
   
   # Mac/Linux
   ./dialog.sh '{"decision_context":"Test"}'
   ```

3. **Check Python fallback**:
   ```bash
   python dialog.py '{"decision_context":"Test"}'
   ```

### 5. Permission Denied Errors (Mac/Linux)

**Symptoms**:
```
bash: ./dialog.sh: Permission denied
```

**Solutions**:
```bash
chmod +x dialog.sh
chmod +x electron-dialog/main.js
chmod +x start-persistent-dialog.sh
```

### 6. Python Dialog Errors

**Symptoms**:
- `ModuleNotFoundError: No module named 'tkinter'`
- Python dialog fallback not working

**Solutions**:
1. **Install tkinter**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install python3-tk
   
   # macOS (usually pre-installed)
   # If missing, reinstall Python from python.org
   
   # Windows (usually included)
   # If missing, reinstall Python with tkinter option
   ```

2. **Verify Python version**:
   ```bash
   python --version  # Should be 3.7+
   ```

### 7. WebSocket Connection Issues

**Symptoms**:
- "WebSocket connection failed"
- Parent app can't connect to MCP

**Solutions**:
1. **Check port availability**:
   ```bash
   # Windows
   netstat -an | findstr :3030
   
   # Mac/Linux
   lsof -i :3030
   ```

2. **Firewall settings**:
   - Allow Node.js through firewall
   - Allow port 3030 for local connections

3. **Test WebSocket server**:
   ```bash
   cd claude-pause-mcp
   node test-websocket.js
   ```

### 8. Electron App White Screen

**Symptoms**:
- Parent app opens but shows blank white screen
- No content loads

**Solutions**:
1. **Check dev server**:
   ```bash
   # Ensure Vite is running on port 3001
   npx vite --host --port 3001
   ```

2. **Clear Electron cache**:
   ```bash
   # Windows
   rmdir /s /q %APPDATA%\claude-pause-parent
   
   # Mac/Linux
   rm -rf ~/.config/claude-pause-parent
   ```

### 9. Build Failures

**Symptoms**:
- TypeScript errors during build
- Vite build failures

**Solutions**:
1. **Clean build**:
   ```bash
   rm -rf dist node_modules
   npm install --legacy-peer-deps
   npm run build
   ```

2. **Check TypeScript config**:
   - Ensure `tsconfig.json` exists
   - Verify all imports have proper types

### 10. Screenshot Tool Not Working

**Symptoms**:
- Screenshot request fails
- "screenshot-desktop" errors

**Solutions**:
1. **Windows**: Usually works out of the box
2. **macOS**: Grant screen recording permissions:
   - System Preferences > Security & Privacy > Screen Recording
   - Add Terminal/Claude Code
3. **Linux**: Install required packages:
   ```bash
   sudo apt-get install imagemagick
   ```

## Diagnostic Commands

Run these commands to help diagnose issues:

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Test MCP server directly
cd claude-pause-mcp
node src/index.js

# Test dialog system
node test-dialog.js

# Check for port conflicts
netstat -an | grep 3030

# Verify file permissions (Mac/Linux)
ls -la dialog.sh electron-dialog/main.js
```

## Getting More Help

1. **Use the deployment specialist agent**:
   ```
   @deployment-specialist I'm getting [specific error]
   ```

2. **Check logs**:
   - Claude Code logs: Help menu > Toggle Developer Tools
   - Electron logs: Check console output when running

3. **Enable debug mode**:
   ```bash
   DEBUG=* npm start
   ```

## Prevention Tips

1. Always use `--legacy-peer-deps` when installing
2. Keep Node.js updated (v16+)
3. Commit working `package-lock.json` files
4. Test changes incrementally
5. Use the deployment specialist agent for guidance

Last updated: 2025-01-26