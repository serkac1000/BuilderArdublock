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
    const { stdout } = await execAsync(`netstat -tulpn | grep :${port}`);
    return stdout.trim() !== '';
  } catch (error) {
    return false;
  }
}

async function getProcessOnPort(port: number): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    return stdout.trim() || null;
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
      await killPort(port);
      log(`Successfully killed process on port ${port}`);
      
      // Wait a moment for the port to be released
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      log(`Port ${port} is available`);
    }
  } catch (error) {
    log(`Error managing port ${port}: ${error}`);
    // Try alternative method
    try {
      await execAsync(`pkill -f "port ${port}"`);
      log(`Alternative kill method used for port ${port}`);
    } catch (altError) {
      log(`Alternative kill method failed: ${altError}`);
    }
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
  
  // Kill any existing process on port 5000 before starting
  await killProcessOnPort(port);
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Handle server errors, especially port conflicts
  server.on('error', async (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use. Attempting to kill process and restart...`);
      await killProcessOnPort(port);
      
      // Retry starting the server after a brief delay
      setTimeout(() => {
        server.listen({
          port,
          host: "0.0.0.0",
          reusePort: true,
        }, () => {
          log(`serving on port ${port} after restart`);
        });
      }, 2000);
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
