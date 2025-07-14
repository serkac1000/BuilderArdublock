# Arduino Code Generator - Windows Setup

## Quick Start for Windows

### Method 1: Using the Batch File (Recommended)
1. Double-click `start-windows.bat`
2. The script will automatically install dependencies and start the server
3. Open your browser to `http://localhost:5000`

### Method 2: Manual Commands
Open Command Prompt or PowerShell in the project directory and run:

```cmd
# Install dependencies
npm install

# Start the development server
set NODE_ENV=development && npx tsx server/index.ts
```

### Method 3: Using cross-env (if available)
```cmd
# Install cross-env globally (one-time setup)
npm install -g cross-env

# Then you can use the regular dev command
npm run dev
```

## Troubleshooting

### Error: 'NODE_ENV' is not recognized
This happens because Windows Command Prompt doesn't support Unix-style environment variables. Use one of these solutions:

**Solution 1**: Use the provided `start-windows.bat` file
**Solution 2**: Use PowerShell instead of Command Prompt:
```powershell
$env:NODE_ENV="development"; npx tsx server/index.ts
```
**Solution 3**: Install cross-env globally:
```cmd
npm install -g cross-env
npm run dev
```

### Port 5000 Already in Use
The application has built-in port management that automatically kills processes on port 5000. If you still have issues:
1. Close any other applications using port 5000
2. Restart your terminal/command prompt
3. Run the start script again

### Node.js Not Found
1. Download and install Node.js from https://nodejs.org/
2. Restart your terminal/command prompt
3. Verify installation: `node --version`

## Features

- **Arduino Code Generator**: Convert natural language to ArduBlock.ru pseudocode
- **Component Configuration**: Visual setup for Arduino components
- **Export Options**: 
  - TXT files with ArduBlock.ru instructions
  - INO files ready for Arduino IDE
- **Custom Components**: Add components not in the standard list
- **Multiple Arduino Models**: Support for Uno, Mega, and ESP32

## Development

The application runs on:
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Port: 5000 (automatically managed)

For development, the server automatically restarts when files change.