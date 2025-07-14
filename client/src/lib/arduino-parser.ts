import { ParsedAction, Component, PseudocodeStep } from '@/types/arduino';
import { getComponentSpec } from './component-database';
import { parsePins } from './pin-validator';

export function parsePrompt(prompt: string, components: Component[]): ParsedAction[] {
  const actions: ParsedAction[] = [];
  const sentences = prompt.split(/[,.;]/).map(s => s.trim()).filter(s => s.length > 0);
  
  let currentRepeatCount = 1;
  let isInRepeat = false;
  
  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    
    // Check for repeat commands
    const repeatMatch = lowerSentence.match(/repeat\s+(\d+)\s+times?/);
    if (repeatMatch) {
      currentRepeatCount = parseInt(repeatMatch[1], 10);
      isInRepeat = true;
      continue;
    }
    
    // Parse individual actions
    const action = parseAction(lowerSentence, components);
    if (action) {
      if (isInRepeat && currentRepeatCount > 1) {
        actions.push({
          type: 'repeat',
          count: currentRepeatCount,
          actions: [action]
        });
        isInRepeat = false;
        currentRepeatCount = 1;
      } else {
        actions.push(action);
      }
    }
  }
  
  return actions;
}

function parseAction(sentence: string, components: Component[]): ParsedAction | null {
  // Blink LED patterns
  if (sentence.includes('blink') && sentence.includes('led')) {
    const pinMatch = sentence.match(/pin\s+(\d+)/);
    const durationMatch = sentence.match(/(\d+)\s*(ms|milliseconds?|seconds?)/);
    
    let duration = 1000; // default 1 second
    if (durationMatch) {
      const value = parseInt(durationMatch[1], 10);
      duration = durationMatch[2].startsWith('s') ? value * 1000 : value;
    }
    
    return {
      type: 'set',
      component: 'led',
      pin: pinMatch ? parseInt(pinMatch[1], 10) : undefined,
      value: 'blink',
      duration
    };
  }
  
  // Turn on/off patterns
  const turnMatch = sentence.match(/turn\s+(on|off)\s+(\w+)(?:\s+on\s+pin\s+(\d+))?/);
  if (turnMatch) {
    return {
      type: 'set',
      component: turnMatch[2],
      pin: turnMatch[3] ? parseInt(turnMatch[3], 10) : undefined,
      value: turnMatch[1] === 'on' ? 'HIGH' : 'LOW'
    };
  }
  
  // Servo control patterns
  const servoMatch = sentence.match(/set\s+servo(?:\s+on\s+pin\s+(\d+))?\s+to\s+(\d+)\s*degrees?/);
  if (servoMatch) {
    return {
      type: 'set',
      component: 'servo',
      pin: servoMatch[1] ? parseInt(servoMatch[1], 10) : undefined,
      value: parseInt(servoMatch[2], 10)
    };
  }
  
  // Motor control patterns
  const motorMatch = sentence.match(/(spin|start|run)\s+(dc\s+)?motor(?:\s+on\s+pin\s+(\d+))?(?:\s+for\s+(\d+)\s*(ms|milliseconds?|seconds?))?/);
  if (motorMatch) {
    let duration = 0;
    if (motorMatch[4]) {
      const value = parseInt(motorMatch[4], 10);
      duration = motorMatch[5] && motorMatch[5].startsWith('s') ? value * 1000 : value;
    }
    
    return {
      type: 'set',
      component: 'dc-motor',
      pin: motorMatch[3] ? parseInt(motorMatch[3], 10) : undefined,
      value: 'HIGH',
      duration
    };
  }
  
  // Delay patterns
  const delayMatch = sentence.match(/(?:wait|delay)(?:\s+for)?\s+(\d+)\s*(ms|milliseconds?|seconds?)/);
  if (delayMatch) {
    const value = parseInt(delayMatch[1], 10);
    const duration = delayMatch[2].startsWith('s') ? value * 1000 : value;
    
    return {
      type: 'delay',
      duration
    };
  }
  
  // Sensor reading patterns
  const sensorMatch = sentence.match(/read\s+(\w+)\s+sensor(?:\s+on\s+pins?\s+([\d,]+))?/);
  if (sensorMatch) {
    return {
      type: 'read',
      component: sensorMatch[1],
      pin: sensorMatch[2] ? parseInt(sensorMatch[2].split(',')[0], 10) : undefined
    };
  }
  
  // LCD print patterns
  const lcdMatch = sentence.match(/print\s+(?:text\s+)?['"](.*?)['"](?:\s+on\s+lcd)?/);
  if (lcdMatch) {
    return {
      type: 'print',
      component: 'lcd',
      value: lcdMatch[1]
    };
  }
  
  // Conditional patterns
  const ifMatch = sentence.match(/if\s+(.+)/);
  if (ifMatch) {
    return {
      type: 'if',
      condition: ifMatch[1]
    };
  }
  
  return null;
}

export function generatePseudocode(actions: ParsedAction[], components: Component[]): PseudocodeStep[] {
  const steps: PseudocodeStep[] = [];
  
  // Add program structure
  steps.push({
    level: 0,
    text: 'Add Program block',
    type: 'structure',
    blockType: 'Program'
  });
  
  // Add variable declarations if needed for complex components
  const hasMotors = components.some(c => c.type === 'dc-motor' || c.type === 'stepper');
  const hasSensors = components.some(c => c.type === 'ultrasonic' || c.type === 'button');
  
  if (hasMotors || hasSensors) {
    steps.push({
      level: 0,
      text: 'Add Variable Declaration blocks for component control',
      type: 'structure',
      blockType: 'Variables'
    });
  }
  
  // Add setup section
  steps.push({
    level: 0,
    text: 'Add Setup block',
    type: 'structure',
    blockType: 'Setup'
  });
  
  // Add serial communication for debugging
  steps.push({
    level: 1,
    text: 'Add Serial Begin block (9600 baud)',
    type: 'action',
    blockType: 'Serial Begin'
  });
  
  // Add pin mode setup for each component
  for (const component of components) {
    const spec = getComponentSpec(component.type, component);
    const pins = parsePins(component.pins);
    
    if (spec && pins.length > 0) {
      for (const pin of pins) {
        if (typeof pin === 'number') {
          const mode = spec.pinTypes[0] === 'digital' && component.type !== 'button' ? 'OUTPUT' : 'INPUT';
          const label = component.label || spec.name;
          steps.push({
            level: 1,
            text: `Add Pin Mode block for ${label} on pin ${pin} to ${mode}`,
            type: 'action',
            blockType: 'Pin Mode'
          });
        }
      }
    }
  }
  
  // Add initial motor speed settings
  const motorComponents = components.filter(c => c.type === 'dc-motor' || c.type === 'stepper');
  for (const motor of motorComponents) {
    const label = motor.label || 'Motor';
    steps.push({
      level: 1,
      text: `Add Variable Set block for ${label} speed to 0`,
      type: 'action',
      blockType: 'Variable Set'
    });
  }
  
  // Add loop section
  steps.push({
    level: 0,
    text: 'Add Loop block (repeat forever)',
    type: 'structure',
    blockType: 'Loop'
  });
  
  // Add sensor reading blocks if we have sensors
  const sensorComponents = components.filter(c => c.type === 'ultrasonic' || c.type === 'button');
  for (const sensor of sensorComponents) {
    const pins = parsePins(sensor.pins);
    const label = sensor.label || getComponentSpec(sensor.type, sensor)?.name || 'Sensor';
    
    if (sensor.type === 'ultrasonic') {
      steps.push({
        level: 1,
        text: `Add Ultrasonic Read block for ${label} (trig: ${pins[0]}, echo: ${pins[1]})`,
        type: 'action',
        blockType: 'Ultrasonic Read'
      });
    } else if (sensor.type === 'button') {
      steps.push({
        level: 1,
        text: `Add Digital Read block for ${label} on pin ${pins[0]}`,
        type: 'action',
        blockType: 'Digital Read'
      });
    }
  }
  
  // Add analog reading for potentiometers or analog sensors
  const analogComponents = components.filter(c => {
    const pins = parsePins(c.pins);
    return pins.some(pin => typeof pin === 'string' && pin.startsWith('A'));
  });
  
  for (const analog of analogComponents) {
    const pins = parsePins(analog.pins);
    const analogPin = pins.find(pin => typeof pin === 'string' && pin.startsWith('A'));
    if (analogPin) {
      steps.push({
        level: 1,
        text: `Add Analog Read block for ${analog.label || 'Sensor'} on pin ${analogPin}`,
        type: 'action',
        blockType: 'Analog Read'
      });
      
      steps.push({
        level: 1,
        text: `Add Map block to convert analog value (0-1023) to motor speed (0-255)`,
        type: 'action',
        blockType: 'Map'
      });
    }
  }
  
  // Process actions from prompt
  let currentLevel = 1;
  for (const action of actions) {
    addActionSteps(action, steps, currentLevel, components);
  }
  
  // Add motor control sequences for complex motor projects
  for (const motor of motorComponents) {
    const pins = parsePins(motor.pins);
    const label = motor.label || 'Motor';
    
    steps.push({
      level: 1,
      text: `Add Motor Speed Set block for ${label} (use mapped speed value)`,
      type: 'action',
      blockType: 'Motor Speed'
    });
    
    steps.push({
      level: 1,
      text: `Add Motor Direction block for ${label} to FORWARD`,
      type: 'action',
      blockType: 'Motor Direction'
    });
    
    steps.push({
      level: 1,
      text: 'Add Delay block for 1000ms (1 second)',
      type: 'action',
      blockType: 'Delay'
    });
  }
  
  return steps;
}

function addActionSteps(action: ParsedAction, steps: PseudocodeStep[], level: number, components: Component[]): void {
  switch (action.type) {
    case 'repeat':
      steps.push({
        level,
        text: `Add Repeat block for ${action.count} times`,
        type: 'control',
        blockType: 'Repeat'
      });
      
      if (action.actions) {
        for (const subAction of action.actions) {
          addActionSteps(subAction, steps, level + 1, components);
        }
      }
      break;
      
    case 'set':
      if (action.component === 'led' && action.value === 'blink') {
        // Blink sequence
        steps.push({
          level,
          text: `Add Set Digital Pin block for LED on pin ${action.pin} to HIGH`,
          type: 'action',
          blockType: 'Set Digital Pin'
        });
        steps.push({
          level,
          text: `Add Delay block for ${action.duration || 1000} ms`,
          type: 'action',
          blockType: 'Delay'
        });
        steps.push({
          level,
          text: `Add Set Digital Pin block for LED on pin ${action.pin} to LOW`,
          type: 'action',
          blockType: 'Set Digital Pin'
        });
        steps.push({
          level,
          text: `Add Delay block for ${action.duration || 1000} ms`,
          type: 'action',
          blockType: 'Delay'
        });
      } else if (action.component === 'servo') {
        steps.push({
          level,
          text: `Add Servo Write block for pin ${action.pin} to ${action.value} degrees`,
          type: 'action',
          blockType: 'Servo Write'
        });
      } else if (action.component === 'dc-motor') {
        // Enhanced motor control
        steps.push({
          level,
          text: `Add Motor Speed Set block for motor on pin ${action.pin}`,
          type: 'action',
          blockType: 'Motor Speed'
        });
        steps.push({
          level,
          text: `Add Motor Direction block for motor on pin ${action.pin} to FORWARD`,
          type: 'action',
          blockType: 'Motor Direction'
        });
        
        if (action.duration && action.duration > 0) {
          steps.push({
            level,
            text: `Add Delay block for ${action.duration} ms`,
            type: 'action',
            blockType: 'Delay'
          });
          steps.push({
            level,
            text: `Add Motor Stop block for motor on pin ${action.pin}`,
            type: 'action',
            blockType: 'Motor Stop'
          });
        }
      } else {
        steps.push({
          level,
          text: `Add Set Digital Pin block for ${action.component || 'component'} on pin ${action.pin} to ${action.value}`,
          type: 'action',
          blockType: 'Set Digital Pin'
        });
      }
      break;
      
    case 'delay':
      steps.push({
        level,
        text: `Add Delay block for ${action.duration} ms`,
        type: 'action',
        blockType: 'Delay'
      });
      break;
      
    case 'read':
      if (action.component === 'ultrasonic') {
        steps.push({
          level,
          text: `Add Ultrasonic Read block for sensor on pin ${action.pin}`,
          type: 'action',
          blockType: 'Ultrasonic Read'
        });
        steps.push({
          level,
          text: `Add Variable Set block to store distance value`,
          type: 'action',
          blockType: 'Variable Set'
        });
      } else {
        steps.push({
          level,
          text: `Add Digital Read block for ${action.component || 'component'} on pin ${action.pin}`,
          type: 'action',
          blockType: 'Digital Read'
        });
      }
      break;
      
    case 'print':
      steps.push({
        level,
        text: `Add LCD Print block with text "${action.value}"`,
        type: 'action',
        blockType: 'LCD Print'
      });
      break;
      
    case 'if':
      steps.push({
        level,
        text: `Add If block with condition "${action.condition}"`,
        type: 'control',
        blockType: 'If'
      });
      break;
  }
}
