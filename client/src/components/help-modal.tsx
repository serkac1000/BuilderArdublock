import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const examples = [
    {
      title: 'Basic LED Control',
      prompt: 'Blink LED on pin 13 every 500ms, repeat forever',
      description: 'Simple LED blinking pattern'
    },
    {
      title: 'Sensor with Condition',
      prompt: 'If ultrasonic sensor distance is less than 10cm, turn on buzzer and LED',
      description: 'Conditional logic based on sensor reading'
    },
    {
      title: 'Servo Control',
      prompt: 'Set servo to 0 degrees, wait 1 second, set to 180 degrees, repeat 3 times',
      description: 'Servo motor sweep with timing'
    },
    {
      title: 'Multi-Component',
      prompt: 'Blink LED on pin 13, if button on pin 2 pressed then spin motor on pin 9 for 2 seconds',
      description: 'Multiple components with conditional control'
    }
  ];

  const supportedComponents = [
    { name: 'LED', description: 'Basic light emitting diode' },
    { name: 'Servo Motor', description: 'Position-controlled motor' },
    { name: 'DC Motor', description: 'Continuous rotation motor' },
    { name: 'Stepper Motor', description: 'Precise step-based motor' },
    { name: 'Ultrasonic Sensor', description: 'Distance measurement (HC-SR04)' },
    { name: 'Button/Switch', description: 'Digital input device' },
    { name: 'LCD Display', description: 'Text display (1602)' },
    { name: 'Buzzer', description: 'Sound generation device' }
  ];

  const keyPhrases = [
    '"blink LED" - Creates LED on/off sequence',
    '"turn on/off" - Sets digital pin high/low',
    '"set servo to X degrees" - Controls servo position',
    '"read sensor" - Gets sensor value',
    '"print text" - Displays on LCD',
    '"if [condition]" - Conditional logic',
    '"repeat X times" - Loop structure',
    '"wait X seconds" - Delay timing'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Help & Examples</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Example Prompts */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
              Example Prompts
              <Badge variant="outline" className="ml-2 text-xs">
                Copy & Paste Ready
              </Badge>
            </h3>
            <div className="grid gap-3">
              {examples.map((example, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-slate-900">{example.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {example.description}
                    </Badge>
                  </div>
                  <code className="text-sm text-slate-600 bg-white px-2 py-1 rounded border">
                    {example.prompt}
                  </code>
                </div>
              ))}
            </div>
          </div>
          
          {/* Supported Components */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Supported Components</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supportedComponents.map((component, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-medium text-slate-900 text-sm">{component.name}</h4>
                  <p className="text-xs text-slate-600 mt-1">{component.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Key Phrases */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Recognized Phrases</h3>
            <div className="grid gap-2">
              {keyPhrases.map((phrase, index) => (
                <div key={index} className="text-sm text-slate-600 p-2 bg-slate-50 rounded border border-slate-200">
                  {phrase}
                </div>
              ))}
            </div>
          </div>
          
          {/* ArduBlock.ru Integration */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">ArduBlock.ru Integration</h3>
            <p className="text-sm text-blue-800 mb-2">
              This tool generates pseudocode that maps directly to ArduBlock.ru 3.0 blocks:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Each step corresponds to a draggable block in ArduBlock.ru</li>
              <li>• Block categories match the ArduBlock.ru interface</li>
              <li>• Pin assignments and parameters are validated</li>
              <li>• Generated code follows Arduino programming structure</li>
            </ul>
          </div>
          
          {/* Tips */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h3 className="font-semibold text-emerald-900 mb-2">Pro Tips</h3>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• Be specific about pin numbers and timing</li>
              <li>• Use natural language - the parser is flexible</li>
              <li>• Check the debug report for validation issues</li>
              <li>• Export your configuration as JSON for reuse</li>
              <li>• Multi-pin components use format "trig:7,echo:8"</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
