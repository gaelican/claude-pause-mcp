# Claude Pause Deployment Guide

This guide provides comprehensive instructions for setting up and deploying the Claude Pause MCP server and parent application.

## Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Comes with Node.js
- **Python**: For fallback dialog implementation
- **Git**: For version control
- **Claude Code**: With MCP support enabled

## Quick Start

### 1. Clone the Repository
```bash
git clone [repository-url]
cd claude-pause
```

### 2. Install MCP Server
```bash
cd claude-pause-mcp
npm install --legacy-peer-deps
cd electron-dialog && npm install && cd ..
```

### 3. Configure Claude Code
Add to your `claude_desktop_config.json` (usually in `%APPDATA%\Claude\` on Windows):
```json
{
  "mcpServers": {
    "claude-pause": {
      "command": "node",
      "args": ["C:/Users/[your-username]/projects/claude-pause/claude-pause-mcp/src/index.js"],
      "cwd": "C:/Users/[your-username]/projects/claude-pause/claude-pause-mcp"
    }
  }
}
```

### 4. Install Parent Application (Optional)
```bash
cd ../claude-pause-parent
npm install --legacy-peer-deps
```

## Detailed Setup Instructions

### MCP Server Setup

1. **Navigate to MCP directory**:
   ```bash
   cd claude-pause-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```
   
   > **Note**: The `--legacy-peer-deps` flag is required due to dependency version conflicts.

3. **Install dialog dependencies**:
   ```bash
   cd electron-dialog
   npm install
   cd ..
   ```

4. **Test the installation**:
   ```bash
   npm start
   ```
   
   You should see: `MCP server running on stdio`

### Parent Application Setup

1. **Navigate to parent directory**:
   ```bash
   cd claude-pause-parent
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Run in development mode**:
   
   Open two terminals:
   
   **Terminal 1** (Vite dev server):
   ```bash
   npx vite --host --port 3001
   ```
   
   **Terminal 2** (Electron):
   ```bash
   npx electron . --dev
   ```

4. **Run in production mode**:
   ```bash
   npm start
   ```

## Troubleshooting

### ERESOLVE Dependency Conflicts

**Error**: `npm error code ERESOLVE`

**Solution**:
```bash
npm install --legacy-peer-deps
```

### EPIPE WebSocket Errors

**Error**: `Error: EPIPE: broken pipe, write`

**Solution**: This has been fixed in the latest version. Ensure you have the latest code with WebSocket error handlers.

### MCP Server Not Starting

1. Check Claude Code logs
2. Verify the path in `claude_desktop_config.json` is correct
3. Ensure Node.js is in your PATH
4. Try running the server directly:
   ```bash
   node src/index.js
   ```

### Dialog Not Appearing

1. Check if electron-dialog dependencies are installed
2. Test dialog directly:
   ```bash
   # Windows
   dialog.bat "{\"decision_context\":\"Test\",\"options\":[\"A\",\"B\"]}"
   
   # Mac/Linux
   ./dialog.sh '{"decision_context":"Test","options":["A","B"]}'
   ```

### Permission Issues on Mac/Linux

```bash
chmod +x dialog.sh
chmod +x electron-dialog/main.js
```

## Testing the Installation

### 1. Test MCP Tools
In Claude Code, run:
```
/mcp planner
```

### 2. Test Dialog System
```bash
node test-dialog.js
```

### 3. Test WebSocket Connection
```bash
node test-websocket.js
```

## Environment-Specific Notes

### Windows
- Use `.bat` files instead of `.sh` scripts
- Paths should use forward slashes in configurations
- May need to allow Node.js through Windows Firewall

### macOS
- May need to grant screen recording permissions for screenshot tool
- Use `chmod +x` on shell scripts

### Linux
- Ensure Python tkinter is installed: `sudo apt-get install python3-tk`
- May need to install additional X11 dependencies for Electron

## Advanced Configuration

### Persistent Dialog Mode
For better performance with frequent dialogs:
```bash
./start-persistent-dialog.sh
```

This keeps the dialog process running and uses WebSocket for communication.

### Custom Dialog Themes
Edit `electron-dialog/index.html` and associated CSS files to customize appearance.

### Alternative Dialog Implementations
- **Electron** (default): Best appearance and performance
- **Python**: Cross-platform fallback
- **Web**: Browser-based option

## Deployment Checklist

- [ ] Node.js installed and in PATH
- [ ] Repository cloned
- [ ] MCP server dependencies installed with `--legacy-peer-deps`
- [ ] Electron dialog dependencies installed
- [ ] Claude Code configuration updated
- [ ] MCP server test successful
- [ ] Dialog test successful
- [ ] Parent app installed (if needed)
- [ ] All platform-specific issues resolved

## Getting Help

1. Check the error logs in Claude Code
2. Run diagnostic commands in this guide
3. Consult the deployment specialist agent: `@deployment-specialist help`
4. Review TROUBLESHOOTING.md for additional solutions

## Version Requirements

- Node.js: 16.0.0 or higher
- npm: 7.0.0 or higher
- Electron: 28.0.0 (bundled)
- Python: 3.7+ (for Python dialog)

Last updated: 2025-01-26