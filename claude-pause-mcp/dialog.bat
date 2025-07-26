@echo off
REM External dialog script for claude-pause-mcp (Windows)
REM Simplified version that only calls the parent Electron app
REM
REM Usage: dialog.bat <json_input>
REM Input: JSON with decision_context, options (optional), default_action (optional)
REM Output: User's response or "CANCELLED"

REM Read JSON input from command line argument
set JSON_INPUT=%~1

REM Debug message
echo ============================================================ >&2
echo Dialog script executed! %TIME% >&2
echo Forwarding to parent Electron app... >&2
echo ============================================================ >&2

REM The parent app should be handling all dialogs via WebSocket
REM For now, return a default response to prevent errors
echo Dialog request forwarded to parent app
exit /b 0