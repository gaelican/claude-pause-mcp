# Development Guide - External Script Approach

## Overview

The MCP server now uses an external bash script (`dialog.sh`) to display dialogs. This means you can modify the dialog behavior WITHOUT restarting Claude Code!

## How It Works

1. **MCP Server** (index.js) - Stays stable, executes external script
2. **Dialog Script** (dialog.sh) - Handles all dialog display logic
3. **Communication** - JSON passed as command line argument, response via stdout

## Making Changes

### To modify dialog behavior:
1. Edit `dialog.sh` 
2. Save the file
3. The next dialog will use your changes immediately!

### What you can change without restart:
- Dialog appearance (size, position, colors)
- Dialog text formatting
- Which dialog tool to use (yad vs zenity)
- How options are displayed
- Default value handling
- Any custom logic or behavior

### Example modifications:

**Change dialog size:**
```bash
# In dialog.sh, modify the width/height parameters:
--width=800 \
--height=500 \
```

**Add custom styling (yad only):**
```bash
# Add CSS styling
--css="*{font-size:16px;}" \
```

**Change position:**
```bash
# Add geometry parameter
--geometry=+100+100 \
```

**Add sound notification:**
```bash
# Add before showing dialog
paplay /usr/share/sounds/freedesktop/stereo/message.oga 2>/dev/null || true
```

## Testing Changes

Test the dialog script directly:
```bash
./dialog.sh '{"decision_context":"Test","options":["A","B"],"default_action":"A"}'
```

## Adding Features

The script is just bash, so you can add any features:
- Position memory (save/load from file)
- Sound effects
- Multiple dialog types
- Color themes
- Keyboard shortcuts
- Integration with other tools

## Debugging

The script logs errors to stderr, which the MCP server displays:
```bash
echo "Debug: Some info" >&2
```

## Benefits

✅ No Claude Code restarts needed  
✅ Instant feedback on changes  
✅ Easy to experiment  
✅ Can use any language (Python, Node.js, etc.)  
✅ Full control over dialog behavior