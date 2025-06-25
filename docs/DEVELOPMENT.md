# Development Guidelines

This document provides comprehensive guidelines for developing and extending the
Runtime.zyjeski.com consciousness debugging platform.

## Project Philosophy

### Core Principles

1. **Consciousness as Computation** - Mental processes are literally observable and debuggable
2. **Authentic Technical Metaphors** - Psychological states map accurately to system concepts
3. **Player Agency** - Readers actively debug rather than passively consume
4. **Educational Value** - Teach both debugging skills and emotional intelligence
5. **Narrative Integration** - Technical debugging serves story progression

### Design Values

- **Accessibility**: Complex concepts presented intuitively
- **Authenticity**: Realistic debugging interfaces and workflows
- **Empathy**: Respectful treatment of mental health themes
- **Engagement**: Active problem-solving over passive reading
- **Learning**: Technical and emotional skill development

## Development Environment

### Prerequisites

- Node.js 18+ with npm
- Modern web browser with WebSocket support
- Git for version control
- Code editor with JavaScript support (VS Code recommended)

### Setup

```bash
# Clone repository
git clone <repository-url>
cd runtime-zyjeski-com

# Install dependencies
npm install

# Start development server (Express with nodemon)
npm run dev

# Access application
# Windows: start http://localhost:3000
# macOS: open http://localhost:3000
# Linux: xdg-open http://localhost:3000
```

### Development Scripts

```bash
npm run dev        # Development server with nodemon auto-reload (Express)
npm start          # Production server (Express)
npm test           # Run test suite (not yet implemented)
npm run lint       # Code linting (not yet configured)
```

**Note**: This is an Express.js application with Socket.io, not a Next.js or React application.

## Architecture Overview

### Backend Structure
```
server.js                        # Express server with Socket.io
├── routes/
│   ├── api.js                  # General API endpoints
│   └── consciousness.js        # Engine actions
├── lib/
│   ├── consciousness-engine.js     # Orchestrates characters
│   ├── consciousness-instance.js   # Individual instance logic
│   ├── engine/
│   │   ├── tick-loop.js           # Global tick scheduler
│   │   ├── character-loader.js    # Character loading utilities
│   │   └── monitor-responder.js   # Monitoring/broadcasting
│   ├── instance/action-router.js  # Maps debug actions
│   └── ws-bootstrap.js            # WebSocket setup
└── data/
    ├── characters/               # Character profiles (JSON)
    ├── schema/                   # JSON schemas for validation
    └── stories/                  # Story and scenario data
```

### Frontend Structure
```
public/                        # Static files served by Express
├── js/                       # Client-side JavaScript (ES6 modules)
│   ├── app.js                 # Bootstraps client
│   ├── connection-manager.js  # WebSocket connection wrapper
│   ├── state-manager.js       # Shared state store
│   ├── modules/
│   │   └── monitor/           # Modular monitoring UI
│   ├── consciousness.js       # Consciousness manager
│   ├── terminal.js            # Terminal interface
│   └── debugger.js            # Interactive debugger
├── css/                       # VS Code dark theme styling
│   ├── main.css              # Main styles
│   ├── terminal.css          # Terminal-specific styles
│   ├── monitor.css           # Monitor dashboard styles
│   └── debug.css             # Debugger interface styles
└── index.html                # Single-page application entry point
```

**Technology Stack**: 
- **Backend**: Node.js + Express.js + Socket.io
- **Frontend**: Vanilla JavaScript (ES6 modules) + CSS
- **No Framework**: This project intentionally uses vanilla JS, not React/Vue/Angular

## Code Standards

### JavaScript Style
- Use ES6+ features (async/await, arrow functions, destructuring)
- Follow camelCase naming convention
- Use meaningful variable and function names
- Prefer const over let, let over var
- Use template literals for string interpolation

```javascript
// Good
const processManager = {
  async getActiveProcesses(characterId) {
    const state = await consciousnessEngine.getState(characterId);
    return state.consciousness.processes.filter(p => p.status === 'running');
  }
};

// Avoid
var pm = {
  getActiveProcesses: function(cId) {
    return new Promise(function(resolve, reject) {
      // Promise constructor anti-pattern
    });
  }
};
```

### File Organization
- One class per file for major components
- Group related utilities in modules
- Use descriptive file names matching their primary export
- Maintain consistent directory structure

### Error Handling
- Use try/catch blocks for async operations
- Provide meaningful error messages
- Log errors with context information
- Fail gracefully with user-friendly messages

```javascript
// Good
try {
  const character = await consciousnessEngine.loadCharacter(characterId);
  return character;
} catch (error) {
  console.error(`Failed to load character ${characterId}:`, error);
  throw new Error(`Character '${characterId}' could not be loaded. Please check the character ID and try again.`);
}
```

### CSS Guidelines
- Follow VS Code dark theme color scheme
- Use CSS custom properties for theming
- Maintain responsive design principles
- Prefer flexbox/grid over absolute positioning

