
@echo off
echo Starting Arduino Code Generator...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if package.json exists
if not exist package.json (
    echo Error: package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM First, install dependencies (REQUIRED)
echo Installing dependencies...
npm install
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

REM Kill any processes on port 5000
echo Checking for processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5000...
    taskkill /PID %%a /F >nul 2>&1
)

REM Wait for port to be released
echo Waiting for port to be released...
timeout /t 3 /nobreak >nul

REM Then start the development server
echo Starting development server...
echo Open http://localhost:5000 in your browser
echo Press Ctrl+C to stop the server
echo.
set NODE_ENV=development && npx tsx server/index.ts
