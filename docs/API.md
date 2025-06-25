# API Documentation

This document describes the REST API and WebSocket interface for the
Runtime.zyjeski.com consciousness debugging platform.
The backend uses a modular engine (`ConsciousnessEngine`) composed of
`ActionRouter`, `TickLoop`, `EmotionStateEngine` and related helpers.
See also: `docs/ARCHITECTURE_MONITORING.md` and `docs/DEBUGGING.md` for
real-time monitoring details.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required. Future versions may implement user
sessions and character ownership.

## Response Format

All API responses follow a consistent JSON format:

```javascript
{
  "success": true,
  "data": { /* response data */ },
  "error": null,
  "timestamp": "2024-06-21T12:45:33Z"
}
```

Error responses:

```javascript
{
  "success": false,
  "data": null,
  "error": "Error description",
  "timestamp": "2024-06-21T12:45:33Z"
}
```

## REST API Endpoints

### Characters

#### List All Characters
```http
GET /api/characters
```

Returns a list of all available character consciousness profiles.

**Response:**
```javascript
[
  {
    "id": "alexander-kane",
    "name": "Alexander Kane",
    "status": "critical",
    "description": "Temporal physicist experiencing severe consciousness fragmentation..."
  }
]
```

#### Get Character Details

```http
GET /api/character/:id
```

Returns complete consciousness profile for a specific character.

**Parameters:**

- `id` (string): Character identifier (e.g., "alexander-kane")

**Response:**

```javascript
{
  "id": "alexander-kane",
  "name": "Alexander Kane",
  "status": "critical",
  "description": "Temporal physicist experiencing severe consciousness fragmentation...",
  "consciousness": {
    "processes": [...],
    "memory": {...},
    "threads": [...],
    "system_errors": [...],
    "resources": {...},
    "debug_hooks": [...]
  },
  "metadata": {
    "created": "2024-03-15T14:30:00Z",
    "last_updated": "2024-06-21T12:45:33Z",
    "version": "1.0",
    "story_context": "Fractured Time",
    "debug_difficulty": "advanced"
  }
}
```

#### Start Debugging Session
```http
POST /api/debug/:characterId
```

Initializes a new debugging session for the specified character.

**Parameters:**
- `characterId` (string): Character identifier

**Response:**
```javascript
{
  "sessionId": "debug_alexander-kane_1719140733000",
  "characterId": "alexander-kane",
  "status": "debugging_started",
  "timestamp": "2024-06-21T12:45:33Z"
}
```

### Consciousness Management

#### Get Consciousness State
```http
GET /api/consciousness/:characterId/state
```

Returns current consciousness state including real-time simulation data.

**Parameters:**
- `characterId` (string): Character identifier

**Response:**
```javascript
{
  "consciousness": {
    "processes": [
      {
        "pid": 1001,
        "name": "Grief_Manager.exe",
        "status": "error",
        "cpu_usage": 89.7,
        "memory_mb": 847.2,
        "priority": -5,
        "last_activity": "2024-06-21T12:45:33Z"
      }
    ],
    "resources": {
      "attention": {
        "current": 23.4,
        "max": 100.0
      }
    }
  }
}
```

#### Update Consciousness State
```http
POST /api/consciousness/:characterId/update
```

Applies updates to consciousness state (used for player interventions).

**Parameters:**
- `characterId` (string): Character identifier

**Request Body:**
```javascript
{
  "processes": [...],  // Updated process list
  "resources": {...},  // Updated resource allocation
  "system_errors": [...] // Updated error list
}
```

#### Get Process List
```http
GET /api/consciousness/:characterId/processes
```

Returns list of currently running mental processes.

**Response:**
```javascript
[
  {
    "pid": 1001,
    "name": "Grief_Manager.exe",
    "status": "error",
    "cpu_usage": 89.7,
    "memory_mb": 847.2,
    "priority": -5,
    "start_time": "2024-03-15T14:30:00Z",
    "last_activity": "2024-06-21T12:45:33Z",
    "description": "Primary grief processing system - experiencing severe memory leak",
    "error_message": "MEMORY_LEAK: Emotional attachment to Leo consuming increasing resources"
  }
]
```

