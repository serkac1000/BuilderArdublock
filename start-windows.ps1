# Arduino Code Generator - Windows PowerShell Startup Script

Write-Host "Starting Arduino Code Generator..." -ForegroundColor Green
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm installation
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not available" -ForegroundColor Red
    Write-Host "Please ensure npm is installed with Node.js" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start the server
Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "The server will be available at http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

$env:NODE_ENV = "development"
npx tsx server/index.ts