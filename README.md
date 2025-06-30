# Runtime.zyjeski.com

**Interactive fiction platform where readers debug consciousness as executable code**

Experience "Fractured Time" through the lens of Alexander Kane's failing mental processes. Debug grief-induced memory leaks, resolve infinite search loops, and restore cognitive stability through hands-on consciousness debugging.

## 🧠 Core Concept

Stories become live programs with observable mental processes. Players actively diagnose and resolve character consciousness malfunctions rather than passively reading narrative. Every debugging choice drives the story toward one of three possible endings:

- **Complete Debug**: Successfully heal Alexander's consciousness and restore his relationship with Emily
- **Complete Fracture**: Allow critical system failures to destroy his mental stability permanently
- **Continual Flux**: Maintain unstable equilibrium between hope and despair indefinitely

## 🎮 Ground State Experience

**The application starts completely empty** - no consciousness loaded, no processes running, no data displayed.

1.  **Character Selection**: Click Alexander Kane's profile to load his consciousness data
2.  **Debugging Interface**: Navigate between Terminal, Monitor, and Debugger to interact with his mental processes
3.  **Story Progression**: Narrative fragments unlock automatically based on debugging progress and choices
4.  **Persistent State**: All changes persist throughout the session as you progress through the storyline

**No polling. No auto-updates. Pure user-driven interaction.**

## 🖥️ Interface Overview

### Home Page
Character selection with Alexander Kane as the sole available consciousness profile. All other interfaces remain empty until character selection.

### Terminal Interface
Command-line debugging console for direct consciousness interaction:
```bash
> attach alexander-kane
[Consciousness loaded: Alexander Kane - Status: CRITICAL]

> ps
PID   COMMAND              STATUS    CPU    MEMORY
1001  grief_processing     running   89.3%  847MB
1002  memory_search        running   45.7%  234MB  
1003  reality_check        running   12.1%  89MB

> kill 1001
[WARNING: Terminating grief_processing may cause emotional instability]
> y
[Process 1001 terminated - Memory freed: 847MB]
```

### Monitor Dashboard
**Passive display only** - shows current consciousness state without automatic updates:

- **System Resources**: CPU usage, memory allocation, attention levels
- **Process Table**: Running mental processes with resource consumption
- **Memory Map**: Emotional and episodic memory allocation
- **Error Log**: System malfunctions and psychological conflicts

Updates only when user actions modify the consciousness state.

### Interactive Debugger
VS Code-inspired interface for consciousness analysis:

- **Code Editor**: View Alexander's consciousness as debuggable C++ code
- **Breakpoints**: Set intervention points in mental processes
- **Call Stack**: Current emotional process execution
- **Variables**: Inspect memory contents and emotional states

Generated dynamically from actual consciousness state - no static code.

## 📖 Narrative Integration: "Fractured Time"

### Alexander Kane: System Profile

**Status**: CRITICAL SYSTEM FAILURE

**Background**: Temporal physicist whose consciousness fragments after losing his 8-year-old son Leo in a time experiment. His mind runs in endless loops, consuming resources searching for a timeline where Leo survived.

**Active Processes**:
- `grief_processing.exe` - Memory leak consuming 847MB, growing exponentially
- `search_protocol.exe` - Infinite loop scanning timelines for Leo
- `temporal_sync.dll` - Reality processing errors causing perception instability
- `relationship_handler.exe` - Thread starvation affecting connection with wife Emily

### Story Progression Through Debugging

**Narrative fragments reveal automatically based on user debugging actions:**

- **Memory optimization** → Unlock suppressed memories of the accident
- **Process termination** → Trigger emotional breakthroughs or setbacks
- **Error resolution** → Reveal Leo's final moments and Alexander's guilt
- **Resource reallocation** → Show Emily's perspective and marriage strain

**The story unfolds through technical discovery** - each debugging choice reveals character psychology and drives toward one of three possible endings.

## 🛠️ Technical Architecture

### Stack
- **Node.js/Express** - Consciousness simulation engine
- **Socket.io** - User action communication (no polling)
- **Vanilla JavaScript** - Client-side state management
- **JSON data** - Static character consciousness profiles

### Data Flow
1.  **Ground State**: No data loaded, all interfaces empty
2.  **Character Load**: User clicks profile → Static data loads → Interfaces populate
3.  **User Actions**: Terminal commands, debugger interactions → State changes
4.  **Display Updates**: Only after user actions modify consciousness state
5.  **Story Progression**: Narrative triggers based on debugging choices

### Key Principles
- **No automatic updates** - System only changes when user acts
- **Client-side state** - All consciousness data persists in browser session
- **Event-driven narrative** - Story responds to debugging progress
- **Technical authenticity** - Real process management concepts applied to consciousness

## 📁 Project Structure

```
runtime-zyjeski/
├── package.json              # Project dependencies and scripts
├── server.js                 # Express server with Socket.io
├── public/                   # Frontend assets
│   ├── index.html            # Main application page
│   ├── css/                  # Stylesheets
│   ├── js/                   # JavaScript modules
│   │   ├── app.js               # Bootstraps client
│   │   ├── connection-manager.js # WebSocket wrapper
│   │   ├── state-manager.js      # Shared state store
│   │   └── ...
├── data/                     # Character and story data
│   ├── characters/           # Character consciousness profiles
│   └── stories/              # Story and scenario data
├── routes/                   # Express API routes
├── lib/                      # Backend libraries
└── docs/                     # Documentation
```

## 🚀 Getting Started

```bash
# Clone and install
git clone https://github.com/yourusername/runtime-zyjeski
cd runtime-zyjeski
npm install

# Start local development
npm run dev

# Open browser
open http://localhost:3000
```

**First Experience**:
1.  **Home page loads empty** - no consciousness data visible
2.  **Click Alexander Kane profile** - consciousness loads, interfaces populate
3.  **Navigate to Terminal** - run `attach alexander-kane` then `ps` to see his mental processes
4.  **Switch to Monitor** - observe system resources and error states
5.  **Try Debugger** - view his consciousness as executable code
6.  **Begin debugging** - start resolving his psychological conflicts through technical intervention

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
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run test suite
npm test
```

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

## 📚 Documentation

- `docs/CONSCIOUSNESS-SCHEMA.md` - Character consciousness data structure
- `docs/API.md` - REST endpoints and WebSocket events
- `docs/DEBUGGING.md` - Debug command reference and intervention types
- `docs/DEVELOPMENT_GUIDE.md` - In-depth guide for developers

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by the intersection of technology and human psychology
- Built with modern web technologies and real-time communication
- Designed for education, empathy, and understanding
- Created to explore consciousness through the lens of computer science
