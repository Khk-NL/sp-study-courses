@echo off
setlocal

cd /d "%~dp0"
echo [1/2] Building plugin...
node scripts\build.mjs
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)

for /f "usebackq delims=" %%v in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-Content -Raw manifest.json | ConvertFrom-Json).version"`) do set "VERSION=%%v"
if not defined VERSION (
  echo Could not read version from manifest.json.
  exit /b 1
)

set "ZIP=sp-study-courses-%VERSION%.zip"
echo [2/2] Packaging %ZIP%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path 'dist\*' -DestinationPath '%ZIP%' -Force"
if errorlevel 1 (
  echo Packaging failed. Close any program using %ZIP% and try again.
  exit /b 1
)

echo Done: %ZIP%
exit /b 0