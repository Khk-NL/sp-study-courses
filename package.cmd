@echo off
rem Local packaging: builds dist/, runs the smoke tests, and writes
rem sp-study-courses.zip at the repository root.
rem The remote twin of this file is .github/workflows/package.yml, which runs
rem the same pnpm scripts on every push and publishes the ZIP on v* tags.
rem Run it from a terminal ("package.cmd" or ".\package.cmd") so failures stay
rem readable; it intentionally does not pause.
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [package] Node.js was not found on PATH. Install Node.js 22 or newer first.
  exit /b 1
)

if not exist "node_modules\esbuild" (
  where pnpm >nul 2>nul
  if errorlevel 1 (
    echo [package] pnpm was not found on PATH. Install pnpm, or run "pnpm install" once.
    exit /b 1
  )
  echo [package] Installing build tools...
  call pnpm install --frozen-lockfile --ignore-scripts
  if errorlevel 1 exit /b 1
)

echo [package] Running smoke tests...
node tests\smoke.mjs
if errorlevel 1 exit /b 1

echo [package] Building and packaging...
node scripts\package.mjs
if errorlevel 1 exit /b 1

echo.
echo [package] Release ZIP: %CD%\sp-study-courses.zip
endlocal
exit /b 0
