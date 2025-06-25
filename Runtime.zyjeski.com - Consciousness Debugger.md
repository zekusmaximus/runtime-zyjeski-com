# Runtime.zyjeski.com - Consciousness Debugger

An interactive fiction platform where readers debug consciousness as executable code. Experience the story of Alexander Kane, a temporal physicist whose consciousness fragments after losing his son in a time experiment.

## 🧠 Concept

**Consciousness as Code**: The human mind operates like a computer operating system with processes, memory allocation, and system resources. When psychological trauma occurs, it manifests as technical problems that can be debugged and fixed:

- **Memory Leaks** = Emotional attachments consuming increasing mental resources
- **Infinite Loops** = Anxiety and obsessive thoughts trapping consciousness
- **Thread Starvation** = Neglected relationships lacking processing time  
- **CPU Spikes** = Overwhelming emotions consuming all mental capacity
- **I/O Errors** = Difficulty processing reality and sensory input

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd runtime-zyjeski

# Install dependencies
npm install

# Start the development server
npm run dev

# Or start production server
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
runtime-zyjeski/
├── package.json              # Project dependencies and scripts
├── server.js                 # Express server with Socket.io
├── public/                   # Frontend assets
│   ├── index.html            # Main application page
│   ├── css/                  # Stylesheets
│   │   ├── main.css          # Core styles and VS Code theme
│   │   ├── terminal.css      # Terminal interface styles
│   │   ├── monitor.css       # Monitoring dashboard styles
│   │   └── debug.css         # Debugger interface styles
│   ├── js/                   # JavaScript modules
│   │   ├── app.js               # Bootstraps client
│   │   ├── connection-manager.js # WebSocket wrapper
│   │   ├── state-manager.js      # Shared state store
│   │   ├── modules/monitor/      # Monitoring UI modules
│   │   ├── consciousness.js      # Consciousness manager
│   │   ├── terminal.js           # Terminal interface
│   │   └── debugger.js           # Interactive debugger
│   └── workers/              # Web Workers for background processing
├── data/                     # Character and story data
│   ├── characters/           # Character consciousness profiles
│   │   ├── schema.json       # Consciousness data schema
│   │   └── alexander-kane.json # Alexander Kane's consciousness
│   └── stories/              # Story and scenario data
│       └── fractured-time.json # "Fractured Time" story data
├── routes/                   # Express API routes
│   ├── api.js               # General API endpoints
│   └── consciousness.js     # Consciousness-specific endpoints
├── lib/                     # Backend libraries
│   ├── consciousness-engine.js   # Orchestrates instances and stories
│   ├── consciousness-instance.js # Per-character instance logic
│   ├── engine/
│   │   ├── tick-loop.js         # Global tick scheduler
│   │   ├── character-loader.js  # Character loader utilities
│   │   └── monitor-responder.js # Monitoring & broadcasting
│   ├── instance/action-router.js  # Maps debug actions
│   └── ws-bootstrap.js          # WebSocket initialization
└── docs/                    # Documentation
    ├── API.md               # API documentation
    ├── CONSCIOUSNESS-SCHEMA.md # Consciousness data format
    └── DEVELOPMENT.md       # Development guidelines
