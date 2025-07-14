@echo off
echo Starting Arduino Code Generator (Simple Mode)...
echo.
echo Setting environment and starting server...
set NODE_ENV=development
npx tsx server/index.ts
pause