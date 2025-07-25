# Modular Dialog System

This directory contains the modular dialog system for Claude Pause MCP. Each dialog type is completely independent, making it easy to maintain and extend.

## Dialog Types

### 1. **text_input**
- **Purpose**: Collect free-form text input from users
- **Use Cases**: Detailed explanations, code snippets, multi-line responses
- **Features**: Auto-resize textarea, character count, tab support

### 2. **single_choice**
- **Purpose**: Present mutually exclusive options
- **Use Cases**: Strategy selection, choosing between alternatives
- **Features**: Radio buttons, keyboard shortcuts (1-9), option descriptions

### 3. **multi_choice**
- **Purpose**: Allow multiple selections from a list
- **Use Cases**: Feature selection, configuration options
- **Features**: Checkboxes, min/max constraints, grouping support

### 4. **screenshot_request**
- **Purpose**: Request visual information from users
- **Use Cases**: UI debugging, error screenshots, design feedback
- **Features**: Paste support (Win+Shift+S), drag & drop, preview

### 5. **confirm**
- **Purpose**: Simple yes/no confirmations
- **Use Cases**: Destructive actions, final confirmations
- **Features**: Large buttons, keyboard shortcuts (Y/N), danger mode

## Architecture

Each dialog follows this structure:
```
dialog-name/
├── dialog-name.html    # UI structure
├── dialog-name.css     # Dialog-specific styles
└── dialog-name.js      # Logic and behavior
```

## Common Features

All dialogs include:
- **Three standard buttons**:
  - "Cancel & Return to Planner" - Returns to planner tool
  - "Text Response" - Switches to text input mode
  - "Submit" - Submits the current selection/input

- **Keyboard shortcuts**:
  - `Escape` - Cancel
  - `Ctrl/Cmd + Enter` - Submit
  - `Alt + P` - Return to planner
  - `Alt + T` - Text response mode

## Response Format

All dialogs return a standardized JSON response:
```javascript
{
  type: 'submit' | 'cancel_to_planner' | 'text_response' | 'cancelled',
  dialogType: 'text_input' | 'single_choice' | etc,
  data: {
    // Dialog-specific data
  }
}
```

## Creating a New Dialog

1. Create a new directory under `dialogs/`
2. Create the three files (HTML, CSS, JS)
3. Extend the `BaseDialog` class in your JS file
4. Add the tool to the MCP server (`src/index.js`)
5. Add routing in `main.js`

Example:
```javascript
class MyNewDialog extends BaseDialog {
    constructor() {
        super('my_new_dialog');
    }
    
    getTitle() {
        return 'My New Dialog';
    }
    
    gatherData() {
        // Collect and return dialog data
        return { ... };
    }
}
```

## Styling

All dialogs use:
- Catppuccin Mocha color palette
- Shared base styles from `shared/base-dialog.css`
- Consistent spacing and animations

## Testing

Each dialog can be tested independently by calling its corresponding tool from Claude.