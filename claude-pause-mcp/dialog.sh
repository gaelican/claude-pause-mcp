#!/bin/bash
# External dialog script for claude-pause-mcp
# This script can be modified without restarting Claude Code!
#
# Usage: dialog.sh <json_input>
# Input: JSON with decision_context, options (optional), default_action (optional)
# Output: User's response or "CANCELLED"

# Big debug message
echo "╔════════════════════════════════════════════════════════════════╗" >&2
echo "║ 🚀 EXTERNAL DIALOG SCRIPT EXECUTED! $(date '+%H:%M:%S')         ║" >&2
echo "║ This message proves the script is running!                     ║" >&2
echo "╚════════════════════════════════════════════════════════════════╝" >&2

# Read JSON input from command line argument
JSON_INPUT="$1"

# Parse JSON using jq (with fallback to basic parsing if jq not available)
if command -v jq >/dev/null 2>&1; then
    CONTEXT=$(echo "$JSON_INPUT" | jq -r '.decision_context // ""')
    DEFAULT=$(echo "$JSON_INPUT" | jq -r '.default_action // ""')
    # Parse options array into bash array
    mapfile -t OPTIONS < <(echo "$JSON_INPUT" | jq -r '.options[]? // empty')
else
    # Basic parsing without jq
    CONTEXT=$(echo "$JSON_INPUT" | grep -o '"decision_context":"[^"]*"' | cut -d'"' -f4)
    DEFAULT=$(echo "$JSON_INPUT" | grep -o '"default_action":"[^"]*"' | cut -d'"' -f4)
    OPTIONS=()
fi

# Check for Electron dialog first (best rendering - standalone window)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ELECTRON_DIALOG="$SCRIPT_DIR/dialog-electron.sh"
WEB_DIALOG="$SCRIPT_DIR/dialog-web.py"
WINDOWS_DIALOG="/mnt/c/Users/gaelican/claude-pause-dialog/dialog.bat"
PYTHON_DIALOG="$SCRIPT_DIR/dialog.py"

# Function to handle dialog result
handle_result() {
    local RESULT="$1"
    local EXIT_CODE="$2"
    
    if [ $EXIT_CODE -eq 0 ]; then
        # Check if result is JSON (contains images)
        if [[ "$RESULT" == "{"* ]] && echo "$RESULT" | jq -e . >/dev/null 2>&1; then
            # Parse JSON response
            echo "║ Response contains images!                                       ║" >&2
            echo "$RESULT"
            exit 0
        # Check if result contains thinking mode (format: response|||mode)
        elif [[ "$RESULT" == *"|||"* ]]; then
            # echo "║ DEBUG: Raw result: $RESULT                                     ║" >&2
            RESPONSE="${RESULT%|||*}"
            THINKING_MODE="${RESULT#*|||}"
            
            # Log thinking mode
            echo "║ Thinking mode selected: $THINKING_MODE                        ║" >&2
            echo "╚════════════════════════════════════════════════════════════════╝" >&2
            
            # Prepend thinking mode instruction based on selection
            case "$THINKING_MODE" in
                "ultra")
                    PREFIX="use ultrathink. "
                    ;;
                "deep")
                    PREFIX="use deep think. "
                    ;;
                "quick")
                    PREFIX="use quick think. "
                    ;;
                "normal")
                    PREFIX=""
                    ;;
                *)
                    PREFIX=""
                    ;;
            esac
            
            # Output the response with prefix
            if [ -z "$RESPONSE" ] && [ -n "$DEFAULT" ]; then
                echo "${PREFIX}${DEFAULT}"
            elif [ -z "$RESPONSE" ]; then
                echo "${PREFIX}No input provided"
            else
                echo "${PREFIX}${RESPONSE}"
            fi
            
            # Store thinking mode preference
            echo "$THINKING_MODE" > "$SCRIPT_DIR/.thinking_mode_preference"
            # Also store in Windows location if using Windows dialog
            if [ -d "/mnt/c/Users/gaelican/claude-pause-dialog" ]; then
                echo "$THINKING_MODE" > "/mnt/c/Users/gaelican/claude-pause-dialog/.thinking_mode_preference"
            fi
        else
            # Fallback for regular response
            if [ -z "$RESULT" ] && [ -n "$DEFAULT" ]; then
                echo "$DEFAULT"
            elif [ -z "$RESULT" ]; then
                echo "No input provided"
            else
                echo "$RESULT"
            fi
        fi
    else
        # User cancelled
        echo "CANCELLED"
    fi
}

