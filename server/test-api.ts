
import express from 'express';
import { generateArduinoCode, suggestComponents } from './gemini';

export function addTestRoutes(app: express.Express) {
  // Test the basic API health
  app.get('/api/test/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Test environment variables
  app.get('/api/test/env', (req, res) => {
    res.json({
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV
    });
  });

  // Test Arduino code generation with mock data
  app.post('/api/test/generate-code', async (req, res) => {
    try {
      const testRequest = {
        prompt: "Blink LED on pin 13",
        components: [{ type: "led", pins: "13", label: "Test LED" }],
        arduinoModel: "uno" as const
      };

      const result = await generateArduinoCode(testRequest);
      res.json({
        success: true,
        result,
        testData: testRequest
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Test component suggestions
  app.post('/api/test/suggest-components', async (req, res) => {
    try {
      const testPrompt = "LED blink project";
      const result = await suggestComponents(testPrompt);
      
      res.json({
        success: true,
        suggestions: result,
        testPrompt
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Test all endpoints at once
  app.get('/api/test/all', async (req, res) => {
    const results = {
      health: { status: 'ok', timestamp: new Date().toISOString() },
      environment: {
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0
      },
      generateCode: null as any,
      suggestComponents: null as any
    };

    // Test code generation
    try {
      const testRequest = {
        prompt: "Blink LED on pin 13",
        components: [{ type: "led", pins: "13", label: "Test LED" }],
        arduinoModel: "uno" as const
      };
      results.generateCode = await generateArduinoCode(testRequest);
    } catch (error) {
      results.generateCode = { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    // Test component suggestions
    try {
      results.suggestComponents = await suggestComponents("LED blink project");
    } catch (error) {
      results.suggestComponents = { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }

    res.json(results);
  });
}
