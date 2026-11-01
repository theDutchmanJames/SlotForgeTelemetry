@echo off
cd /d "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo Installing SlotForge Telemetry dependencies...
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm start

