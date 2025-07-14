
@echo off
echo Starting Arduino ArduBlock Code Generator...
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
call npm install
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
echo Setting NODE_ENV=development...
set NODE_ENV=development
echo Environment configured. Starting server...
echo.
call set NODE_ENV=development && npx tsx server/index.ts
if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start
    echo Try running manually: set NODE_ENV=development ^&^& npx tsx server/index.ts
    pause
    exit /b 1
)
