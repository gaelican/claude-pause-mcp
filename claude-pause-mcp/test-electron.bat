@echo off
cd /d "%~dp0electron-dialog"
echo Current directory: %CD%
echo Running: npx electron . "{\"decision_context\":\"test\"}"
npx electron . "{\"decision_context\":\"test\"}"
echo Exit code: %ERRORLEVEL%
pause