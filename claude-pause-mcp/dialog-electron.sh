#!/bin/bash
# Electron dialog launcher

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ELECTRON_DIR="$SCRIPT_DIR/electron-dialog"

# Check if electron is installed globally
if ! command -v electron >/dev/null 2>&1; then
    echo "Installing Electron..." >&2
    npm install -g electron
fi

# Check if node_modules exists in electron dir
if [ ! -d "$ELECTRON_DIR/node_modules" ]; then
    echo "Installing Electron locally..." >&2
    cd "$ELECTRON_DIR" && npm install electron
fi

# Launch electron with the JSON input
cd "$ELECTRON_DIR"
if [ -f "node_modules/.bin/electron" ]; then
    # Use local electron
    node_modules/.bin/electron . "$1"
else
    # Use global electron
    electron . "$1"
fi