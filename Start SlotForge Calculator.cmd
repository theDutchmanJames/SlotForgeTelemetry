@echo off
cd /d "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo Installing SlotForge Calculator dependencies...
  call npm ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm start
