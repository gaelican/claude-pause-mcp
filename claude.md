# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Claude Pause MCP (Model Context Protocol) server - a custom MCP that provides an interactive dialog system via a React/Electron parent application for gathering user input during development decisions. It features a modern UI with glass morphism effects, particle animations, and multiple thinking modes.

## Common Development Commands

### MCP Server (claude-pause-mcp)

#### Setup and Installation
```bash
# Navigate to MCP server directory
cd claude-pause-mcp

# Install dependencies (use --legacy-peer-deps if needed)
npm install --legacy-peer-deps

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

# The parent app should be running to handle dialogs
# See Parent Application section below
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
# Use .bat file instead of .sh
dialog.bat
```

## High-Level Architecture

### Core Components

1. **MCP Server** (`claude-pause-mcp/src/index.js`)
   - Implements Model Context Protocol server
   - Provides tools: text_input, single_choice, multi_choice, confirm, screenshot_request, planner
   - Communicates with parent app via WebSocket on port 3030
   - Handles preference storage and workflow guidance

2. **Parent Application** (`claude-pause-parent/`)
   - React/TypeScript/Vite-based Electron app
   - Magic UI design system with glass morphism effects
   - Features: Active dialogs tab, History tab, Settings panel
   - Particle effects and aurora backgrounds
   - WebSocket server for MCP communication
   - Handles all dialog rendering via React components

3. **Dialog System Architecture**
   - **WebSocket Communication**: Real-time bidirectional communication between MCP and parent app
   - **React Components**: Individual dialog components for each type (TextInputDialog, SingleChoiceDialog, etc.)
   - **IPC for Preferences**: Electron IPC for secure preference storage (thinking mode persistence)
   - **Hot Reload**: Vite dev server enables instant UI updates

4. **Key Components in Parent App**
   - `src/main/index.js` - Electron main process with WebSocket server
   - `src/renderer/components/dialogs/` - React dialog components
   - `src/renderer/context/DialogContext.tsx` - Dialog state management
   - `src/renderer/styles/magic-*.css` - Magic UI styling

### Key Design Patterns

- **WebSocket Architecture**: Real-time communication between MCP server and parent app
- **JSON Communication**: All dialog communication uses JSON messages
- **Component-Based UI**: React components for each dialog type
- **IPC Preferences**: Secure preference storage via Electron IPC (e.g., thinking mode persistence)
- **Hot Module Replacement**: Vite HMR for instant UI updates during development

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

## Claude Code Workflow Memories

- Always run the planner after finishing your task