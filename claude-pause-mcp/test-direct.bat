@echo off
cd /d "%~dp0electron-dialog"
echo Testing direct electron launch...
node_modules\.bin\electron.cmd . "{\"decision_context\":\"Direct test\"}"
echo Exit code: %ERRORLEVEL%
pause