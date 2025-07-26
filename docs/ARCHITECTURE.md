# Claude Pause Architecture Documentation

## Overview

Claude Pause is an Electron-based dialog system that facilitates interactive communication between Claude AI and users through a sophisticated UI. The application uses a Model-Context-Protocol (MCP) for communication and features a modern, animated interface with the "Magic UI" design system.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Claude AI (MCP)                        │
└───────────────────┬─────────────────────────┬───────────────┘
                    │     WebSocket           │
┌───────────────────▼─────────────────────────▼───────────────┐
│                    Electron Main Process                      │
│  • Window Management (index.js)                              │
│  • IPC Bridge Setup                                         │
│  • WebSocket Server                                         │
└───────────────────┬─────────────────────────┬───────────────┘
                    │      IPC Bridge         │
┌───────────────────▼─────────────────────────▼───────────────┐
│                   Electron Renderer Process                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    React Application                  │   │
│  │  ┌─────────────────┐  ┌──────────────────────────┐  │   │
│  │  │  Context Layer  │  │     Component Layer      │  │   │
│  │  │ • DialogContext │  │ • Dialog Components     │  │   │
│  │  │ • SettingsCtx   │  │ • Layout Components     │  │   │
│  │  └─────────────────┘  │ • UI Components         │  │   │
│  │                       │ • Effect Components      │  │   │
│  │                       └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Core Technologies

### Frontend Stack
- **React 18.3**: Component-based UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tooling and HMR
- **Framer Motion**: Animation library
- **Tailwind CSS**: Utility-first CSS (for basic styles)
- **Custom Magic UI**: Gradient-based design system

### Backend/Main Process
- **Electron 34**: Desktop application framework
- **Node.js**: JavaScript runtime
- **WebSocket**: Real-time communication with MCP

## Directory Structure

```
claude-pause-parent/
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.js        # Main entry point
│   │   └── preload.js      # Preload script for IPC
│   │
│   ├── renderer/           # React application
│   │   ├── components/     # React components
│   │   │   ├── common/     # Shared components
│   │   │   ├── dialogs/    # Dialog implementations
│   │   │   ├── effects/    # Visual effects
│   │   │   ├── layout/     # Layout components
│   │   │   └── ui/         # UI primitives
│   │   │
│   │   ├── context/        # React contexts
│   │   ├── styles/         # CSS files
│   │   ├── types/          # TypeScript definitions
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Root component
│   │   └── main.tsx        # Entry point
│   │
│   └── shared/             # Shared code (currently empty)
│
├── public/                 # Static assets
├── dist/                   # Build output
└── docs/                   # Documentation
```

## Key Architectural Patterns

### 1. **Context-Based State Management**
The application uses React Context API for global state management:
- **DialogContext**: Manages active dialogs, history, and WebSocket communication
- **SettingsContext**: Handles user preferences and application settings

### 2. **Component Architecture**
Components are organized by function:
- **Dialog Components**: Implement specific dialog types (Planner, TextInput, etc.)
- **Layout Components**: Handle application structure (Header, Tabs, etc.)
- **UI Components**: Reusable UI elements (MagicDialog, GlassCard, etc.)
- **Effect Components**: Visual effects (ParticleBackground, AuroraBackground)

### 3. **IPC Communication Pattern**
```javascript
// Renderer → Main
window.electronAPI.sendDialogResponse(response)

// Main → Renderer
window.electronAPI.onDialogRequest(callback)
```

### 4. **WebSocket Protocol**
The application communicates with Claude via WebSocket:
```
MCP Server ←→ WebSocket ←→ Electron Main ←→ IPC ←→ React App
```

## Component Hierarchy

```
App
├── AuroraBackground (visual effect)
├── ParticleBackground (visual effect)
├── Header
│   └── Window controls
├── StatusBar
│   └── Connection status
├── TabNavigation
│   ├── Active Dialogs
│   ├── History
│   └── Settings
└── DialogContext.Provider
    └── [Active Dialog Components]
```

## Data Flow

1. **Dialog Request Flow**:
   ```
   MCP → WebSocket → Main Process → IPC → DialogContext → Dialog Component
   ```

2. **Response Flow**:
   ```
   Dialog Component → DialogContext → IPC → Main Process → WebSocket → MCP
   ```

3. **State Updates**:
   - Dialog state managed in DialogContext
   - Settings persisted to localStorage
   - History maintained in memory

## Security Considerations

1. **Context Isolation**: Enabled in Electron for security
2. **Preload Script**: Safely exposes limited IPC methods
3. **Content Security Policy**: Restricts resource loading
4. **No Node Integration**: Renderer process has no direct Node.js access

## Performance Optimizations

1. **React.memo**: Used for expensive components
2. **Lazy Loading**: Dialogs loaded on demand
3. **Animation Performance**: GPU-accelerated via Framer Motion
4. **Virtual Scrolling**: For large history lists
5. **WebSocket Reconnection**: Automatic retry logic

## Styling Architecture

The application uses a layered CSS approach:

1. **Base Styles** (`index.css`): Reset and fundamentals
2. **App Styles** (`app.css`): Application-wide styles
3. **Magic UI** (`magic-ui.css`): Design system tokens
4. **Component Styles** (`magic-dialogs.css`, etc.): Component-specific styles

### Design System Features
- Gradient-based theming
- Glass morphism effects
- Animated borders
- Custom scrollbars
- Responsive grid layouts

## Build and Development

### Development Workflow
```bash
npm run dev          # Start Vite + Electron in dev mode
npm run build        # Build for production
npm run dist         # Create distributable
```

### Build Process
1. Vite builds React app → `dist/`
2. Electron Builder packages app
3. Creates platform-specific installers

## Future Architecture Considerations

1. **Plugin System**: Allow custom dialog types
2. **Theme Engine**: User-customizable themes
3. **State Persistence**: Save/restore dialog state
4. **Multi-window Support**: Detachable dialogs
5. **Accessibility**: Screen reader support
6. **Internationalization**: Multi-language support