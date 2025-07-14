import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Info, Settings } from 'lucide-react';
import { Component, ComponentType, ArduinoModel } from '@/types/arduino';
import { COMPONENT_DATABASE, getArduinoSpec } from '@/lib/component-database';
import { nanoid } from 'nanoid';
import { useState } from 'react';

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
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customComponentConfig, setCustomComponentConfig] = useState({
    name: '',
    pinCount: 1,
    pinTypes: ['digital'] as ('digital' | 'analog' | 'pwm')[],
    blocks: '',
    category: ''
  });

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

  const addCustomComponent = () => {
    if (!customComponentConfig.name) return;
    
    const newComponent: Component = {
      id: nanoid(),
      type: 'custom',
      pins: '',
      label: customComponentConfig.name,
      customName: customComponentConfig.name,
      customPinCount: customComponentConfig.pinCount,
      customPinTypes: customComponentConfig.pinTypes,
      customBlocks: customComponentConfig.blocks ? customComponentConfig.blocks.split(',').map(b => b.trim()) : ['Custom Block'],
      customCategory: customComponentConfig.category || 'Custom'
    };
    
    onComponentsChange([...components, newComponent]);
    setIsCustomDialogOpen(false);
    setCustomComponentConfig({
      name: '',
      pinCount: 1,
      pinTypes: ['digital'],
      blocks: '',
      category: ''
    });
  };

  const getComponentDisplayName = (component: Component): string => {
    if (component.type === 'custom' && component.customName) {
      return component.customName;
    }
    return COMPONENT_DATABASE[component.type]?.name || component.type;
  };

  const getPlaceholderText = (component: Component): string => {
    if (component.type === 'custom' && component.customPinCount) {
      if (component.customPinCount === 1) {
        return '13';
      } else {
        return Array.from({ length: component.customPinCount }, (_, i) => i + 2).join(',');
      }
    }
    
    const spec = COMPONENT_DATABASE[component.type];
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
          <div className="flex space-x-2">
            <Button onClick={addComponent} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Component
            </Button>
            <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Custom Component
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Custom Component</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="customName">Component Name</Label>
                    <Input
                      id="customName"
                      placeholder="e.g., Temperature Sensor, RGB LED Strip"
                      value={customComponentConfig.name}
                      onChange={(e) => setCustomComponentConfig(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customPinCount">Number of Pins</Label>
                    <Input
                      id="customPinCount"
                      type="number"
                      min="1"
                      max="20"
                      value={customComponentConfig.pinCount}
                      onChange={(e) => setCustomComponentConfig(prev => ({ ...prev, pinCount: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label>Pin Types</Label>
                    <div className="flex space-x-4 mt-2">
                      {(['digital', 'analog', 'pwm'] as const).map(type => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={customComponentConfig.pinTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCustomComponentConfig(prev => ({
                                  ...prev,
                                  pinTypes: [...prev.pinTypes, type]
                                }));
                              } else {
                                setCustomComponentConfig(prev => ({
                                  ...prev,
                                  pinTypes: prev.pinTypes.filter(t => t !== type)
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={type} className="text-sm capitalize">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="customBlocks">ArduBlock Blocks (comma-separated)</Label>
                    <Textarea
                      id="customBlocks"
                      placeholder="e.g., Read Temperature, Set RGB Color, Custom Function"
                      value={customComponentConfig.blocks}
                      onChange={(e) => setCustomComponentConfig(prev => ({ ...prev, blocks: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customCategory">ArduBlock Category</Label>
                    <Input
                      id="customCategory"
                      placeholder="e.g., Sensors, Actuators, Communication"
                      value={customComponentConfig.category}
                      onChange={(e) => setCustomComponentConfig(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addCustomComponent} disabled={!customComponentConfig.name}>
                    Add Component
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                    {component.type === 'custom' ? (
                      <div className="text-sm p-2 bg-white border rounded-md">
                        <span className="font-medium">{component.customName}</span>
                        <span className="text-slate-500 ml-2">(Custom)</span>
                      </div>
                    ) : (
                      <Select 
                        value={component.type} 
                        onValueChange={(value) => updateComponent(component.id, 'type', value as ComponentType)}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select component type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COMPONENT_DATABASE).map(([key, spec]) => (
                            <SelectItem key={key} value={key}>
                              {spec.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700 mb-1">
                      Pin(s)
                    </Label>
                    <Input
                      type="text"
                      className="text-sm"
                      placeholder={getPlaceholderText(component)}
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
