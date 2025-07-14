
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured. Please set your API key in the settings.");
  }
  
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  
  return genAI;
}

export interface ArduinoCodeRequest {
  prompt: string;
  components: Array<{
    type: string;
    pins: string;
    label?: string;
  }>;
  arduinoModel: string;
}

export interface ArduinoCodeResponse {
  code: string;
  explanation: string;
  suggestions: string[];
}

export async function generateArduinoCode(request: ArduinoCodeRequest): Promise<ArduinoCodeResponse> {
  const { prompt, components, arduinoModel } = request;
  
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured. Please set your API key in the settings.");
  }
  
  // Validate API key format
  const apiKey = process.env.GEMINI_API_KEY.trim();
  if (apiKey.length < 30) {
    throw new Error("Invalid Gemini API key format. Please check your API key.");
  }
  
  const componentsDescription = components.map(c => 
    `${c.label || c.type} (${c.type}) on pin(s) ${c.pins}`
  ).join(', ');
  
  const systemPrompt = `You are an expert Arduino programmer. Generate complete Arduino code based on the user's description and component configuration.

Arduino Model: ${arduinoModel}
Components: ${componentsDescription}
User Request: ${prompt}

Generate a complete Arduino sketch with:
1. Proper #include statements
2. Pin definitions
3. setup() function
4. loop() function
5. Helper functions if needed

Respond with JSON in this exact format:
{
  "code": "Complete Arduino code here",
  "explanation": "Brief explanation of what the code does",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}`;

  try {
    console.log("Generating Arduino code with Gemini API...");
    console.log("API Key length:", apiKey.length);
    console.log("API Key prefix:", apiKey.substring(0, 8) + "...");
    console.log("Request:", { prompt, components: components.length, arduinoModel });
    
    // Create a fresh instance with the current API key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });

    const fullPrompt = `${systemPrompt}\n\nGenerate Arduino code for: ${prompt}`;
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini response received");
    console.log("Response text length:", text.length);

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    // Try to extract JSON from the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no JSON found, create a fallback response
      console.log("No JSON found in response, creating fallback");
      return {
        code: text,
        explanation: "Generated Arduino code based on your requirements",
        suggestions: ["Test the code on your Arduino board", "Adjust delay values as needed", "Add error handling if required"]
      };
    }

    try {
      const parsedResponse = JSON.parse(jsonMatch[0]);
      console.log("Successfully parsed JSON response");
      
      // Validate the response has required fields
      if (!parsedResponse.code) {
        parsedResponse.code = text;
      }
      if (!parsedResponse.explanation) {
        parsedResponse.explanation = "Generated Arduino code based on your requirements";
      }
      if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
        parsedResponse.suggestions = ["Test the code on your Arduino board", "Adjust delay values as needed"];
      }
      
      return parsedResponse;
    } catch (parseError) {
      console.log("Failed to parse JSON, using fallback");
      return {
        code: text,
        explanation: "Generated Arduino code based on your requirements",
        suggestions: ["Test the code on your Arduino board", "Adjust delay values as needed", "Add error handling if required"]
      };
    }
  } catch (error) {
    console.error("Gemini API Error details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes("permission_denied") || errorMessage.includes("403")) {
        throw new Error("Invalid or unauthorized Gemini API key. Please verify your API key is correct and has the necessary permissions.");
      } else if (errorMessage.includes("api_key") || errorMessage.includes("401")) {
        throw new Error("Invalid Gemini API key. Please check your API key in settings.");
      } else if (errorMessage.includes("quota") || errorMessage.includes("429")) {
        throw new Error("API quota exceeded. Please check your Gemini API usage limits.");
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        throw new Error("Network error connecting to Gemini API. Please try again.");
      } else if (errorMessage.includes("unregistered callers")) {
        throw new Error("API key authentication failed. Please ensure your Gemini API key is valid and properly configured.");
      }
    }
    
    throw new Error(`Failed to generate Arduino code: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function suggestComponents(prompt: string): Promise<string[]> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured.");
    }

    const apiKey = process.env.GEMINI_API_KEY.trim();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.5,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 512,
      }
    });

    const systemPrompt = `You are an Arduino expert. Based on the user's project description, suggest appropriate electronic components.

Common Arduino components include:
- LED (basic lighting)
- Servo Motor (precise positioning)
- DC Motor (continuous rotation)
- Stepper Motor (precise steps)
- Ultrasonic Sensor (distance measurement)
- Button/Switch (input)
- LCD Display (text output)
- Buzzer (sound)
- Temperature Sensor
- Light Sensor
- Potentiometer

Respond with only a JSON array of component suggestions:
["component1", "component2", "component3"]

Suggest components for: ${prompt}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return [];
    }

    // Try to extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error("Failed to parse component suggestions JSON:", parseError);
      }
    }

    // Fallback: extract components from text
    const fallbackComponents = ["LED", "Button", "Servo Motor"];
    return fallbackComponents;
  } catch (error) {
    console.error("Component suggestion error:", error);
    return [];
  }
}
