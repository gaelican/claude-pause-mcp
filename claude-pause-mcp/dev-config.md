# Development Configuration for Hot Reloading

To enable hot reloading during development (so you don't need to restart Claude Code for every change):

## Option 1: Update your MCP configuration temporarily

```bash
claude mcp remove claude-pause
claude mcp add claude-pause /home/gaelican/claude-ask/claude-pause-mcp/dev.sh
```

## Option 2: Set environment variable before starting Claude

```bash
export MCP_DEV_MODE=true
claude code
```

## How it works

When `MCP_DEV_MODE=true`, the MCP server will:
1. Clear the module cache for dialogs.js
2. Reload the module fresh on every request
3. Log "[MCP Dev Mode] Reloaded dialog module" to confirm

This means you can:
- Edit dialogs.js
- Save the file
- The next dialog will use your new code immediately
- No need to restart Claude Code!

## Switching back to production mode

```bash
claude mcp remove claude-pause
claude mcp add claude-pause node /home/gaelican/claude-ask/claude-pause-mcp/src/index.js
```

Or simply don't set the MCP_DEV_MODE environment variable.