#### Get Memory Allocation
```http
GET /api/consciousness/:characterId/memory
```

Returns current memory allocation map with emotional attachments.

**Response:**
```javascript
{
  "0x7FF8A1B2C000": {
    "type": "relationship",
    "size": 2048576,
    "description": "Leo Kane - Son, age 8, lost in temporal experiment",
    "access_count": 15847,
    "last_accessed": "2024-06-21T12:45:33Z",
    "fragmented": true,
    "protected": true
  }
}
```

#### Get System Errors
```http
GET /api/consciousness/:characterId/errors
```

Returns list of current system errors and consciousness malfunctions.

**Response:**
```javascript
[
  {
    "type": "MEMORY_LEAK_DETECTED",
    "message": "Grief_Manager.exe consuming excessive memory - 847MB and growing",
    "timestamp": "2024-06-21T12:45:33Z",
    "severity": "critical",
    "related_process": 1001,
    "stack_trace": [
      "grief_manager.cpp:line 234 - emotional_attachment_loop()",
      "memory_allocator.cpp:line 89 - allocate_emotional_memory()"
    ],
    "recovery_suggestion": "Implement grief processing limits or restart Grief_Manager.exe"
  }
]
```

### Process Control

#### Terminate Process
```http
PUT /api/process/:pid/kill
```

Terminates a specific mental process.

**Parameters:**
- `pid` (integer): Process identifier

**Response:**
```javascript
{
  "pid": 1001,
  "status": "terminated",
  "timestamp": "2024-06-21T12:45:33Z"
}
```

### Monitoring

#### Get Real-time Monitoring Data
```http
GET /api/monitor/:characterId
```

Returns current monitoring snapshot for dashboard display.

**Response:**
```javascript
{
  "characterId": "alexander-kane",
  "timestamp": "2024-06-21T12:45:33Z",
  "cpu_usage": 89.7,
  "memory_usage": 847.2,
  "active_processes": 7,
  "errors": 5,
  "attention_level": 23.4,
  "emotional_energy": 15.7
}
```

## WebSocket Events

Real-time communication uses Socket.io for live consciousness updates and interactive debugging.

### Client → Server Events

#### Start Monitoring
```javascript
socket.emit('start-monitoring', {
  characterId: 'alexander-kane'
});
```

Begin real-time monitoring of character consciousness state.

#### Stop Monitoring
```javascript
socket.emit('stop-monitoring', {
  characterId: 'alexander-kane'
});
```

End monitoring session for specified character.

#### Debug Command
```javascript
socket.emit('debug-command', {
  characterId: 'alexander-kane',
  command: 'ps',
  args: {}
});
```

Execute debugging command (ps, top, kill, monitor, etc.).

**Available Commands:**
- `ps` - List running processes
- `top` - Show resource usage and top processes
- `kill` - Terminate process (requires `args.pid`)
- `monitor` - Get memory and error information
- `step_into` - Step into function call (debugger)
- `step_over` - Execute current line (debugger)
- `continue` - Resume execution (debugger)
- `break_all` - Pause all processes (debugger)

#### Player Intervention
```javascript
socket.emit('player-intervention', {
  characterId: 'alexander-kane',
  intervention: {
    type: 'process_optimization',
    target: 'Grief_Manager.exe',
    parameters: {
      memory_limit: 500
    }
  }
});
```

Apply player intervention to character consciousness.

### Server → Client Events

#### Consciousness Update
```javascript
socket.on('consciousness-update', (data) => {
  console.log('Consciousness state updated:', data);
});
```

**Data Structure:**
```javascript
{
  characterId: 'alexander-kane',
  state: {
    consciousness: {
      processes: [...],
      memory: {...},
      resources: {...},
      system_errors: [...]
    }
  },
  intervention: false, // true if caused by player intervention
  timestamp: '2024-06-21T12:45:33Z'
}
```

#### Debug Result
```javascript
socket.on('debug-result', (data) => {
  console.log('Debug command result:', data);
});
```

