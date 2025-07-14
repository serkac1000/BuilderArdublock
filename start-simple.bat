@echo off
echo Starting Arduino Code Generator (Simple Mode)...
echo.
echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Dependencies not found. Installing...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        echo Please run: npm install
        pause
        exit /b 1
    )
) else (
    echo Dependencies found.
)
echo.
echo Setting environment and starting server...
set NODE_ENV=development
npx tsx server/index.ts
pause