# Claude Pause MCP (Model Context Protocol)

A custom MCP server for Claude Code that provides an interactive dialog system via a React/Electron parent application for gathering user input during development decisions.

## ✨ Key Features

- 🎨 **Modern React/Electron UI**:
  - **Parent Application** - Full React/TypeScript application with hot reload
  - **Magic UI Design** - Glass morphism effects and particle animations
  - **WebSocket Communication** - Real-time dialog handling
  - **Persistent Mode** - System tray integration for always-available dialogs

- 🎯 **Thinking Mode Selection**:
  - **Quick** - Fast responses with less analysis
  - **Normal** - Standard thinking depth
  - **Deep** - Extended analysis (slower)
  - **Ultra** - Maximum depth analysis (slowest)
  - Automatic prefix addition to responses based on mode
  - Mode persistence between sessions

- 💾 **Smart Persistence**:
  - Window position and size memory
  - Response history with quick access
  - Thinking mode preferences
  - Settings sync across dialog types
  - **NEW: Persistent Mode** - Keep dialog window open with WebSocket communication

- 🎨 **Beautiful Dark Theme**:
  - Catppuccin Mocha color scheme
  - Smooth animations and transitions
  - Custom styled scrollbars
  - Vibrant accent colors
  - Fade effects for long content

- 🎭 **Enhanced Features**:
  - Multiple choice options alongside custom text input
  - Visual output component for displaying layouts and diagrams
  - Planning mode toggle for systematic task planning
  - Request queue management in persistent mode

## 🚀 Installation

1. Clone this repository:
   ```bash
   git clone <repo-url>
   cd claude-pause-mcp
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Add to Claude Code:
   ```bash
   claude mcp add /path/to/claude-pause-mcp
   ```

## 📖 Usage

The MCP server provides a `pause_for_input` tool that Claude Code uses to request user input before making important decisions.

### Standard Mode vs Persistent Mode

**Standard Mode** (default):
- Dialog opens when needed, closes after response
- Minimal resource usage
- Good for occasional interactions

**Persistent Mode** (recommended for frequent use):
- Dialog stays open in system tray
- Instant response times
- Request queue for multiple rapid requests
- WebSocket-based communication

To use the dialog system, ensure the parent application is running:
```bash
cd ../claude-pause-parent
npm start
```

### When Claude Code Uses This Tool

- **Architecture Decisions** - "Should I use REST or GraphQL?"
- **Component Design** - "Tabs, sidebar, or single page layout?"
- **Implementation Choices** - "Which library should I use?"
- **Ambiguous Requirements** - "How should this feature work?"
- **User Preferences** - "What styling approach do you prefer?"

### Dialog Interface

When the dialog appears, you'll see:
- **Decision Context** - Clear explanation of what's needed (scrollable)
- **Options** (if applicable) - Multiple choice selections
- **Response Input** - Your custom answer or preference
- **Thinking Mode** - Select analysis depth (Quick/Normal/Deep/Ultra)
- **Planning Mode** - Toggle to request complete plan before implementation
- **Visual Output** - Display area for diagrams, layouts, or code structures
- **Settings Menu** - Window preferences (Electron only)

### Keyboard Shortcuts

- `Ctrl+Enter` - Submit response
- `Escape` - Cancel dialog
- `Q` - Quick thinking mode
- `N` - Normal thinking mode
- `D` - Deep thinking mode
- `U` - Ultra thinking mode
- `1-9` - Quick select numbered options
- `P` - Toggle planning mode

## 🏗️ Project Structure

```
claude-pause-mcp/
├── src/
│   ├── index.js          # Main MCP server
│   └── websocket-client.js # WebSocket client for persistent mode
├── src/                 # MCP server source code
│   ├── index.js         # Main MCP server
│   ├── websocket-client.js # WebSocket client for parent app
│   └── dialogs.js       # Dialog tool implementations
├── dialog.sh            # Dialog dispatcher script
├── dialog.bat           # Windows dialog dispatcher
├── package.json         # Main dependencies
└── README.md           # This file
```

## 🎨 Customization

### Hot Reload Support

The dialog system uses an external script architecture - modify any dialog file and changes take effect immediately without restarting Claude Code!

### Adding New Dialog Types

1. Create a script that:
   - Accepts JSON input: `{"decision_context": "...", "options": [...], "default_action": "..."}`
   - Outputs: `response|||thinking_mode`
   
2. Add to the priority chain in `dialog.sh`

3. Test without restarting Claude Code

### Customizing Appearance

- **Parent App**: Edit React components in `claude-pause-parent/src/renderer/components/`
- **Styles**: Modify CSS in `claude-pause-parent/src/renderer/styles/`
- **Theme**: Magic UI design system with glass morphism effects

## 🔧 Configuration

### Tool Parameters

- `decision_context` (required) - Detailed description of the decision
- `options` (optional) - Array of suggested choices
- `default_action` (optional) - Default response if user presses Enter
- `visual_output` (optional) - Visual content to display (diagrams, layouts, etc.)

### Example Tool Call

```json
{
  "decision_context": "Which state management solution should I use for this React app?",
  "options": [
    "Redux Toolkit",
    "Zustand", 
    "Context API",
    "Recoil"
  ],
  "default_action": "Redux Toolkit",
  "visual_output": "┌────────────┐     ┌────────────┐\n│   Store    │────▶│ Component  │\n└────────────┘     └────────────┘"
}
```

## 📋 Requirements

- **Node.js** 14+ (required)
- **Python** 3 with tkinter (optional, for Python dialog)
- **Electron** (auto-installed)
- **yad/zenity** (optional fallback)

### WSL Users

For best results in WSL:
- Install VcXsrv or similar X server for GUI support
- Use the Electron dialog for best rendering quality
- Python tkinter may have rendering issues

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Submit bug reports
- Suggest new features
- Create pull requests
- Share your custom dialog implementations

## 📄 License

MIT

---

Created with ❤️ for better Claude Code interactions