**Data Structure:**
```javascript
{
  characterId: 'alexander-kane',
  command: 'ps',
  result: {
    processes: [...],
    // or error: 'Error message'
  },
  timestamp: '2024-06-21T12:45:33Z'
}
```

#### Intervention Applied
```javascript
socket.on('intervention-applied', (data) => {
  console.log('Player intervention applied:', data);
});
```

#### Monitoring Started/Stopped
```javascript
socket.on('monitoring-started', (data) => {
  console.log('Monitoring started for:', data.characterId);
});

socket.on('monitoring-stopped', (data) => {
  console.log('Monitoring stopped for:', data.characterId);
});
```

#### Error Handling
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## Error Codes

| HTTP Status | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Character or resource not found |
| 500 | Internal Server Error - Server-side error |

## Rate Limiting

Currently no rate limiting is implemented. Future versions may include:
- 100 requests per minute per IP for REST API
- Connection limits for WebSocket sessions

## Data Types

### Process Object
```javascript
{
  "pid": 1001,                              // integer
  "name": "Grief_Manager.exe",              // string
  "status": "error",                        // enum: running|sleeping|stopped|zombie|error
  "cpu_usage": 89.7,                       // float (0-100)
  "memory_mb": 847.2,                      // float
  "priority": -5,                          // integer (-20 to 19)
  "start_time": "2024-03-15T14:30:00Z",   // ISO datetime
  "last_activity": "2024-06-21T12:45:33Z", // ISO datetime
  "description": "Process description",     // string
  "error_message": "Error details"         // string (optional)
}
```

### Memory Block Object
```javascript
{
  "type": "relationship",                   // enum: emotion|relationship|trauma|skill|knowledge|system
  "size": 2048576,                         // integer (bytes)
  "description": "Memory content description", // string
  "access_count": 15847,                   // integer
  "last_accessed": "2024-06-21T12:45:33Z", // ISO datetime
  "fragmented": true,                      // boolean
  "protected": true                        // boolean
}
```

### System Error Object
```javascript
{
  "type": "MEMORY_LEAK_DETECTED",          // enum
  "message": "Error description",          // string
  "timestamp": "2024-06-21T12:45:33Z",    // ISO datetime
  "severity": "critical",                  // enum: info|warning|error|critical
  "related_process": 1001,                 // integer (optional)
  "stack_trace": ["trace line 1", "..."], // array of strings (optional)
  "recovery_suggestion": "Fix suggestion" // string (optional)
}
```

### Resource Object
```javascript
{
  "current": 23.4,                        // float (0-100)
  "max": 100.0,                          // float
  "allocation": {                         // object (optional)
    "Leo_Search": 67.2,
    "Grief_Processing": 22.5
  },
  "regeneration_rate": 2.3               // float (optional)
}
```

## Example Usage

### Basic Character Loading
```javascript
// Load character list
const response = await fetch('/api/characters');
const characters = await response.json();

// Load specific character
const character = await fetch('/api/character/alexander-kane');
const alexData = await character.json();

// Start debugging session
const session = await fetch('/api/debug/alexander-kane', { method: 'POST' });
const sessionData = await session.json();
```

### Real-time Monitoring
```javascript
const socket = io();

// Start monitoring
socket.emit('start-monitoring', { characterId: 'alexander-kane' });

// Listen for updates
socket.on('consciousness-update', (data) => {
  updateDashboard(data.state);
});

// Execute debugging commands
socket.emit('debug-command', {
  characterId: 'alexander-kane',
  command: 'ps'
});

socket.on('debug-result', (data) => {
  displayProcessList(data.result.processes);
});
```

### Player Interventions
```javascript
// Apply memory optimization intervention
socket.emit('player-intervention', {
  characterId: 'alexander-kane',
  intervention: {
    type: 'memory_optimization',
    target: 'Grief_Manager.exe',
    parameters: {
      memory_limit: 500,
      processing_efficiency: 0.8
    }
  }
});

socket.on('intervention-applied', (data) => {
  console.log('Intervention successful:', data.intervention);
});
```

This API enables rich, real-time interaction with character consciousness states, supporting both REST-based data retrieval and WebSocket-based live debugging sessions.