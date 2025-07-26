# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Claude Pause MCP (Model Context Protocol) server - a custom MCP that provides an interactive dialog system for gathering user input during development decisions. It features multiple UI rendering options (Electron, Python tkinter, Web-based) and supports different thinking modes.

## Common Development Commands

### MCP Server (claude-pause-mcp)

#### Setup and Installation
```bash
# Navigate to MCP server directory
cd claude-pause-mcp

# Install dependencies (use --legacy-peer-deps if needed)
npm install --legacy-peer-deps
cd electron-dialog && npm install && cd ..

# The MCP server should be configured in Claude Code's settings
# Add to your claude_desktop_config.json:
{
  "mcpServers": {
    "claude-pause": {
      "command": "node",
      "args": ["C:/Users/gaelican/projects/claude-pause/claude-pause-mcp/src/index.js"],
      "cwd": "C:/Users/gaelican/projects/claude-pause/claude-pause-mcp"
    }
  }
}
```

#### Running the Server
```bash
# Start MCP server (usually started automatically by Claude Code)
npm start

# Test dialog directly
./dialog.sh '{"decision_context":"Test","options":["A","B"]}'

# Start persistent mode (recommended for frequent use)
./start-persistent-dialog.sh

# Test WebSocket connection
node test-websocket.js
```

### Parent Application (claude-pause-parent)
```bash
cd claude-pause-parent

# Install dependencies
npm install

# Development mode - Run in two separate terminals:
# Terminal 1: Start Vite dev server
npx vite --host --port 3001

# Terminal 2: Start Electron in dev mode
npx electron . --dev

# Build application
npm run build

# Start production mode
npm start
```

### Windows-specific commands
```bash
# Use .bat files instead of .sh
dialog.bat
test-direct.bat
test-electron.bat
```

## High-Level Architecture

### Core Components

1. **MCP Server** (`src/index.js`)
   - Implements Model Context Protocol server
   - Provides tools: text_input, single_choice, multi_choice, confirm, screenshot_request, planner
   - Manages dialog execution through external scripts
   - Supports both standard and persistent WebSocket modes

2. **Dialog System** 
   - **Dispatcher** (`dialog.sh/dialog.bat`) - Routes to appropriate UI implementation
   - **Electron Dialog** (`electron-dialog/`) - Native window with best rendering quality
   - **Python Dialog** (`dialog.py`) - Cross-platform tkinter implementation
   - **Web Dialog** (`dialog-web.py`) - Browser-based interface
   - External script architecture allows hot-reloading without MCP restart

3. **Persistent Mode Architecture**
   - WebSocket server in Electron dialog (`electron-dialog/websocket-server.js`)
   - WebSocket client in MCP server (`src/websocket-client.js`)
   - System tray integration for always-available dialog
   - Request queue management for rapid interactions

4. **Parent Application** (`claude-pause-parent/`)
   - React/TypeScript/Vite-based Electron app
   - Magic UI design system with glass morphism effects
   - Features: Active dialogs tab, History tab, Settings panel
   - Particle effects and aurora backgrounds

### Key Design Patterns

- **External Script Execution**: Dialog scripts are executed as separate processes, enabling hot-reload without restarting the MCP server
- **JSON Communication**: All dialog communication uses JSON via stdin/stdout
- **Response Format**: `response|||thinking_mode|||planning_mode`
- **Preference Persistence**: Window bounds, thinking mode, and planning mode saved between sessions

### Dialog Types and Their Use Cases

- **text_input**: Free-form text responses
- **single_choice**: Select one option from a list
- **multi_choice**: Select multiple options
- **confirm**: Yes/No confirmations
- **screenshot_request**: Request and capture screenshots
- **planner**: Comprehensive planning with visual output support

## Important Implementation Details

1. **Thinking Modes**: Quick, Normal, Deep, Ultra - each adds specific prefixes to guide Claude's analysis depth
2. **Planning Mode**: When enabled, appends request for complete implementation plan
3. **Visual Output**: Supports displaying diagrams, layouts, and code structures in dialog
4. **History Management**: Recent responses stored and accessible via dropdown
5. **WebSocket Protocol**: Uses simple JSON messages with type, dialogId, and data fields