export type ArduinoModel = 'uno' | 'mega' | 'esp32';

export interface ArduinoSpec {
  name: string;
  digitalPins: number[];
  analogPins: string[];
  pwmPins: number[];
  description: string;
}

export type ComponentType = 'led' | 'servo' | 'dc-motor' | 'ultrasonic' | 'button' | 'lcd' | 'buzzer' | 'stepper';

export interface Component {
  id: string;
  type: ComponentType;
  pins: string;
  label?: string;
}

export interface ComponentSpec {
  name: string;
  pinTypes: ('digital' | 'analog' | 'pwm')[];
  pinCount: number;
  blocks: string[];
  arduBlockCategory: string;
  pinLabels?: string[];
}

export interface ParsedAction {
  type: 'set' | 'delay' | 'repeat' | 'if' | 'read' | 'print';
  component?: string;
  pin?: number;
  value?: string | number;
  duration?: number;
  condition?: string;
  count?: number;
  actions?: ParsedAction[];
}

export interface DebugIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  component?: string;
  pin?: string;
}

export interface DebugReport {
  status: 'success' | 'warning' | 'error';
  issues: DebugIssue[];
  componentCount: number;
  digitalPinsUsed: number;
  analogPinsUsed: number;
  estimatedBlocks: string;
}

export interface PseudocodeStep {
  level: number;
  text: string;
  type: 'structure' | 'action' | 'control';
  blockType?: string;
}

export interface ExportData {
  model: ArduinoModel;
  prompt: string;
  components: Component[];
  pseudocode: PseudocodeStep[];
  debugReport: DebugReport;
  timestamp: string;
  version: string;
}
