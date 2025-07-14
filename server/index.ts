import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import killPort from "kill-port";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Port management functions
async function isPortInUse(port: number): Promise<boolean> {
  try {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows-specific command
      const { stdout } = await execAsync(`netstat -an | findstr :${port}`);
      return stdout.includes(`0.0.0.0:${port}`) || stdout.includes(`127.0.0.1:${port}`);
    } else {
      // Unix-like systems
      const { stdout } = await execAsync(`netstat -tulpn | grep :${port}`);
      return stdout.trim() !== '';
    }
  } catch (error) {
    return false;
  }
}

async function getProcessOnPort(port: number): Promise<string | null> {
  try {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows-specific command
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          return parts[parts.length - 1]; // PID is the last column
        }
      }
      return null;
    } else {
      // Unix-like systems
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      return stdout.trim() || null;
    }
  } catch (error) {
    return null;
  }
}

async function killProcessOnPort(port: number): Promise<void> {
  try {
    log(`Checking if port ${port} is in use...`);
    
    const pid = await getProcessOnPort(port);
    if (pid) {
      log(`Port ${port} is in use by PID ${pid}. Killing process...`);
      
      const isWindows = process.platform === 'win32';
      if (isWindows) {
        // Windows-specific kill command
        await execAsync(`taskkill /PID ${pid} /F`);
      } else {
        // Use kill-port for Unix-like systems
        await killPort(port);
      }
      
      log(`Successfully killed process on port ${port}`);
      
      // Wait longer for Windows to release the port
      await new Promise(resolve => setTimeout(resolve, isWindows ? 3000 : 1000));
    } else {
      log(`Port ${port} is available`);
    }
  } catch (error) {
    log(`Error managing port ${port}: ${error}`);
    // Don't try alternative methods that might cause loops
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  
  // Detect if running on Windows to use appropriate host
  const isWindows = process.platform === 'win32';
  const host = isWindows ? '127.0.0.1' : '0.0.0.0';
  
  // Kill any existing process on port 5000 before starting
  await killProcessOnPort(port);
  
  server.listen({
    port,
    host,
    reusePort: !isWindows, // Windows doesn't support reusePort
  }, () => {
    log(`serving on port ${port} (host: ${host})`);
  });

  // Handle server errors, especially port conflicts
  server.on('error', async (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use. Server cannot start.`);
      log(`Please close any other applications using port ${port} and restart.`);
      process.exit(1);
    } else {
      log(`Server error: ${err.message}`);
      throw err;
    }
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    log('SIGINT received, shutting down gracefully...');
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
  });
})();
