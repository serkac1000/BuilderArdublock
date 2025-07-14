# Arduino ArduBlock Pseudocode Generator

A full-stack web application that converts natural language descriptions into ArduBlock.ru 3.0 compatible pseudocode for Arduino projects. This tool helps users create Arduino projects by translating plain English descriptions into structured pseudocode that can be used with the ArduBlock.ru visual programming environment.

## Features

### 🔧 Arduino Model Support
- **Arduino Uno**: 14 Digital pins, 6 Analog pins
- **Arduino Mega**: 54 Digital pins, 16 Analog pins  
- **ESP32**: 40 Digital pins, WiFi + Bluetooth support

### 🎯 Smart Component Configuration
- **LED**: Basic light control with blinking patterns
- **Servo Motor**: Position-controlled movement (0-180 degrees)
- **DC Motor**: Continuous rotation control
- **Stepper Motor**: Precise step-based movement
- **Ultrasonic Sensor (HC-SR04)**: Distance measurement
- **Button/Switch**: Digital input detection
- **LCD Display (1602)**: Text output display
- **Buzzer**: Sound generation

### 🧠 Natural Language Processing
- Parse complex prompts with conditional logic
- Support for timing specifications (seconds, milliseconds)
- Handle loop structures ("repeat X times")
- Extract component actions and parameters
- Generate Arduino-compatible pseudocode

### 🔍 Real-time Validation
- Pin conflict detection
- Arduino model compatibility checking
- Component requirements validation
- Detailed error reporting with suggestions

### 📄 Export & Integration
- JSON export for project sharing
- ArduBlock.ru 3.0 block mapping
- Copy-to-clipboard functionality
- Step-by-step block instructions

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd arduino-ardublock-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:

**Linux/macOS:**
```bash
npm run dev
```

**Windows (Command Prompt):**
```cmd
# Use the provided batch file (recommended)
start-windows.bat

# Or manually set environment and run
set NODE_ENV=development && npx tsx server/index.ts
```

**Windows (PowerShell):**
```powershell
# Use the PowerShell script
./start-windows.ps1

# Or manually set environment and run
$env:NODE_ENV="development"; npx tsx server/index.ts
```

The application will be available at `http://localhost:5000`

### Windows-Specific Notes
- If you see the error `'NODE_ENV' is not recognized`, use the provided `start-windows.bat` file
- The application includes automatic port management to handle conflicts
- See `README-Windows.md` for detailed Windows setup instructions

## Usage Examples

### Basic LED Control
```
Prompt: "Blink LED on pin 13 every 1 second"
Components: LED on pin 13
Result: Generates ON/OFF sequence with 1000ms delays
```

### Conditional Logic
```
Prompt: "If button on pin 2 is pressed, turn on LED on pin 13 and buzzer on pin 12"
Components: Button on pin 2, LED on pin 13, Buzzer on pin 12
Result: Generates conditional block structure
```

### Servo Control
```
Prompt: "Set servo to 0 degrees, wait 1 second, set to 180 degrees, repeat 3 times"
Components: Servo on pin 9
Result: Generates servo positioning with timing loops
```

### Multi-Component Project
```
Prompt: "Read ultrasonic sensor, if distance < 10cm turn on LED and motor for 2 seconds"
Components: Ultrasonic (trig:7,echo:8), LED on pin 13, DC Motor on pin 9
Result: Generates sensor reading with conditional motor control
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── lib/           # Utility libraries
│   │   ├── pages/         # Route pages
│   │   └── types/         # TypeScript definitions
├── server/                # Backend Express server
├── shared/                # Shared schemas and types
├── start.bat             # Windows startup script
└── README.md
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, TypeScript
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Build Tools**: Vite, esbuild

## ArduBlock.ru 3.0 Compatibility

This tool generates pseudocode that maps directly to ArduBlock.ru blocks:

### Block Categories
- **Program Structure**: Program, Setup, Loop blocks
- **Control Flow**: Repeat, If/Else, Delay blocks
- **Input/Output**: Set Digital Pin, Digital Read, Pin Mode
- **Specialized**: Servo Write, Ultrasonic Read, LCD Print, Tone

### Block Mapping Examples
- `"blink LED"` → Set Digital Pin HIGH → Delay → Set Digital Pin LOW
- `"set servo to 90 degrees"` → Servo Write block with angle parameter
- `"read ultrasonic sensor"` → Ultrasonic Read block with trig/echo pins
- `"if button pressed"` → If block with Digital Read condition

## Pin Configuration

### Format Examples
- **Single pin**: `13` (for LED, Button, Buzzer)
- **Multiple pins**: `trig:7,echo:8` (for Ultrasonic sensor)
- **LCD pins**: `rs:12,enable:11,d4:5,d5:4,d6:3,d7:2`

### Pin Validation
- Checks pin availability for selected Arduino model
- Validates PWM requirements for servo motors
- Detects pin conflicts between components
- Suggests alternative pins when needed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, issues, or feature requests, please open an issue on the GitHub repository.

## Acknowledgments

- ArduBlock.ru team for the visual programming environment
- Arduino community for hardware specifications
- Open source component library contributors