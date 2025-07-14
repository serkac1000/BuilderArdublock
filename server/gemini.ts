import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

Respond with JSON in this format:
{
  "code": "Complete Arduino code here",
  "explanation": "Brief explanation of what the code does",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            code: { type: "string" },
            explanation: { type: "string" },
            suggestions: { 
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["code", "explanation", "suggestions"]
        }
      },
      contents: `Generate Arduino code for: ${prompt}`
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Failed to generate Arduino code: ${error}`);
  }
}

export async function suggestComponents(prompt: string): Promise<string[]> {
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

Respond with a JSON array of component suggestions with their typical use cases:
["component1", "component2", "component3"]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: { type: "string" }
        }
      },
      contents: `Suggest components for: ${prompt}`
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      return [];
    }
  } catch (error) {
    console.error("Component suggestion error:", error);
    return [];
  }
}