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
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0
    });
  });

  // AI-powered Arduino code generation
  app.post("/api/generate-code", async (req, res) => {
    try {
      console.log("Received code generation request:", {
        hasApiKey: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
        bodyKeys: Object.keys(req.body),
        prompt: req.body.prompt?.substring(0, 50) + "..." // Log first 50 chars
      });
      
      // Check API key first
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: "API key not configured",
          details: "Please set your Gemini API key in the settings"
        });
      }
      
      const request: ArduinoCodeRequest = req.body;
      
      // Validate request
      if (!request.prompt || !request.arduinoModel) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "prompt and arduinoModel are required"
        });
      }
      
      // Validate components array
      if (!Array.isArray(request.components)) {
        request.components = [];
      }
      
      const result = await generateArduinoCode(request);
      console.log("Code generation successful");
      res.json(result);
    } catch (error) {
      console.error("Code generation error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        name: error instanceof Error ? error.name : "Unknown",
        cause: error instanceof Error ? error.cause : undefined
      });
      
      // Return more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          return res.status(401).json({ 
            error: "Invalid API key",
            details: error.message
          });
        } else if (error.message.includes("quota")) {
          return res.status(429).json({ 
            error: "API quota exceeded",
            details: error.message
          });
        } else if (error.message.includes("network")) {
          return res.status(503).json({ 
            error: "Network error",
            details: error.message
          });
        }
      }
      
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

  // API key management endpoints
  app.post("/api/set-api-key", (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }
      
      // Set the environment variable for this session
      process.env.GEMINI_API_KEY = apiKey;
      
      res.json({ success: true, message: "API key saved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save API key" });
    }
  });

  app.post("/api/test-api-key", async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }

      // Temporarily set the API key for testing
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = apiKey;

      // Test with a simple request
      const testRequest = {
        prompt: "Test",
        components: [],
        arduinoModel: "uno" as const
      };

      await generateArduinoCode(testRequest);
      
      // Restore original key
      process.env.GEMINI_API_KEY = originalKey;
      
      res.json({ valid: true });
    } catch (error) {
      // Restore original key on error
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = originalKey;
      
      res.status(400).json({ 
        valid: false, 
        error: error instanceof Error ? error.message : "Invalid API key" 
      });
    }
  });

  // Add test routes for debugging
  addTestRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
