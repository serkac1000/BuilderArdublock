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
  
  // Add setup section
  steps.push({
    level: 0,
    text: 'Add Setup block',
    type: 'structure',
    blockType: 'Setup'
  });
  
  // Add pin mode setup for each component
  const componentPins = new Map<string, number[]>();
  
  for (const component of components) {
    const spec = getComponentSpec(component.type);
    const pins = parsePins(component.pins);
    
    if (spec && pins.length > 0) {
      for (const pin of pins) {
        if (typeof pin === 'number') {
          const mode = spec.pinTypes[0] === 'digital' && component.type !== 'button' ? 'OUTPUT' : 'INPUT';
          steps.push({
            level: 1,
            text: `Add Pin Mode block for ${spec.name} on pin ${pin} to ${mode}`,
            type: 'action',
            blockType: 'Pin Mode'
          });
        }
      }
    }
  }
  
  // Add loop section
  steps.push({
    level: 0,
    text: 'Add Loop block (repeat forever)',
    type: 'structure',
    blockType: 'Loop'
  });
  
  // Process actions
  let currentLevel = 1;
  for (const action of actions) {
    addActionSteps(action, steps, currentLevel, components);
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
          text: `Add Set Digital Pin block for pin ${action.pin} to HIGH`,
          type: 'action',
          blockType: 'Set Digital Pin'
        });
        steps.push({
          level,
          text: `Add Delay block for ${action.duration} ms`,
          type: 'action',
          blockType: 'Delay'
        });
        steps.push({
          level,
          text: `Add Set Digital Pin block for pin ${action.pin} to LOW`,
          type: 'action',
          blockType: 'Set Digital Pin'
        });
        steps.push({
          level,
          text: `Add Delay block for ${action.duration} ms`,
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
        steps.push({
          level,
          text: `Add Set Digital Pin block for pin ${action.pin} to ${action.value}`,
          type: 'action',
          blockType: 'Set Digital Pin'
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
            text: `Add Set Digital Pin block for pin ${action.pin} to LOW`,
            type: 'action',
            blockType: 'Set Digital Pin'
          });
        }
      } else {
        steps.push({
          level,
          text: `Add Set Digital Pin block for pin ${action.pin} to ${action.value}`,
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
      } else {
        steps.push({
          level,
          text: `Add Digital Read block for pin ${action.pin}`,
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