```css
/* Good - Use custom properties */
.terminal-output {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-mono);
}

/* Avoid - Hard-coded values */
.terminal-output {
  background-color: #252526;
  color: #d4d4d4;
  font-family: 'Fira Code', monospace;
}
```

## Component Development

### Adding New Characters

1. **Create Character JSON**
```bash
# Create new character file in the characters directory
touch data/characters/new-character.json
# or on Windows:
# type nul > data\characters\new-character.json
```

2. **Follow Schema Structure**
```javascript
{
  "id": "new-character",
  "name": "Character Name",
  "status": "stable|unstable|critical|offline",
  "description": "Character background and current state",
  "consciousness": {
    "processes": [...],
    "memory": {...},
    "threads": [...],
    "system_errors": [...],
    "resources": {...},
    "debug_hooks": [...]
  },
  "metadata": {
    "created": "2024-06-21T12:45:33Z",
    "version": "1.0",
    "story_context": "Story Name",
    "debug_difficulty": "beginner|intermediate|advanced|expert"
  }
}
```

3. **Design Mental Processes**
- Map character emotions to executable-style processes
- Assign realistic CPU usage based on emotional intensity
- Create meaningful error conditions for debugging
- Design process dependencies and interactions

4. **Create Debugging Scenarios**
- Define player intervention points
- Map technical solutions to emotional healing
- Balance difficulty with narrative significance
- Provide multiple solution paths

### Extending the Terminal Interface

Add new commands in `public/js/terminal.js`:

```javascript
// Add to commands object in Terminal constructor
this.commands = {
  // Existing commands...
  'analyze': this.analyzeCommand.bind(this),
  'optimize': this.optimizeCommand.bind(this)
};

// Implement command method
analyzeCommand(args) {
  if (!this.currentCharacter) {
    this.addOutput('No character attached', 'error');
    return;
  }
  
  // Command implementation
  const analysisData = this.performAnalysis(args);
  this.displayAnalysisResults(analysisData);
}
```

### Creating New Visualizations

1. **Monitor Panel Components**
```javascript
// In public/js/monitor.js
class CustomVisualization {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.init();
  }
  
  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.container.appendChild(this.canvas);
  }
  
  update(consciousnessData) {
    // Render visualization based on consciousness state
    this.renderVisualization(consciousnessData);
  }
}
```

2. **Debugger Interface Extensions**
```javascript
// Add new debugger panels
class BreakpointManager {
  constructor() {
    this.breakpoints = new Map();
    this.setupEventListeners();
  }
  
  addBreakpoint(location, condition) {
    const breakpoint = {
      id: this.generateId(),
      location,
      condition,
      enabled: true,
      hitCount: 0
    };
    this.breakpoints.set(breakpoint.id, breakpoint);
    this.renderBreakpointsList();
  }
}
```

## WebSocket Event Handling

### Adding New Events

1. **Server-side Handler**
```javascript
// In lib/websocket-handlers.js
socket.on('new-debug-command', async (data) => {
  try {
    const { characterId, command, parameters } = data;
    
    // Validate input
    if (!characterId || !command) {
      socket.emit('error', { message: 'Missing required parameters' });
      return;
    }
    
    // Process command
    const result = await this.processCustomCommand(characterId, command, parameters);
    
    // Send response
    socket.emit('debug-result', {
      characterId,
      command,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing custom command:', error);
    socket.emit('error', { message: 'Command processing failed' });
  }
});
```

2. **Client-side Handler**
```javascript
// In public/js/socket-client.js
socket.on('custom-event', (data) => {
  // Handle custom event
  this.handleCustomEvent(data);
  
  // Notify registered handlers
  this.notifyHandlers('custom-event', data);
});
```

## State Management

### Global State Updates
```javascript
// In public/js/state-manager.js
class StateManager {
  // Add new state properties
  constructor() {
    this.state = {
      // Existing state...
      customData: null,
      userPreferences: {}
    };
  }
  
  // Add getter/setter methods
  getCustomData() {
    return this.state.customData;
  }
  
  setCustomData(data) {
    this.updateState('customData', data);
  }
}
```

### Component State Synchronization
```javascript
// Subscribe to state changes in components
window.stateManager.subscribe('customData', (newData, oldData) => {
  this.updateComponent(newData);
});
```

## Testing Guidelines

### Unit Testing (Future Implementation)
```javascript
// Example test structure
describe('ConsciousnessEngine', () => {
  beforeEach(() => {
    this.engine = new ConsciousnessEngine();
  });
  
  test('should load character correctly', async () => {
    const character = await this.engine.loadCharacter('test-character');
    expect(character.id).toBe('test-character');
    expect(character.consciousness).toBeDefined();
  });
  
  test('should handle invalid character gracefully', async () => {
    await expect(this.engine.loadCharacter('invalid-id'))
      .rejects.toThrow('Character not found');
  });
});
```

