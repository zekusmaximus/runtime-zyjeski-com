# Runtime.zyjeski.com - Debug Consciousness as Code

An interactive fiction platform where readers debug consciousness as executable code.
Experience the story of Alexander Kane, a temporal physicist whose consciousness
fragments after losing his son in a time experiment gone wrong.

![VS Code Dark Theme](https://img.shields.io/badge/Theme-VS%20Code%20Dark-1e1e1e?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![Socket.io](https://img.shields.io/badge/Socket.io-4.8+-010101?style=flat-square&logo=socket.io)

## 🧠 Core Concept

**Consciousness as Operating System**: The human mind operates like a computer with
processes, memory allocation, and system resources. Psychological trauma manifests
as technical problems that can be debugged and resolved:

- **Memory Leaks** → Emotional attachments consuming increasing mental resources
- **Infinite Loops** → Anxiety and obsessive thoughts trapping consciousness
- **Thread Starvation** → Neglected relationships lacking processing time
- **CPU Spikes** → Overwhelming emotions consuming all mental capacity
- **I/O Errors** → Difficulty processing reality and sensory input

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd runtime-zyjeski
npm install

# Development server with auto-reload
npm run dev

# Production server
npm start
```

Open `http://localhost:3000` to begin debugging consciousness.

## 🎮 User Experience

### 1. Terminal Interface
Unix-like debugging console with commands:
```bash
ps                  # List running mental processes
top                 # Show resource usage and top processes
kill <pid>          # Terminate a mental process
monitor             # Display consciousness health report
attach <character>  # Connect to character consciousness
debug               # Start interactive debugging session
```

### 2. Process Monitor

Real-time dashboard displaying:

- **Resource Meters**: Attention, emotional energy, processing capacity
- **Process Table**: Running mental processes with CPU/memory usage
- **Memory Visualization**: Emotional memory allocation map
- **Error Log**: System errors and consciousness malfunctions

### 3. Interactive Debugger

VS Code-inspired interface featuring:

- **Breakpoints**: Set intervention points in consciousness processes
- **Call Stack**: Current mental process execution stack
- **Variables**: Inspect emotional state and memory contents
- **Code Editor**: View consciousness as debuggable C++ code

## 📊 Character: Alexander Kane

**Background**: Temporal physicist whose consciousness critically fragments after
losing his 8-year-old son Leo in a time experiment.

**System Status**: CRITICAL

- `Grief_Manager.exe` - Memory leak consuming 847MB and growing
- `Search_Protocol.exe` - Infinite loop searching for Leo across timelines
- `Temporal_Sync.dll` - Desynchronization causing reality parsing errors
- `Relationship_Handler.exe` - Thread starvation affecting family connections

**Debug Scenarios**:

1. **Memory Leak Crisis** - Fix grief processing memory consumption
2. **Infinite Search Loop** - Break the endless search for Leo
3. **Relationship Starvation** - Restore attention to family relationships
4. **Temporal Desync** - Repair reality perception systems

## 🏗️ Architecture

### Backend (Node.js + Express + Socket.io)
```
server.js                     # Express entry point
├── routes/
│   ├── api.js               # REST endpoints
│   └── consciousness.js     # Engine-driven actions
├── lib/
│   ├── consciousness-engine.js      # Orchestrates instances and stories
│   ├── consciousness-instance.js    # Individual character instance
│   ├── engine/
│   │   ├── tick-loop.js           # Global tick scheduler
│   │   ├── character-loader.js    # Character loading utilities
│   │   └── monitor-responder.js   # Monitoring and broadcasting
│   ├── instance/
│   │   ├── action-router.js       # Maps debug actions to subsystems
│   │   ├── emotional-state.js     # EmotionStateEngine wrapper
│   │   └── memory-state.js        # Memory manager facade
│   └── ws-bootstrap.js            # WebSocket initialization and routing
└── data/
    ├── characters/                # Character profiles
    └── stories/                   # Story definitions
```

### Frontend (Vanilla JavaScript)
```
public/
├── js/
│   ├── app.js                   # Bootstraps client
│   ├── connection-manager.js    # WebSocket connection wrapper
│   ├── state-manager.js         # Shared state store
│   ├── modules/
│   │   └── monitor/             # Modular monitoring UI
│   ├── terminal.js              # Terminal interface
│   ├── debugger.js              # Interactive debugger
│   └── consciousness.js         # Consciousness manager
├── css/                         # VS Code dark theme styling
└── index.html                  # Single-page application
```

### Data Schema

Consciousness profiles use comprehensive JSON schema:

- **Processes**: Mental processes with PID, CPU usage, memory allocation
- **Memory**: Emotional attachments mapped to memory addresses
- **Threads**: Parallel thought processes and background activities
- **System Errors**: Psychological issues as debuggable system errors
- **Resources**: Attention, emotional energy, processing capacity
- **Debug Hooks**: Player intervention points and debugging capabilities

### Scenario Engine

The `ScenarioEngine` loads JSON files from `data/scenarios/` and tracks player
progress across branching debugging challenges. It listens to
`consciousness-engine` events and emits real-time updates over WebSockets.

```javascript
import { consciousnessEngine } from './lib/websocket-handlers.js';
import ScenarioEngine from './lib/scenario-engine.js';

const scenarioEngine = new ScenarioEngine();
await scenarioEngine.initialize();
scenarioEngine.attach(consciousnessEngine);
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Modern web browser with WebSocket support

### Development Workflow
```bash
npm run dev     # Start development server with auto-reload
npm start       # Start production server
```

### Adding New Characters

1. Create character JSON file in `data/characters/`
2. Follow consciousness schema in `data/characters/schema.json`
3. Define processes, memory, threads, errors, and resources
4. Add debug hooks for player intervention points

### Key APIs

#### REST Endpoints

```javascript
GET  /api/characters                    # List available characters
GET  /api/character/:id                 # Get character consciousness state
POST /api/debug/:characterId            # Start debugging session
GET  /api/consciousness/:id/state       # Get consciousness state
GET  /api/consciousness/:id/processes   # Get process list
```

#### WebSocket Events

```javascript
// Client → Server
socket.emit('start-monitoring', { characterId })
socket.emit('debug-command', { characterId, command, args })
socket.emit('player-intervention', { characterId, intervention })

// Server → Client
socket.on('consciousness-update', (data) => { /* Real-time updates */ })
socket.on('debug-result', (data) => { /* Command results */ })
```

## 🎯 Learning Objectives

### Programming Concepts

- **Process Management**: Understanding PIDs, CPU usage, memory allocation
- **Debugging Techniques**: Breakpoints, call stacks, variable inspection
- **System Resources**: Resource allocation and capacity management
- **Error Handling**: Systematic problem identification and resolution

### Psychological Themes

- **Grief Processing**: How loss affects mental resource allocation
- **Attention Management**: Balancing competing emotional and social needs
- **Trauma Response**: How psychological trauma manifests as system errors
- **Healing Process**: Debugging consciousness as metaphor for therapy

## 📚 Educational Applications

### Computer Science Education

- Systems programming and process management
- Debugging methodologies and error handling
- Real-time systems and WebSocket communication
- Human-computer interaction design

### Psychology and Mental Health

- Understanding trauma through technical metaphors
- Therapeutic approaches to emotional regulation
- Mindfulness and self-awareness practices
- Mental health destigmatization through gamification

### Interactive Storytelling

- Procedural narrative generation
- Player agency in emotional stories
- Technical storytelling techniques
- Empathy building through system understanding

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

## 🚀 Future Enhancements

### Technical Features

- Advanced visualization with Canvas/WebGL
- Machine learning for dynamic consciousness simulation
- Mobile-responsive debugging interfaces
- Collaborative debugging sessions

### Content Expansion

- Additional character consciousness profiles
- Branching narrative paths based on debugging choices
- Community-generated debugging scenarios
- Integration with mental health resources

### Educational Tools

- Curriculum guides for educators
- Assessment and progress tracking
- Certification programs for debugging mastery
- Research tools for consciousness studies

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Acknowledgments

Built with modern web technologies to explore the intersection of consciousness,
technology, and storytelling. Created to foster understanding of both technical
debugging skills and emotional intelligence through the unified metaphor of
mind-as-program.

---

**Runtime.zyjeski.com** - Where consciousness meets code, and debugging becomes healing.