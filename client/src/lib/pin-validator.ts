import { Component, ArduinoModel, DebugIssue } from '@/types/arduino';
import { getComponentSpec, getArduinoSpec, isValidPin, isPWMPin } from './component-database';

export function validateComponents(components: Component[], model: ArduinoModel): DebugIssue[] {
  const issues: DebugIssue[] = [];
  const usedPins = new Set<string>();
  const arduinoSpec = getArduinoSpec(model);

  for (const component of components) {
    const componentSpec = getComponentSpec(component.type, component);
    
    if (!componentSpec) {
      issues.push({
        type: 'error',
        message: `Unknown component type: ${component.type}`,
        component: component.id,
        suggestion: 'Please select a supported component type'
      });
      continue;
    }

    // Parse pins
    const pins = parsePins(component.pins);
    
    if (pins.length !== componentSpec.pinCount) {
      issues.push({
        type: 'error',
        message: `${componentSpec.name} requires ${componentSpec.pinCount} pin(s), got ${pins.length}`,
        component: component.id,
        suggestion: componentSpec.pinLabels 
          ? `Use format: ${componentSpec.pinLabels.map((label, i) => `${label}:${i + 2}`).join(',')}`
          : `Provide exactly ${componentSpec.pinCount} pin(s)`
      });
      continue;
    }

    // Validate each pin
    for (let i = 0; i < pins.length; i++) {
      const pin = pins[i];
      const pinType = componentSpec.pinTypes[i];
      
      // Check if pin exists on Arduino model
      if (!isValidPin(pin, model)) {
        issues.push({
          type: 'error',
          message: `Pin ${pin} is not available on ${arduinoSpec.name}`,
          component: component.id,
          pin: pin.toString(),
          suggestion: `Available digital pins: ${arduinoSpec.digitalPins.join(', ')}`
        });
        continue;
      }

      // Check pin type requirements
      if (pinType === 'pwm' && typeof pin === 'number' && !isPWMPin(pin, model)) {
        issues.push({
          type: 'warning',
          message: `Pin ${pin} is not a PWM pin, component may not work as expected`,
          component: component.id,
          pin: pin.toString(),
          suggestion: `Available PWM pins: ${arduinoSpec.pwmPins.join(', ')}`
        });
      }

      // Check for pin conflicts
      const pinKey = pin.toString();
      if (usedPins.has(pinKey)) {
        issues.push({
          type: 'error',
          message: `Pin ${pin} is used by multiple components`,
          component: component.id,
          pin: pinKey,
          suggestion: 'Each pin can only be used by one component'
        });
      } else {
        usedPins.add(pinKey);
      }
    }
  }

  return issues;
}

export function parsePins(pinString: string): (number | string)[] {
  if (!pinString.trim()) return [];
  
  // Handle labeled pins like "trig:7,echo:8"
  if (pinString.includes(':')) {
    return pinString.split(',').map(part => {
      const [, pin] = part.split(':');
      return parsePin(pin.trim());
    });
  }
  
  // Handle simple comma-separated pins like "7,8"
  return pinString.split(',').map(pin => parsePin(pin.trim()));
}

function parsePin(pin: string): number | string {
  // Handle analog pins like "A0"
  if (pin.startsWith('A')) {
    return pin;
  }
  
  // Handle digital pins
  const num = parseInt(pin, 10);
  return isNaN(num) ? pin : num;
}

export function getUsedPinCounts(components: Component[]): { digital: number; analog: number } {
  const digitalPins = new Set<number>();
  const analogPins = new Set<string>();
  
  for (const component of components) {
    const pins = parsePins(component.pins);
    
    for (const pin of pins) {
      if (typeof pin === 'number') {
        digitalPins.add(pin);
      } else {
        analogPins.add(pin);
      }
    }
  }
  
  return {
    digital: digitalPins.size,
    analog: analogPins.size
  };
}
