# Claude Pause - Quick Reference Guide

## 📁 Project Structure

```
claude-pause-parent/
├── src/
│   ├── main/              # Electron main process
│   ├── renderer/          # React application
│   │   ├── components/    # UI components
│   │   ├── context/       # State management
│   │   ├── styles/        # CSS files
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utilities
│   └── shared/            # Shared code
├── public/                # Static assets
├── docs/                  # Documentation
└── dist/                  # Build output
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Create distributable
npm run dist
```

## 🎨 Component Quick Reference

### Dialog Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `PlannerDialogSimple` | Main decision dialog | `requestId`, `parameters` |
| `TextInputDialog` | Text collection | `question`, `placeholder` |
| `SingleChoiceDialog` | Radio selection | `question`, `options` |
| `MultiChoiceDialog` | Checkbox selection | `options`, `minSelections` |
| `ScreenshotDialog` | Image capture | `question`, `description` |
| `ConfirmDialog` | Yes/No confirmation | `question`, `isDangerous` |

### Layout Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `Header` | App title bar | Top |
| `StatusBar` | Connection status | Below header |
| `TabNavigation` | Main tabs | Below status |
| `ActiveDialogsTab` | Current dialogs | Main content |
| `HistoryTab` | Past dialogs | Main content |
| `SettingsPanel` | Preferences | Slide-out panel |

## 🎯 Key Files

### Configuration
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies & scripts

### Entry Points
- `src/main/index.js` - Electron main
- `src/renderer/main.tsx` - React app
- `src/renderer/App.tsx` - Root component

### Styling
- `src/renderer/styles/app.css` - Main styles
- `src/renderer/styles/magic-ui.css` - Design system
- `src/renderer/styles/magic-dialogs.css` - Dialog styles

## 💬 WebSocket Messages

### Request Format
```json
{
  "id": "unique-id",
  "method": "dialog",
  "params": {
    "tool": "planner",
    "parameters": {}
  }
}
```

### Response Format
```json
{
  "id": "matching-id",
  "result": {
    "choice": "selected-option",
    "timestamp": "ISO-8601"
  }
}
```

## 🎨 CSS Variables

### Colors
```css
--magic-bg-primary: #0f172a;
--magic-accent-blue: #60a5fa;
--magic-accent-purple: #a78bfa;
--magic-text-primary: #f1f5f9;
```

### Gradients
```css
--magic-gradient-primary: linear-gradient(135deg, #60a5fa, #a78bfa);
--magic-gradient-accent: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
```

## ⌨️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Submit Dialog | `Ctrl+Enter` |
| Cancel Dialog | `Escape` |
| Thinking Mode | `Q/N/D/U` |
| Confirm Yes | `Y` |
| Confirm No | `N` |

## 🔧 Common Tasks

### Add New Dialog Type
1. Create component in `components/dialogs/`
2. Add type to `types/index.ts`
3. Update `DialogWrapper.tsx`
4. Add WebSocket handler

### Modify Styling
1. Check `magic-ui.css` for variables
2. Update component-specific CSS
3. Test responsive breakpoints
4. Verify dark theme compliance

### Debug WebSocket
```javascript
// Enable debug logging
process.env.CLAUDE_PAUSE_DEBUG = true

// Check DevTools Network tab
// Filter by WS to see frames
```

## 📊 State Management

### Dialog Context
```typescript
const { 
  activeDialogs,    // Current dialogs
  dialogHistory,    // Past dialogs
  sendResponse,     // Send response
  isConnected      // WebSocket status
} = useDialogs();
```

### Settings Context
```typescript
const {
  settings,         // Current settings
  updateSettings,   // Update function
  resetSettings    // Reset to defaults
} = useSettings();
```

## 🐛 Common Issues

### Dialog Not Showing
1. Check WebSocket connection
2. Verify request format
3. Check console for errors
4. Ensure dialog type exists

### Styling Issues
1. Clear browser cache
2. Check CSS specificity
3. Verify variable names
4. Test in different viewports

### Performance Problems
1. Check for re-renders
2. Profile with DevTools
3. Optimize animations
4. Reduce bundle size

## 📚 Documentation Files

| File | Description |
|------|-------------|
| `ARCHITECTURE.md` | System design & structure |
| `COMPONENTS.md` | Component documentation |
| `MCP_COMMUNICATION.md` | WebSocket protocol |
| `MAGIC_UI_DESIGN.md` | Design system guide |
| `FUTURE_IMPROVEMENTS.md` | Roadmap & ideas |
| `EXECUTIVE_SUMMARY.md` | Project overview |

## 🔗 Important Links

- **Electron Docs**: https://www.electronjs.org/docs
- **React Docs**: https://react.dev/
- **Framer Motion**: https://www.framer.com/motion/
- **TypeScript**: https://www.typescriptlang.org/

## 💡 Pro Tips

1. **Use the TodoWrite tool** for task tracking
2. **Test on multiple screen sizes** before committing
3. **Keep animations under 60fps** for smooth UX
4. **Use semantic HTML** for accessibility
5. **Profile memory usage** regularly

---

*Last Updated: January 2025*