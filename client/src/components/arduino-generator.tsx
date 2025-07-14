import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Play, Eraser, Download, Edit, HelpCircle, Moon, Microchip, Wifi } from 'lucide-react';
import { ArduinoModel, Component, DebugReport, PseudocodeStep, ExportData } from '@/types/arduino';
import { ComponentConfigurator } from './component-configurator';
import { DebugPanel } from './debug-panel';
import { PseudocodeOutput } from './pseudocode-output';
import { HelpModal } from './help-modal';
import { ARDUINO_MODELS, PROMPT_EXAMPLES } from '@/lib/component-database';
import { validateComponents, getUsedPinCounts } from '@/lib/pin-validator';
import { parsePrompt, generatePseudocode } from '@/lib/arduino-parser';
import { useToast } from '@/hooks/use-toast';

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
  
  const { toast } = useToast();

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

  const clearForm = () => {
    setProjectPrompt('');
    setComponents([]);
    setPseudocode([]);
    
    toast({
      title: "Form cleared",
      description: "All inputs have been reset",
    });
  };

  const exportJSON = () => {
    const exportData: ExportData = {
      model: selectedModel,
      prompt: projectPrompt,
      components,
      pseudocode,
      debugReport,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arduino-project-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: "Project configuration downloaded as JSON",
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
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={generateCode}
                className="flex-1 flex items-center justify-center space-x-2"
                disabled={debugReport.status === 'error'}
              >
                <Play className="w-4 h-4" />
                <span>Generate Pseudocode</span>
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
                onClick={exportJSON}
                className="bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
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
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
