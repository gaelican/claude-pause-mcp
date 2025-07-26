#!/bin/bash
# External dialog script for claude-pause-mcp
# Simplified version that only calls the parent Electron app
#
# Usage: dialog.sh <json_input>
# Input: JSON with decision_context, options (optional), default_action (optional)
# Output: User's response or "CANCELLED"

# Read JSON input from command line argument
JSON_INPUT="$1"

# Debug message
echo "╔════════════════════════════════════════════════════════════════╗" >&2
echo "║ 🚀 DIALOG SCRIPT EXECUTED! $(date '+%H:%M:%S')                  ║" >&2
echo "║ Forwarding to parent Electron app...                           ║" >&2
echo "╚════════════════════════════════════════════════════════════════╝" >&2

# The parent app should be handling all dialogs via WebSocket
# For now, return a default response to prevent errors
echo "Dialog request forwarded to parent app"
exit 0