```

## 🎮 User Interface

### 1. Terminal Interface
Command-line debugging console with Unix-like commands:
- `ps` - List running mental processes
- `top` - Show resource usage and top processes  
- `kill <pid>` - Terminate a mental process
- `monitor` - Display consciousness health report
- `attach <character-id>` - Connect to character consciousness
- `debug` - Start interactive debugging session

### 2. Process Monitor  
Real-time dashboard showing:
- **Resource Meters**: Attention, emotional energy, processing capacity
- **Process Table**: Running mental processes with CPU/memory usage
- **Memory Visualization**: Emotional memory allocation map
- **Error Log**: System errors and consciousness malfunctions

### 3. Interactive Debugger
VS Code-inspired debugging interface:
- **Breakpoints**: Set intervention points in consciousness processes
- **Call Stack**: Current mental process execution stack
- **Variables**: Inspect emotional state and memory contents
- **Code Editor**: View consciousness as debuggable code

## 🧬 Character: Alexander Kane

**Background**: Temporal physicist who lost his 8-year-old son Leo in a time experiment gone wrong. His consciousness is critically fragmented with multiple system failures.

**Critical Issues**:
- `Grief_Manager.exe` - Memory leak consuming 847MB and growing
- `Search_Protocol.exe` - Infinite loop searching for Leo across timelines  
- `Temporal_Sync.dll` - Desynchronization causing reality parsing errors
- `Relationship_Handler.exe` - Thread starvation affecting family connections

**Debug Scenarios**:
1. **Memory Leak Crisis** - Fix grief processing memory consumption
2. **Infinite Search Loop** - Break the endless search for Leo
3. **Relationship Starvation** - Restore attention to family relationships
4. **Temporal Desync** - Repair reality perception systems

## 🔧 Technical Architecture

### Backend (Node.js + Express)
- **REST API**: Character data, consciousness state, process control
- **WebSocket**: Real-time consciousness updates and debugging commands
- **Consciousness Engine**: Simulates mental processes and state changes
- **Process Simulator**: Models CPU usage, memory allocation, and errors

### Frontend (Vanilla JavaScript)
- **State Management**: Centralized application state with event system
- **Socket Client**: Real-time communication with backend
- **Modular Architecture**: Separate modules for terminal, monitor, debugger
- **VS Code Theme**: Dark theme with syntax highlighting and professional UI

### Data Format
Consciousness profiles use a comprehensive JSON schema defining:
- **Processes**: Mental processes with PID, CPU usage, memory allocation
- **Memory**: Emotional attachments mapped to memory addresses  
- **Threads**: Parallel thought processes and background activities
- **System Errors**: Psychological issues as debuggable system errors
- **Resources**: Attention, emotional energy, processing capacity
- **Debug Hooks**: Player intervention points and debugging capabilities

## 🎯 Learning Objectives

### Programming Concepts
- **Process Management**: Understanding PIDs, CPU usage, memory allocation
- **Debugging Techniques**: Breakpoints, call stacks, variable inspection
- **System Resources**: Resource allocation and capacity management
- **Error Handling**: Identifying, diagnosing, and fixing system errors

### Psychological Themes  
- **Grief Processing**: Understanding how loss affects mental resources
- **Attention Management**: Balancing competing emotional and social needs
- **Trauma Response**: How psychological trauma manifests as system errors
- **Healing Process**: Debugging consciousness as metaphor for therapy

## 🛠 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser with WebSocket support

### Development Scripts
```bash
npm run dev      # Start development server with auto-reload
npm start        # Start production server
npm test         # Run test suite (when implemented)
```

### Environment Variables
```bash
PORT=3000        # Server port (default: 3000)
NODE_ENV=development  # Environment mode
```

### Adding New Characters
1. Create character JSON file in `data/characters/`
2. Follow the consciousness schema in `schema.json`
3. Define processes, memory, threads, errors, and resources
4. Add debug hooks for player intervention points
5. Update character loading in the frontend

### API Endpoints

#### Characters
- `GET /api/characters` - List available characters
- `GET /api/character/:id` - Get character consciousness state
- `POST /api/debug/:characterId` - Start debugging session
- `PUT /api/process/:pid/kill` - Terminate mental process

#### Consciousness  
- `GET /api/consciousness/:characterId/state` - Get consciousness state
- `POST /api/consciousness/:characterId/update` - Update consciousness
- `GET /api/consciousness/:characterId/processes` - Get process list
- `GET /api/consciousness/:characterId/memory` - Get memory allocation
- `GET /api/consciousness/:characterId/errors` - Get system errors

#### WebSocket Events
- `start-monitoring` - Begin real-time consciousness monitoring
- `stop-monitoring` - End monitoring session
- `debug-command` - Execute debugging command
- `player-intervention` - Apply player intervention to consciousness
- `consciousness-update` - Real-time consciousness state updates

## 🎨 Design Philosophy

### Visual Design
- **VS Code Dark Theme**: Professional development environment aesthetic
- **Monospace Typography**: Code-like appearance for consciousness data
- **Syntax Highlighting**: Color-coded consciousness processes and data
- **Terminal Interface**: Authentic command-line debugging experience

### Interaction Design  
- **Progressive Disclosure**: Start simple, reveal complexity gradually
- **Real-time Feedback**: Immediate visual response to player actions
- **Contextual Help**: Integrated guidance and command suggestions
- **Error Recovery**: Graceful handling of debugging mistakes

### Narrative Integration
- **Show, Don't Tell**: Consciousness state reveals character psychology
- **Interactive Storytelling**: Player actions affect story progression  
- **Technical Metaphors**: Programming concepts illuminate emotional themes
- **Meaningful Choices**: Debugging decisions have narrative consequences

## 🚀 Deployment

The application is designed for easy deployment to various platforms:

### Local Development
```bash
npm install && npm start
```

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure reverse proxy (nginx recommended)
3. Set up process manager (PM2 recommended)
4. Configure SSL/TLS certificates
5. Set up monitoring and logging

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📚 Educational Applications

### Computer Science Education
- **Systems Programming**: Process management, memory allocation
- **Debugging Skills**: Systematic problem identification and resolution
- **Software Architecture**: Modular design and real-time systems
- **Human-Computer Interaction**: Designing intuitive debugging interfaces

### Psychology and Mental Health
- **Trauma Understanding**: How psychological trauma affects mental processes
- **Therapeutic Metaphors**: Technology metaphors for mental health concepts
- **Emotional Regulation**: Resource management as emotional self-care
- **Mindfulness Practice**: Observing mental processes without judgment

### Interactive Storytelling
- **Procedural Narrative**: Story emerges from system interactions
- **Player Agency**: Meaningful choices with emotional consequences
- **Technical Storytelling**: Using code and data to convey emotion
- **Empathy Building**: Understanding character psychology through debugging

## 🤝 Contributing

We welcome contributions to expand the consciousness debugging platform:

### Character Development
- Create new character consciousness profiles
- Design debugging scenarios and challenges
- Write character backstories and narrative content

### Technical Features  
- Implement new debugging tools and interfaces
- Add visualization and monitoring capabilities
- Enhance real-time simulation accuracy
- Improve accessibility and mobile support

### Educational Content
- Develop curriculum and lesson plans
- Create guided tutorials and challenges
- Write documentation and learning resources
- Design assessment and evaluation tools

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the intersection of technology and human psychology
- Built with modern web technologies and real-time communication
- Designed for education, empathy, and understanding
- Created to explore consciousness through the lens of computer science

---

**Runtime.zyjeski.com** - Where consciousness meets code, and debugging becomes healing.