# Try Electron dialog first (best quality - native window)
if [ -f "$ELECTRON_DIALOG" ] && command -v node >/dev/null 2>&1; then
    echo "║ Using ELECTRON DIALOG (standalone mode)                         ║" >&2
    echo "╚════════════════════════════════════════════════════════════════╝" >&2
    
    RESULT=$("$ELECTRON_DIALOG" "$JSON_INPUT" 2>/dev/null)
    EXIT_CODE=$?
    handle_result "$RESULT" "$EXIT_CODE"
    exit 0

# Try web-based dialog next
elif [ -f "$WEB_DIALOG" ] && command -v python3 >/dev/null 2>&1 && python3 -c "import webbrowser" 2>/dev/null; then
    echo "║ Using WEB-BASED DIALOG (opens in your browser!)                ║" >&2
    echo "╚════════════════════════════════════════════════════════════════╝" >&2
    
    RESULT=$(python3 "$WEB_DIALOG" "$JSON_INPUT" 2>/dev/null)
    EXIT_CODE=$?
    handle_result "$RESULT" "$EXIT_CODE"
    exit 0

# Try Windows native Python next
elif [ -f "$WINDOWS_DIALOG" ] && command -v cmd.exe >/dev/null 2>&1; then
    echo "║ Using WINDOWS NATIVE PYTHON (best rendering quality!)          ║" >&2
    echo "╚════════════════════════════════════════════════════════════════╝" >&2
    
    # Convert WSL path to Windows path for preference files
    WIN_SCRIPT_DIR=$(wslpath -w "$SCRIPT_DIR")
    
    # Use cmd.exe to run the Windows batch file
    # Escape the JSON for Windows command line
    WIN_JSON=$(echo "$JSON_INPUT" | sed 's/"/\\"/g')
    RESULT=$(cd /mnt/c && cmd.exe /c "cd /d C:\\Users\\gaelican\\claude-pause-dialog && dialog.bat \"$WIN_JSON\"" 2>/dev/null)
    EXIT_CODE=$?
    
    # Copy preference files back to WSL location
    if [ -f "/mnt/c/Users/gaelican/claude-pause-dialog/.thinking_mode_preference" ]; then
        cp "/mnt/c/Users/gaelican/claude-pause-dialog/.thinking_mode_preference" "$SCRIPT_DIR/" 2>/dev/null
    fi
    if [ -f "/mnt/c/Users/gaelican/claude-pause-dialog/.dialog_position" ]; then
        cp "/mnt/c/Users/gaelican/claude-pause-dialog/.dialog_position" "$SCRIPT_DIR/" 2>/dev/null
    fi
    if [ -f "/mnt/c/Users/gaelican/claude-pause-dialog/.dialog_history.json" ]; then
        cp "/mnt/c/Users/gaelican/claude-pause-dialog/.dialog_history.json" "$SCRIPT_DIR/" 2>/dev/null
    fi
    
    handle_result "$RESULT" "$EXIT_CODE"
    exit 0

# Try Python dialog
elif [ -f "$PYTHON_DIALOG" ] && command -v python3 >/dev/null 2>&1; then
    # Check if tkinter is available
    if python3 -c "import tkinter" 2>/dev/null; then
        echo "║ Using CUSTOM PYTHON DIALOG (dark theme + vibrant colors!)      ║" >&2
        echo "╚════════════════════════════════════════════════════════════════╝" >&2
        
        # Use Python dialog
        RESULT=$(python3 "$PYTHON_DIALOG" "$JSON_INPUT" 2>/dev/null)
        EXIT_CODE=$?
        handle_result "$RESULT" "$EXIT_CODE"
        exit 0
    else
        echo "║ Python dialog available but tkinter not installed              ║" >&2
        echo "║ Install with: sudo apt-get install python3-tk                  ║" >&2
        echo "║ Falling back to yad/zenity...                                  ║" >&2
        echo "╚════════════════════════════════════════════════════════════════╝" >&2
    fi
