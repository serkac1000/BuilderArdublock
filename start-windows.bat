@echo off
echo Starting Arduino Code Generator...
echo.
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not available
    echo Please ensure npm is installed with Node.js
    pause
    exit /b 1
)

echo Installing dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Starting development server...
echo The server will be available at http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
set NODE_ENV=development
npx tsx server/index.ts