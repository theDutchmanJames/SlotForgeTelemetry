@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is missing. Install Node.js 22.12 or newer, including npm, then try again.
  echo Ready-made app packages do not need Node.js.
  pause
  exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
  echo npm is missing. Reinstall Node.js with npm included, then try again.
  pause
  exit /b 1
)
node -e "const [m,n]=process.versions.node.split('.').map(Number);process.exit(m>22||(m===22&&n>=12)?0:1)"
if errorlevel 1 (
  echo Node.js 22.12 or newer is required. Update Node.js and try again.
  pause
  exit /b 1
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo Installing SlotForge Telemetry dependencies...
  call npm ci --include=dev
  if errorlevel 1 (
    echo Installation failed. Check the message above and your internet connection.
    pause
    exit /b 1
  )
)
call npm start
if errorlevel 1 (
  echo SlotForge Telemetry could not start. Read the error above.
  pause
  exit /b 1
)