fi

# Fallback to yad/zenity
DIALOG_TOOL=""
for tool in yad zenity; do
    if command -v $tool >/dev/null 2>&1; then
        DIALOG_TOOL=$tool
        break
    fi
done

echo "║ Using dialog tool: $DIALOG_TOOL                                ║" >&2

if [ -z "$DIALOG_TOOL" ]; then
    echo "ERROR: No dialog tool found (yad or zenity required)" >&2
    echo "CANCELLED"
    exit 1
fi

# Build the dialog text
FULL_TEXT="$CONTEXT"

# Add options if provided
if [ ${#OPTIONS[@]} -gt 0 ]; then
    FULL_TEXT="$FULL_TEXT

Options to consider:"
    for i in "${!OPTIONS[@]}"; do
        FULL_TEXT="$FULL_TEXT
  $((i+1)). ${OPTIONS[$i]}"
    done
fi

# Add default if provided
if [ -n "$DEFAULT" ]; then
    FULL_TEXT="$FULL_TEXT

Default: $DEFAULT"
fi

FULL_TEXT="$FULL_TEXT

Type your response below:"

# Play notification sound if available
if command -v paplay >/dev/null 2>&1; then
    paplay /usr/share/sounds/freedesktop/stereo/message.oga 2>/dev/null || true
elif command -v aplay >/dev/null 2>&1; then
    aplay /usr/share/sounds/sound-icons/percussion-10.wav 2>/dev/null || true
fi

# Add visual separator
echo "════════════════════════════════════════════════════════════════" >&2
echo "🎯 DIALOG TRIGGERED AT $(date '+%H:%M:%S')" >&2
echo "════════════════════════════════════════════════════════════════" >&2

# Show dialog based on tool
case $DIALOG_TOOL in
    yad)
        # Use yad with form dialog for more visual impact
        RESULT=$(yad \
            --form \
            --title="Claude Code Decision Required" \
            --text="<span size='large' weight='bold' foreground='#89dceb'>$FULL_TEXT</span>" \
            --width=1000 \
            --height=700 \
            --on-top \
            --center \
            --button="gtk-ok:0" \
            --button="gtk-cancel:1" \
            --field="<span foreground='#f9e2af'>Your Response:</span>" "$DEFAULT" \
            --field="<span foreground='#a6adc8' size='small'>Modified at $(date '+%H:%M:%S')</span>:LBL" \
            --gtkrc-style='
                style "dark-theme" {
                    bg[NORMAL] = "#1e1e2e"
                    bg[ACTIVE] = "#313244"
                    bg[PRELIGHT] = "#45475a"
                    bg[SELECTED] = "#89b4fa"
                    fg[NORMAL] = "#cdd6f4"
                    fg[ACTIVE] = "#f5e0dc"
                    fg[PRELIGHT] = "#f9e2af"
                    fg[SELECTED] = "#1e1e2e"
                    base[NORMAL] = "#313244"
                    base[ACTIVE] = "#45475a"
                    text[NORMAL] = "#cdd6f4"
                    font_name = "Sans 12"
                }
                widget "*" style "dark-theme"
                class "GtkWidget" style "dark-theme"
            ' \
            2>/dev/null)
        EXIT_CODE=$?
        # Extract just the first field (response) from form output
        RESULT=$(echo "$RESULT" | cut -d'|' -f1)
        ;;
    zenity)
        # Use zenity with entry dialog
        RESULT=$(zenity \
            --entry \
            --title="Claude Code Decision Required" \
            --text="$FULL_TEXT" \
            --width=800 \
            --height=500 \
            --entry-text="$DEFAULT" \
            2>/dev/null)
        EXIT_CODE=$?
        ;;
esac

# Handle the result for fallback dialogs
handle_result "$RESULT" "$EXIT_CODE"