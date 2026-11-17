@echo off
rem SlotForge Telemetry Windows builder. Double-click, or run "build-windows.cmd --quick".
rem Produces the portable .exe and the Setup installer in dist\. Never publishes anything.
setlocal
cd /d "%~dp0"
set "QUICK=0"
if /i "%~1"=="--quick" set "QUICK=1"
where node >nul 2>&1 || (echo Node.js is missing. Install Node.js 22.12 or newer, including npm. & goto :fail)
where npm >nul 2>&1 || (echo npm is missing. Reinstall Node.js with npm included. & goto :fail)
node -e "const [m,n]=process.versions.node.split('.').map(Number);process.exit(m>22||(m===22&&n>=12)?0:1)" || (echo Node.js 22.12 or newer is required. & goto :fail)
for /f "delims=" %%v in ('node -p "require('./package.json').version"') do set "VERSION=%%v"
set "PORTABLE=dist\SlotForgeTelemetry-%VERSION%-windows-x64-Portable.exe"
set "SETUP=dist\SlotForgeTelemetry-%VERSION%-windows-x64-Setup.exe"
echo.
echo Building SlotForge Telemetry %VERSION% for Windows
if "%QUICK%"=="1" if exist "node_modules\electron\dist\electron.exe" (
  echo Quick mode: reusing installed dependencies and skipping checks.
  goto :package
)
call npm ci --include=dev || goto :fail
if not exist "node_modules\electron\dist\electron.exe" (call node node_modules\electron\install.js || goto :fail)
if "%QUICK%"=="1" goto :package
call npm run check || goto :fail
call npm test || goto :fail
:package
rem Remove only this version's outputs so an older build can never be reported as success.
if exist "%PORTABLE%" del /q "%PORTABLE%"
if exist "%SETUP%" del /q "%SETUP%"
call npm run dist -- --publish never || goto :fail
if not exist "%PORTABLE%" (echo The build did not produce %PORTABLE%. & goto :fail)
if not exist "%SETUP%" (echo The build did not produce %SETUP%. & goto :fail)
echo.
echo Build complete:
echo   Portable app : %PORTABLE%
echo   Installer    : %SETUP%
if "%NOPAUSE%"=="" pause
exit /b 0
:fail
echo.
echo Build stopped. Read the error above; no successful build is being reported.
if "%NOPAUSE%"=="" pause
exit /b 1
