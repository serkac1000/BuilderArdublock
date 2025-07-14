import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Info } from 'lucide-react';
import { Component, ComponentType, ArduinoModel } from '@/types/arduino';
import { COMPONENT_DATABASE, getArduinoSpec } from '@/lib/component-database';
import { nanoid } from 'nanoid';

interface ComponentConfiguratorProps {
  components: Component[];
  onComponentsChange: (components: Component[]) => void;
  arduinoModel: ArduinoModel;
}

export function ComponentConfigurator({ 
  components, 
  onComponentsChange, 
  arduinoModel 
}: ComponentConfiguratorProps) {
  const arduinoSpec = getArduinoSpec(arduinoModel);

  const addComponent = () => {
    const newComponent: Component = {
      id: nanoid(),
      type: 'led',
      pins: '',
      label: ''
    };
    onComponentsChange([...components, newComponent]);
  };

  const removeComponent = (id: string) => {
    onComponentsChange(components.filter(c => c.id !== id));
  };

  const updateComponent = (id: string, field: keyof Component, value: string) => {
    onComponentsChange(
      components.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const getPlaceholderText = (componentType: ComponentType): string => {
    const spec = COMPONENT_DATABASE[componentType];
    if (!spec) return '';
    
    if (spec.pinCount === 1) {
      return '13';
    } else if (spec.pinLabels) {
      return spec.pinLabels.map((label, i) => `${label}:${i + 2}`).join(',');
    } else {
      return Array.from({ length: spec.pinCount }, (_, i) => i + 2).join(',');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <span>Components & Pin Assignment</span>
          </CardTitle>
          <Button onClick={addComponent} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Component
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {components.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No components added yet.</p>
            <p className="text-sm">Click "Add Component" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {components.map((component) => (
              <div 
                key={component.id}
                className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg bg-slate-50"
              >
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1">
                      Component Type
                    </Label>
                    <Select 
                      value={component.type} 
                      onValueChange={(value: ComponentType) => updateComponent(component.id, 'type', value)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COMPONENT_DATABASE).map(([key, spec]) => (
                          <SelectItem key={key} value={key}>
                            {spec.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1">
                      Pin(s)
                    </Label>
                    <Input
                      type="text"
                      className="text-sm"
                      placeholder={getPlaceholderText(component.type)}
                      value={component.pins}
                      onChange={(e) => updateComponent(component.id, 'pins', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1">
                      Label (Optional)
                    </Label>
                    <Input
                      type="text"
                      className="text-sm"
                      placeholder="e.g., Main LED"
                      value={component.label || ''}
                      onChange={(e) => updateComponent(component.id, 'label', e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeComponent(component.id)}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Pin Configuration Helper */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Pin Configuration Tips:</p>
              <ul className="text-blue-700 space-y-1">
                <li>• Digital pins: {arduinoSpec.digitalPins.slice(0, 10).join(', ')}
                  {arduinoSpec.digitalPins.length > 10 && '...'}</li>
                <li>• Analog pins: {arduinoSpec.analogPins.join(', ')}</li>
                <li>• PWM pins: {arduinoSpec.pwmPins.slice(0, 10).join(', ')}
                  {arduinoSpec.pwmPins.length > 10 && '...'}</li>
                <li>• For multi-pin components like HC-SR04, use format: "trig:7,echo:8"</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
