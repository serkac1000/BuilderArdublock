` tags.
```
<replit_final_file>
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Play, Eraser, Download, Edit, HelpCircle, Moon, Microchip, Wifi, Sparkles, Lightbulb, Key, Check, X } from 'lucide-react';
import { ArduinoModel, Component, DebugReport, PseudocodeStep, ExportData } from '@/types/arduino';
import { ComponentConfigurator } from './component-configurator';
import { DebugPanel } from './debug-panel';
import { PseudocodeOutput } from './pseudocode-output';
import { HelpModal } from './help-modal';
import { ARDUINO_MODELS, PROMPT_EXAMPLES, getComponentSpec } from '@/lib/component-database';
import { validateComponents, getUsedPinCounts, parsePins } from '@/lib/pin-validator';
import { parsePrompt, generatePseudocode } from '@/lib/arduino-parser';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function ArduinoGenerator() {
  const [selectedModel, setSelectedModel] = useState<ArduinoModel>('uno');
  const [projectPrompt, setProjectPrompt] = useState('Blink LED on pin 13 for 1 second, spin DC motor on pin 9 for 2 seconds, repeat 5 times');
  const [components, setComponents] = useState<Component[]>([
    { id: '1', type: 'led', pins: '13', label: 'Main LED' },
    { id: '2', type: 'dc-motor', pins: '9', label: 'Drive Motor' }
  ]);
  const [debugReport, setDebugReport] = useState<DebugReport>({
    status: 'success',
    issues: [],
    componentCount: 2,
    digitalPinsUsed: 2,
    analogPinsUsed: 0,
    estimatedBlocks: '8-12'
  });
  const [pseudocode, setPseudocode] = useState<PseudocodeStep[]>([]);
  const [showPseudocode, setShowPseudocode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [aiGeneratedCode, setAiGeneratedCode] = useState<string>('');
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [isGeneratingComponents, setIsGeneratingComponents] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);

  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      checkApiKey(savedApiKey);
    }
  }, []);

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save to server
      const response = await apiRequest('POST', '/api/set-api-key', { apiKey });

      if (response.ok) {
        // Save to localStorage as backup
        localStorage.setItem('gemini_api_key', apiKey);
        setApiStatus('valid');
        setShowApiSettings(false);

        toast({
          title: "API Key Saved",
          description: "Your Gemini API key has been saved successfully",
        });
      } else {
        throw new Error('Failed to save API key');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const checkApiKey = async (key?: string) => {
    const keyToCheck = key || apiKey;
    if (!keyToCheck) return;

    try {
      const response = await apiRequest('POST', '/api/test-api-key', { apiKey: keyToCheck });
      if (response.ok) {
        setApiStatus('valid');
      } else {
        setApiStatus('invalid');
      }
    } catch (error) {
      setApiStatus('invalid');
    }
  };

  // Update debug report when components or model changes
  useEffect(() => {
    const issues = validateComponents(components, selectedModel);
    const pinCounts = getUsedPinCounts(components);

    const newReport: DebugReport = {
      status: issues.some(i => i.type === 'error') ? 'error' : 
              issues.some(i => i.type === 'warning') ? 'warning' : 'success',
      issues,
      componentCount: components.length,
      digitalPinsUsed: pinCounts.digital,
      analogPinsUsed: pinCounts.analog,
      estimatedBlocks: `${Math.max(4, components.length * 2)}-${Math.max(8, components.length * 4)}`
    };

    setDebugReport(newReport);
  }, [components, selectedModel]);

  const generateCode = () => {
    if (debugReport.status === 'error') {
      toast({
        title: "Cannot generate code",
        description: "Please fix the errors shown in the debug report first",
        variant: "destructive",
      });
      return;
    }

    try {
      const actions = parsePrompt(projectPrompt, components);
      const steps = generatePseudocode(actions, components);
      setPseudocode(steps);
      setShowPseudocode(true);

      toast({
        title: "Pseudocode generated",
        description: `Generated ${steps.length} ArduBlock.ru compatible instructions`,
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Unable to parse the project description. Please check your prompt.",
        variant: "destructive",
      });
    }
  };

  const generateWithAI = async () => {
    if (debugReport.status === 'error') {
      toast({
        title: "Cannot generate code",
        description: "Please fix the errors shown in the debug report first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingWithAI(true);
    try {
      const response = await apiRequest('POST', '/api/generate-code', {
        prompt: projectPrompt,
        components: components.map(c => ({
          type: c.type,
          pins: c.pins,
          label: c.label
        })),
        arduinoModel: selectedModel
      });

      if (response.ok) {
        const data = await response.json();
        setAiGeneratedCode(data.code);
        setAiExplanation(data.explanation);
        setAiSuggestions(data.suggestions || []);

        toast({
          title: "AI code generated",
          description: "Complete Arduino code generated successfully",
        });
      } else {
        throw new Error('Failed to generate code');
      }
    } catch (error) {
      toast({
        title: "AI generation failed",
        description: "Failed to generate code with AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  const suggestComponents = async () => {
    setIsGeneratingComponents(true);
    try {
      const response = await apiRequest('POST', '/api/suggest-components', {
        prompt: projectPrompt
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Component suggestions",
          description: `Suggested: ${data.suggestions.join(', ')}`,
        });
      } else {
        throw new Error('Failed to suggest components');
      }
    } catch (error) {
      toast({
        title: "Suggestion failed",
        description: "Failed to suggest components. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingComponents(false);
    }
  };

  const clearForm = () => {
    setProjectPrompt('');
    setComponents([]);
    setPseudocode([]);

    toast({
      title: "Form cleared",
      description: "All inputs have been reset",
    });
  };

  const generateArduinoCode = (): string => {
    const actions = parsePrompt(projectPrompt, components);
    const { digital: digitalPins, analog: analogPins } = getUsedPinCounts(components);

    let code = `/*
 * Arduino Code Generated from ArduBlock Pseudocode Generator
 * Model: ${ARDUINO_MODELS[selectedModel].name}
 * Generated: ${new Date().toLocaleDateString()}
 * Components: ${components.length}
 * Digital Pins Used: ${digitalPins}
 * Analog Pins Used: ${analogPins}
 */

`;

    // Add component definitions
    code += "// Component Pin Definitions\n";
    for (const component of components) {
      const spec = getComponentSpec(component.type, component);
      if (spec) {
        code += `// ${spec.name}: ${component.pins}\n`;
        const pins = parsePins(component.pins);
        pins.forEach((pin, index) => {
          if (typeof pin === 'number') {
            const label = component.label || `${component.type}${index + 1}`;
            code += `#define ${label.toUpperCase().replace(/\s+/g, '_')}_PIN ${pin}\n`;
          }
        });
      }
    }

    code += "\nvoid setup() {\n";
    code += "  // Initialize serial communication\n";
    code += "  Serial.begin(9600);\n\n";

    // Add pin modes
    for (const component of components) {
      const spec = getComponentSpec(component.type, component);
      if (spec) {
        const pins = parsePins(component.pins);
        pins.forEach((pin, index) => {
          if (typeof pin === 'number') {
            const mode = spec.pinTypes[index] === 'digital' && component.type !== 'button' ? 'OUTPUT' : 'INPUT';
            code += `  pinMode(${pin}, ${mode}); // ${spec.name}\n`;
          }
        });
      }
    }

    code += "}\n\nvoid loop() {\n";

    // Add main loop logic based on actions
    for (const action of actions) {
      code += generateCodeForAction(action, components, 1);
    }

    code += "}\n";

    return code;
  };

  const generateCodeForAction = (action: ParsedAction, components: Component[], indent: number = 0): string => {
    const spaces = '  '.repeat(indent);
    let code = '';

    switch (action.type) {
      case 'set':
        if (action.component === 'led' && action.value === 'blink') {
          code += `${spaces}digitalWrite(${action.pin}, HIGH);\n`;
          code += `${spaces}delay(${action.duration || 1000});\n`;
          code += `${spaces}digitalWrite(${action.pin}, LOW);\n`;
          code += `${spaces}delay(${action.duration || 1000});\n`;
        } else {
          const value = action.value === 'HIGH' || action.value === 'on' ? 'HIGH' : 'LOW';
          code += `${spaces}digitalWrite(${action.pin}, ${value});\n`;
        }
        break;
      case 'delay':
        code += `${spaces}delay(${action.duration});\n`;
        break;
      case 'repeat':
        code += `${spaces}for (int i = 0; i < ${action.count}; i++) {\n`;
        if (action.actions) {
          for (const subAction of action.actions) {
            code += generateCodeForAction(subAction, components, indent + 1);
          }
        }
        code += `${spaces}}\n`;
        break;
      case 'read':
        code += `${spaces}int sensorValue = digitalRead(${action.pin});\n`;
        break;
      case 'print':
        code += `${spaces}Serial.println("${action.value}");\n`;
        break;
    }

    return code;
  };

  const exportTXT = () => {
    let content = `Arduino Project Instructions - ArduBlock.ru Compatible
========================================================

Project: ${projectPrompt}
Arduino Model: ${ARDUINO_MODELS[selectedModel].name}
Generated: ${new Date().toLocaleString()}
Components: ${components.length}

COMPONENTS CONFIGURATION:
------------------------
`;

    for (const component of components) {
      const spec = getComponentSpec(component.type, component);
      if (spec) {
        content += `• ${spec.name}${component.label ? ` (${component.label})` : ''}\n`;
        content += `  Pins: ${component.pins}\n`;
        content += `  ArduBlock Category: ${spec.arduBlockCategory}\n`;
        content += `  Required Blocks: ${spec.blocks.join(', ')}\n\n`;
      }
    }

    content += `ARDUBLOCK.RU INSTRUCTIONS:
--------------------------
`;

    for (const step of pseudocode) {
      const indent = '  '.repeat(step.level);
      content += `${indent}${step.text}\n`;
    }

    content += `

PROJECT DESCRIPTION:
-------------------
${projectPrompt}

DEBUG REPORT:
-------------
Status: ${debugReport.status.toUpperCase()}
Digital Pins Used: ${debugReport.digitalPinsUsed}
Analog Pins Used: ${debugReport.analogPinsUsed}
Estimated Blocks: ${debugReport.estimatedBlocks}
`;

    if (debugReport.issues.length > 0) {
      content += `\nISSUES:\n`;
      for (const issue of debugReport.issues) {
        content += `• ${issue.type.toUpperCase()}: ${issue.message}\n`;
        if (issue.suggestion) {
          content += `  Suggestion: ${issue.suggestion}\n`;
        }
      }
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arduino-project-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Project instructions downloaded as TXT file",
    });
  };

  const exportINO = () => {
    if (debugReport.status === 'error') {
      toast({
        title: "Cannot export .ino file",
        description: "Please fix the errors shown in the debug report first",
        variant: "destructive",
      });
      return;
    }

    const code = generateArduinoCode();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arduino-project-${Date.now()}.ino`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Arduino code downloaded as .ino file",
    });
  };

  const addPromptExample = (example: keyof typeof PROMPT_EXAMPLES) => {
    const exampleText = PROMPT_EXAMPLES[example];
    setProjectPrompt(prev => prev ? `${prev}, ${exampleText}` : exampleText);
  };

  const getModelIcon = (model: ArduinoModel) => {
    switch (model) {
      case 'esp32':
        return <Wifi className="w-6 h-6" />;
      default:
        return <Microchip className="w-6 h-6" />;
    }
  };

  const exportToJSON = () => {
    const data = {
      projectPrompt,
      components: components.map(c => ({
        type: c.type,
        pins: c.pins,
        label: c.label
      })),
      arduinoModel: selectedModel,
      aiGeneratedCode,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arduino-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToINO = () => {
    if (!aiGeneratedCode) return;

    const blob = new Blob([aiGeneratedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arduino-sketch-${Date.now()}.ino`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const testApiKey = async (keyToTest: string) => {
    setIsTestingApiKey(true);
    try {
      const response = await apiRequest('POST', '/api/test-api-key', {
        apiKey: keyToTest
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeyValid(data.valid);
        return data.valid;
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      setApiKeyValid(false);
      return false;
    } finally {
      setIsTestingApiKey(false);
    }
    return false;
  };

  

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Microchip className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Arduino Code Generator</h1>
                <p className="text-sm text-slate-500">Compatible with ArduBlock.ru 3.0</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowApiSettings(true)}
                className={`relative ${apiStatus === 'valid' ? 'text-green-600' : apiStatus === 'invalid' ? 'text-red-600' : 'text-slate-500'}`}
              >
                <span className="text-sm mr-2">API</span>
                <div className={`w-2 h-2 rounded-full ${apiStatus === 'valid' ? 'bg-green-500' : apiStatus === 'invalid' ? 'bg-red-500' : 'bg-slate-400'}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)}>
                <HelpCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-6">

            {/* Arduino Model Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Microchip className="w-5 h-5 text-primary" />
                  <span>Arduino Model Selection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(Object.entries(ARDUINO_MODELS) as [ArduinoModel, typeof ARDUINO_MODELS[ArduinoModel]][]).map(([key, model]) => (
                    <div key={key} className="relative">
                      <input
                        type="radio"
                        name="arduino-model"
                        id={key}
                        value={key}
                        checked={selectedModel === key}
                        onChange={(e) => setSelectedModel(e.target.value as ArduinoModel)}
                        className="sr-only peer"
                      />
                      <label
                        htmlFor={key}
                        className="flex flex-col items-center p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-primary/30 peer-checked:border-primary peer-checked:bg-primary/5 transition-all"
                      >
                        <div className="text-2xl text-slate-400 peer-checked:text-primary mb-2">
                          {getModelIcon(key)}
                        </div>
                        <span className="font-medium text-slate-700">{model.name}</span>
                        <span className="text-sm text-slate-500">{model.description}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Natural Language Prompt */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Edit className="w-5 h-5 text-primary" />
                    <span>Project Description</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)}>
                    View Examples
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt" className="text-sm font-medium text-slate-700 mb-2">
                    Describe your Arduino project in natural language
                  </Label>
                  <Textarea
                    id="prompt"
                    rows={4}
                    className="resize-none"
                    placeholder="Example: Blink LED on pin 13 for 1 second, if button on pin 2 is pressed then turn on servo motor to 90 degrees, repeat 5 times"
                    value={projectPrompt}
                    onChange={(e) => setProjectPrompt(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PROMPT_EXAMPLES) as (keyof typeof PROMPT_EXAMPLES)[]).map((key) => (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => addPromptExample(key)}
                    >
                      + {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Component Configuration */}
            <ComponentConfigurator
              components={components}
              onComponentsChange={setComponents}
              arduinoModel={selectedModel}
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={generateCode}
                className="bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2 flex-1 sm:flex-none"
                disabled={debugReport.status === 'error'}
              >
                <Play className="w-4 h-4" />
                <span>Generate Pseudocode</span>
              </Button>
              <Button
                onClick={generateWithAI}
                className="bg-purple-600 hover:bg-purple-700 flex items-center justify-center space-x-2"
                disabled={debugReport.status === 'error' || isGeneratingWithAI}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingWithAI ? 'Generating...' : 'AI Generate'}</span>
              </Button>
              <Button
                onClick={suggestComponents}
                variant="outline"
                className="flex items-center justify-center space-x-2"
                disabled={isGeneratingComponents || !projectPrompt.trim()}
              >
                <Lightbulb className="w-4 h-4" />
                <span>{isGeneratingComponents ? 'Suggesting...' : 'Suggest Components'}</span>
              </Button>
              <Button
                variant="outline"
                onClick={clearForm}
                className="flex items-center justify-center space-x-2"
              >
                <Eraser className="w-4 h-4" />
                <span>Clear Form</span>
              </Button>
              <Button
                onClick={exportTXT}
                className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export TXT</span>
              </Button>
              <Button
                onClick={exportINO}
                className="bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center space-x-2"
                disabled={debugReport.status === 'error'}
              >
                <Download className="w-4 h-4" />
                <span>Export INO</span>
              </Button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-1">
            <DebugPanel debugReport={debugReport} />
          </div>
        </div>

        {/* Pseudocode Output */}
        <div className="mt-8">
          <PseudocodeOutput
            pseudocode={pseudocode}
            isVisible={showPseudocode}
            onToggle={() => setShowPseudocode(!showPseudocode)}
          />
        </div>

        {/* AI Generated Code Output */}
        {aiGeneratedCode && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>AI Generated Arduino Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiExplanation && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Explanation:</h4>
                      <p className="text-purple-800">{aiExplanation}</p>
                    </div>
                  )}

                  <div className="relative">
                    <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                      <code>{aiGeneratedCode}</code>
                    </pre>
                    <Button
                      onClick={() => navigator.clipboard.writeText(aiGeneratedCode)}
                      className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white p-2"
                      size="sm"
                    >
                      Copy
                    </Button>
                  </div>

                  {aiSuggestions.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">AI Suggestions:</h4>
                      <ul className="text-blue-800 space-y-1">
                        {aiSuggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* API Settings Dialog */}
      <Dialog open={showApiSettings} onOpenChange={setShowApiSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Settings</DialogTitle>
            <DialogDescription>
              Configure your Google Gemini API key to enable AI-powered code generation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key" className="text-sm font-medium">
                Gemini API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                Get your API key from{' '}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            {apiStatus !== 'unknown' && (
              <div className={`p-3 rounded-md text-sm ${
                apiStatus === 'valid' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {apiStatus === 'valid' ? '✓ API key is valid' : '✗ API key is invalid or has insufficient permissions'}
              </div>
            )}

            <div className="flex justify-between space-x-2">
              <Button variant="outline" onClick={() => checkApiKey()}>
                Test API Key
              </Button>
              <Button onClick={saveApiKey}>
                Save API Key
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}