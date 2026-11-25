@echo off
cd /d "%~dp0"
:: Start a mini-server on port 5500 in the background
start "PAL_Server" /min npx -y serve -l 5500

:: Start the App Launcher Bridge in the background
:: This allows PAL to open local downloaded apps
start "PAL_Launcher" /min node launcher.js

:: Give the servers 2 seconds to start up
timeout /t 3 >nul

:: Open PAL in your default browser
start "" "http://localhost:5500/index.html"
exit
