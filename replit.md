# ArduBlock Pseudocode Generator

## Overview

This is a full-stack web application that generates ArduBlock-compatible pseudocode from natural language prompts. The application helps users create Arduino projects by translating plain English descriptions into structured pseudocode that can be used with the ArduBlock.ru visual programming environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Styling**: CSS custom properties for theming with dark/light mode support
- **State Management**: React hooks with TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Development**: Hot module replacement via Vite integration
- **Middleware**: Express middleware for JSON parsing and request logging

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured via Neon serverless)
- **Migrations**: Drizzle Kit for schema migrations
- **Storage Interface**: Abstracted storage layer with in-memory fallback

## Key Components

### Core Application Features
1. **Arduino Model Selection**: Support for Arduino Uno, Mega, and ESP32
2. **Component Configuration**: Visual interface for setting up electronic components
3. **Natural Language Parser**: Converts plain English to structured actions
4. **Pseudocode Generator**: Creates ArduBlock-compatible instruction sequences
5. **Debug System**: Validates pin assignments and component compatibility
6. **Export Functionality**: JSON export for sharing and reuse

### Component Database
- Comprehensive component specifications (LED, servo, motors, sensors)
- Pin validation for different Arduino models
- ArduBlock category mapping for visual programming blocks

### UI Components
- **ArduinoGenerator**: Main application interface
- **ComponentConfigurator**: Component setup and pin assignment
- **DebugPanel**: Real-time validation and error reporting
- **PseudocodeOutput**: Collapsible code display with copy functionality
- **HelpModal**: Interactive documentation and examples

## Data Flow

1. **User Input**: Natural language project description
2. **Component Setup**: Visual configuration of electronic components
3. **Parsing**: Text analysis to extract actions, conditions, and parameters
4. **Validation**: Pin conflict detection and Arduino model compatibility
5. **Generation**: Structured pseudocode creation with proper nesting
6. **Output**: Formatted display with export options

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives for accessible components
- **Icons**: Lucide React for consistent iconography
- **Forms**: React Hook Form with Zod validation
- **State**: TanStack Query for server state management
- **Utilities**: Class variance authority, clsx, date-fns

### Backend Dependencies
- **Database**: Neon serverless PostgreSQL
- **ORM**: Drizzle ORM with Zod schema validation
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Replit Integration**: Cartographer plugin and runtime error overlay
- **Type Safety**: Strict TypeScript configuration
- **Code Quality**: Path mapping for clean imports

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds optimized React application to `dist/public`
2. **Backend**: esbuild bundles Node.js server to `dist/index.js`
3. **Assets**: Static files served from build output directory

### Environment Configuration
- **Development**: Hot reload with Vite middleware integration
- **Production**: Optimized builds with proper error handling
- **Database**: Environment-based connection via DATABASE_URL

### Server Setup
- Express server with Vite middleware in development
- Static file serving for production builds
- Comprehensive error handling and request logging
- CORS and security middleware configuration

The application is designed as a single-page application with a Node.js backend, suitable for deployment on platforms like Replit, Vercel, or similar hosting services that support full-stack JavaScript applications.

## Recent Changes

### Custom Component System and Export Improvements (January 2025)
- **Custom Component Dialog**: Added full-featured dialog for creating custom components with configurable pin types, block categories, and ArduBlock.ru compatibility
- **Export Format Changes**: Replaced JSON export with practical formats:
  - **TXT Export**: Complete project instructions with ArduBlock.ru step-by-step guide
  - **INO Export**: Ready-to-use Arduino IDE code with proper setup() and loop() functions
- **Port Management System**: Intelligent port conflict resolution that automatically kills existing processes on port 5000 and restarts the server
- **Enhanced Component Validation**: Updated validation system to handle custom components with proper pin type checking
- **Improved Error Handling**: Graceful shutdown handling and robust restart mechanisms

### Git Repository Preparation (January 2025)
- Added comprehensive README.md with project documentation
- Updated .gitignore file with proper exclusions for Node.js projects
- Added MIT License file
- Prepared project for Git repository upload to share and collaborate

### Project Files Ready for Git Upload
- All source code organized in proper directory structure
- Documentation includes installation, usage examples, and API reference
- Project is production-ready with proper build scripts
- start.bat file enables easy Windows deployment