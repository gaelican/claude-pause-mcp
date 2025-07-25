@echo off
setlocal enabledelayedexpansion

:: Get the directory of this script
set "SCRIPT_DIR=%~dp0"
set "ELECTRON_DIR=%SCRIPT_DIR%electron-dialog"

:: Get Base64 input from first argument
set "BASE64_INPUT=%~1"

:: Log to stderr for debugging
echo [dialog.bat] Starting... >&2
echo [dialog.bat] Script dir: %SCRIPT_DIR% >&2
echo [dialog.bat] Electron dir: %ELECTRON_DIR% >&2

:: Change to electron directory
cd /d "%ELECTRON_DIR%"
if %ERRORLEVEL% neq 0 (
    echo [dialog.bat] ERROR: Failed to change to electron directory >&2
    exit /b 1
)

echo [dialog.bat] Current directory: %CD% >&2

:: Use the direct path to electron.exe
set "ELECTRON_EXE=%ELECTRON_DIR%\node_modules\electron\dist\electron.exe"

:: Check if electron.exe exists
if exist "%ELECTRON_EXE%" (
    echo [dialog.bat] Found electron.exe at: %ELECTRON_EXE% >&2
    echo [dialog.bat] Running with Base64 input >&2
    "%ELECTRON_EXE%" . %BASE64_INPUT%
    set "EXIT_CODE=!ERRORLEVEL!"
) else (
    echo [dialog.bat] ERROR: electron.exe not found at: %ELECTRON_EXE% >&2
    exit /b 1
)

if !EXIT_CODE! neq 0 (
    echo [dialog.bat] ERROR: Electron exited with code !EXIT_CODE! >&2
)

exit /b !EXIT_CODE!