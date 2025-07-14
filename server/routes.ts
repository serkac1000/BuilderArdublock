import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateArduinoCode, suggestComponents, type ArduinoCodeRequest } from "./gemini";
import { addTestRoutes } from "./test-api";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Add a simple health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI-powered Arduino code generation
  app.post("/api/generate-code", async (req, res) => {
    try {
      const request: ArduinoCodeRequest = req.body;
      const result = await generateArduinoCode(request);
      res.json(result);
    } catch (error) {
      console.error("Code generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate Arduino code",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // AI-powered component suggestions
  app.post("/api/suggest-components", async (req, res) => {
    try {
      const { prompt } = req.body;
      const suggestions = await suggestComponents(prompt);
      res.json({ suggestions });
    } catch (error) {
      console.error("Component suggestion error:", error);
      res.status(500).json({ 
        error: "Failed to suggest components",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Add test routes for debugging
  addTestRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
