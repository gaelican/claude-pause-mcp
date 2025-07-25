@echo off
setlocal enabledelayedexpansion

:: Get the directory of this script
set "SCRIPT_DIR=%~dp0"
set "ELECTRON_DIR=%SCRIPT_DIR%electron-dialog"
set "TEMP_JSON=%TEMP%\claude_dialog_%RANDOM%.json"

:: Get JSON input from first argument and write to temp file
echo %~1 > "%TEMP_JSON%"

:: Log to stderr for debugging
echo [dialog-windows.bat] Starting... >&2
echo [dialog-windows.bat] Temp JSON file: %TEMP_JSON% >&2

:: Change to electron directory
cd /d "%ELECTRON_DIR%"
if %ERRORLEVEL% neq 0 (
    echo [dialog-windows.bat] ERROR: Failed to change to electron directory >&2
    del "%TEMP_JSON%" 2>nul
    exit /b 1
)

:: Check if electron exists
if exist "node_modules\.bin\electron.cmd" (
    echo [dialog-windows.bat] Using electron.cmd >&2
    call node_modules\.bin\electron.cmd . "%TEMP_JSON%"
) else (
    echo [dialog-windows.bat] Using npx electron >&2
    call npx electron . "%TEMP_JSON%"
)

set "EXIT_CODE=%ERRORLEVEL%"

:: Clean up temp file
del "%TEMP_JSON%" 2>nul

exit /b %EXIT_CODE%