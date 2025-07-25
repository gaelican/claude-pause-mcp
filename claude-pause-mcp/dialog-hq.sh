#!/bin/bash
# High-quality dialog launcher with better rendering settings

# Set environment variables for better rendering
export GDK_SCALE=2
export GDK_DPI_SCALE=0.5
export QT_SCALE_FACTOR=1
export XCURSOR_SIZE=32

# Anti-aliasing settings
export QT_XFT=true
export GDK_USE_XFT=1

# Use the regular dialog script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/dialog.sh" "$@"