import { ComponentSpec, ArduinoSpec, ArduinoModel } from '@/types/arduino';

export const ARDUINO_MODELS: Record<ArduinoModel, ArduinoSpec> = {
  uno: {
    name: 'Arduino Uno',
    digitalPins: Array.from({ length: 14 }, (_, i) => i),
    analogPins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
    pwmPins: [3, 5, 6, 9, 10, 11],
    description: '14 Digital, 6 Analog'
  },
  mega: {
    name: 'Arduino Mega',
    digitalPins: Array.from({ length: 54 }, (_, i) => i),
    analogPins: Array.from({ length: 16 }, (_, i) => `A${i}`),
    pwmPins: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    description: '54 Digital, 16 Analog'
  },
  esp32: {
    name: 'ESP32',
    digitalPins: Array.from({ length: 40 }, (_, i) => i),
    analogPins: Array.from({ length: 20 }, (_, i) => `A${i}`),
    pwmPins: Array.from({ length: 16 }, (_, i) => i),
    description: 'WiFi + Bluetooth'
  }
};

export const COMPONENT_DATABASE: Record<string, ComponentSpec> = {
  led: {
    name: 'LED',
    pinTypes: ['digital'],
    pinCount: 1,
    blocks: ['Pin Mode', 'Set Digital Pin'],
    arduBlockCategory: 'Input/Output'
  },
  servo: {
    name: 'Servo Motor',
    pinTypes: ['pwm'],
    pinCount: 1,
    blocks: ['Servo Write', 'Servo Read'],
    arduBlockCategory: 'Servo'
  },
  'dc-motor': {
    name: 'DC Motor',
    pinTypes: ['digital', 'pwm'],
    pinCount: 1,
    blocks: ['Set Digital Pin', 'Analog Write'],
    arduBlockCategory: 'Input/Output'
  },
  ultrasonic: {
    name: 'Ultrasonic Sensor (HC-SR04)',
    pinTypes: ['digital', 'digital'],
    pinCount: 2,
    blocks: ['Ultrasonic Read'],
    arduBlockCategory: 'Sensors',
    pinLabels: ['trig', 'echo']
  },
  button: {
    name: 'Button',
    pinTypes: ['digital'],
    pinCount: 1,
    blocks: ['Digital Read', 'Pin Mode'],
    arduBlockCategory: 'Input/Output'
  },
  lcd: {
    name: 'LCD 1602',
    pinTypes: ['digital', 'digital', 'digital', 'digital', 'digital', 'digital'],
    pinCount: 6,
    blocks: ['LCD Print', 'LCD Clear', 'LCD Set Cursor'],
    arduBlockCategory: 'Display',
    pinLabels: ['rs', 'enable', 'd4', 'd5', 'd6', 'd7']
  },
  buzzer: {
    name: 'Buzzer',
    pinTypes: ['digital'],
    pinCount: 1,
    blocks: ['Set Digital Pin', 'Tone'],
    arduBlockCategory: 'Sound'
  },
  stepper: {
    name: 'Stepper Motor',
    pinTypes: ['digital', 'digital', 'digital', 'digital'],
    pinCount: 4,
    blocks: ['Stepper Step', 'Stepper Speed'],
    arduBlockCategory: 'Motor',
    pinLabels: ['in1', 'in2', 'in3', 'in4']
  }
};

export const PROMPT_EXAMPLES = {
  blink: 'Blink LED on pin 13 every 1 second',
  servo: 'Set servo on pin 9 to 90 degrees, wait 1 second, then to 0 degrees',
  sensor: 'Read ultrasonic sensor on pins 7,8 and if distance < 10cm turn on LED on pin 13',
  conditional: 'If button on pin 2 is pressed, turn on LED on pin 13 and buzzer on pin 12'
};

export function getComponentSpec(type: string): ComponentSpec | undefined {
  return COMPONENT_DATABASE[type];
}

export function getArduinoSpec(model: ArduinoModel): ArduinoSpec {
  return ARDUINO_MODELS[model];
}

export function isValidPin(pin: number | string, model: ArduinoModel): boolean {
  const spec = getArduinoSpec(model);
  
  if (typeof pin === 'number') {
    return spec.digitalPins.includes(pin);
  }
  
  return spec.analogPins.includes(pin);
}

export function isPWMPin(pin: number, model: ArduinoModel): boolean {
  const spec = getArduinoSpec(model);
  return spec.pwmPins.includes(pin);
}
