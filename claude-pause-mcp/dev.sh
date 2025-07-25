#!/bin/bash
# Development mode script for claude-pause-mcp
# This enables hot reloading of the dialog module

echo "Starting claude-pause-mcp in development mode..."
echo "Changes to dialogs.js will be loaded without restarting Claude Code"
echo ""

# Export the dev mode flag
export MCP_DEV_MODE=true

# Run the MCP server
node src/index.js