### Manual Testing Checklist
- [ ] Character loading and switching
- [ ] Terminal command execution
- [ ] Real-time monitoring updates
- [ ] Debugger interface functionality
- [ ] WebSocket connection handling
- [ ] Error handling and recovery
- [ ] Responsive design on different screen sizes

## Performance Guidelines

### Frontend Optimization
```javascript
// Efficient DOM updates
class EfficientRenderer {
  constructor() {
    this.updateQueue = [];
    this.isUpdating = false;
  }
  
  queueUpdate(updateFunction) {
    this.updateQueue.push(updateFunction);
    if (!this.isUpdating) {
      this.processUpdates();
    }
  }
  
  processUpdates() {
    this.isUpdating = true;
    requestAnimationFrame(() => {
      this.updateQueue.forEach(update => update());
      this.updateQueue = [];
      this.isUpdating = false;
    });
  }
}
```

### Memory Management
```javascript
// Clean up event listeners and intervals
class ComponentLifecycle {
  constructor() {
    this.eventListeners = [];
    this.intervals = [];
  }
  
  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }
  
  destroy() {
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    
    // Clear intervals
    this.intervals.forEach(intervalId => {
      clearInterval(intervalId);
    });
  }
}
```

## Security Considerations

### Input Validation
```javascript
// Validate all user inputs
function validateCharacterId(id) {
  if (typeof id !== 'string') {
    throw new Error('Character ID must be a string');
  }
  
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error('Character ID contains invalid characters');
  }
  
  if (id.length > 50) {
    throw new Error('Character ID too long');
  }
  
  return id;
}
```

### WebSocket Security
```javascript
// Rate limiting and validation
class WebSocketSecurity {
  constructor() {
    this.connectionCounts = new Map();
    this.rateLimits = new Map();
  }
  
  validateConnection(socket) {
    const ip = socket.handshake.address;
    
    // Check connection limits
    const connections = this.connectionCounts.get(ip) || 0;
    if (connections > 5) {
      socket.disconnect();
      return false;
    }
    
    return true;
  }
  
  checkRateLimit(socket, event) {
    const key = `${socket.id}:${event}`;
    const now = Date.now();
    const lastRequest = this.rateLimits.get(key) || 0;
    
    if (now - lastRequest < 100) { // 100ms minimum between requests
      return false;
    }
    
    this.rateLimits.set(key, now);
    return true;
  }
}
```

## Debugging and Troubleshooting

### Common Issues

1. **WebSocket Connection Problems**
```javascript
// Debug WebSocket issues
const socket = io({
  transports: ['websocket', 'polling'],
  timeout: 5000,
  forceNew: true
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  // Implement fallback behavior
});
```

2. **State Synchronization Issues**
```javascript
// Debug state management
window.stateManager.logState(); // View current state
window.stateManager.getFullState(); // Get complete state object
```

3. **Check character JSON syntax**
```bash
# Validate JSON syntax (use actual character filename)
node -e "console.log(JSON.parse(require('fs').readFileSync('data/characters/alexander-kane.json')))"
```

### Development Tools
```javascript
// Add debug helpers
window.debug = {
  state: () => window.stateManager.getFullState(),
  socket: () => window.socketClient.getConnectionInfo(),
  processes: () => window.consciousness.getProcessList(),
  terminal: () => window.terminal.commandHistory
};
```

## Deployment

### Environment Configuration
```javascript
// Environment-specific settings
const config = {
  development: {
    port: 3000,
    logLevel: 'debug',
    enableHotReload: true
  },
  production: {
    port: process.env.PORT || 3000,
    logLevel: 'info',
    enableHotReload: false
  }
};
```

### Production Optimization
```bash
# This is an Express app, not a build-based framework
# No build step required - static files served directly

# Set environment variables
# Windows:
set NODE_ENV=production
set PORT=3000

# Unix/Linux/macOS:
export NODE_ENV=production
export PORT=3000

# Start production server
npm start
```

## Contributing Guidelines

### Pull Request Process
1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Make changes following code standards
4. Test changes thoroughly
5. Update documentation as needed
6. Submit pull request with clear description

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No console.log statements in production code
- [ ] Error handling implemented
- [ ] Performance impact considered

### Issue Reporting
When reporting bugs, include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment information
- Console error messages
- Character/scenario being debugged

## Future Development

### Planned Features
- Advanced visualization with Canvas/WebGL
- Machine learning for dynamic consciousness simulation
- Multi-character debugging scenarios
- Educational curriculum integration
- Mobile-responsive debugging interfaces

### Extension Points
- Plugin system for custom visualizations
- API for external tool integration
- Scripting interface for automated debugging
- Character consciousness editor
- Community character sharing platform

This development guide ensures consistent, maintainable code while supporting the platform's unique blend of technical debugging and emotional storytelling.