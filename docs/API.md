# API Documentation

This document describes the REST API and WebSocket interface for the Runtime.zyjeski.com consciousness debugging platform.

**Ground State Architecture**: All endpoints serve static character data or respond to explicit user actions. No continuous polling, real-time simulation, or automatic state updates occur without user intervention.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, no authentication is required. Each browser session maintains independent character consciousness state.

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

### Character Selection (Ground State)

#### List Available Character Profiles
```http
GET /api/characters
```

Returns character selection data for the home page. **Used only for initial character selection UI.**

**Response:**
```javascript
[
  {
    "id": "alexander-kane",
    "name": "Alexander Kane",
    "status": "critical",
    "description": "Temporal physicist experiencing severe consciousness fragmentation...",
    "profileImage": "/images/alexander-kane-profile.jpg",
    "difficulty": "advanced",
    "storyContext": "Fractured Time"
  }
]
```

#### Load Character Consciousness Profile
```http
GET /api/character/:id
```

**Triggered only when user clicks character profile.** Returns complete static consciousness template that becomes the working state for the debugging session.

**Parameters:**
- `id` (string): Character identifier (e.g., "alexander-kane")

**Response:**
```javascript
{
  "id": "alexander-kane",
  "name": "Alexander Kane",
  "version": "1.0.0",
  "description": "Temporal physicist experiencing severe consciousness fragmentation...",
  
  // Initial consciousness state (becomes working state)
  "defaultState": {
    "emotionalState": "grief",
    "activeProcesses": [
      "grief_processing",
      "memory_search", 
      "reality_check"
    ],
    "systemStatus": "critical",
    "resourceUsage": {
      "cpu": 89.7,
      "memory": 67.8,
      "attention": 23.4,
      "emotional_energy": 15.7
    },
    "initialErrors": [
      {
        "type": "MEMORY_LEAK_DETECTED",
        "process": "grief_processing",
        "severity": "critical",
        "message": "Grief processing consuming 847MB and growing"
      }
    ]
  },
  
  // Static templates for consciousness architecture
  "baseProcesses": [...],     // Process definitions
  "memoryMap": {...},         // Memory architecture
  "emotionalStates": {...},   // Emotional configurations
  "systemResources": {...},   // Resource limits
  
  "metadata": {
    "storyContext": "Fractured Time",
    "debugDifficulty": "advanced",
    "created": "2024-03-15T14:30:00Z"
  }
}
```

### User Action Endpoints

#### Start Debugging Session
```http
POST /api/debug/:characterId
```

**User action only:** Called when user runs `attach` command in terminal or navigates to debugging interface.

**Parameters:**
- `characterId` (string): Character identifier

**Response:**
```javascript
{
  "sessionId": "debug_alexander-kane_1719140733000",
  "characterId": "alexander-kane",
  "status": "session_started",
  "timestamp": "2024-06-21T12:45:33Z",
  "message": "Debugging session initialized - consciousness loaded"
}
```

#### Execute Debug Command
```http
POST /api/debug/:characterId/command
```

**User action only:** Triggered by terminal commands (`ps`, `kill`, `monitor`, etc.)

**Request Body:**
```javascript
{
  "command": "ps",           // Command name
  "args": {},               // Command arguments (optional)
  "sessionId": "debug_alexander-kane_1719140733000"
}
```

**Response:**
```javascript
{
  "command": "ps",
  "result": {
    "processes": [
      {
        "pid": 1001,
        "name": "grief_processing",
        "status": "running",
        "cpu_usage": 89.3,
        "memory_mb": 847,
        "start_time": "2024-03-15T14:30:00Z"
      }
    ]
  },
  "stateChanges": null,      // Only present if command modified consciousness
  "narrativeTrigger": null,  // Only present if action triggered story progression
  "timestamp": "2024-06-21T12:45:33Z"
}
```

#### Apply Player Intervention
```http
POST /api/intervention/:characterId
```

**User action only:** Debugger interface optimizations, process modifications, memory management.

**Request Body:**
```javascript
{
  "type": "memory_optimization",
  "target": "grief_processing",
  "parameters": {
    "memory_limit": 500,
    "processing_efficiency": 0.8
  },
  "sessionId": "debug_alexander-kane_1719140733000"
}
```

**Response:**
```javascript
{
  "intervention": {
    "type": "memory_optimization",
    "target": "grief_processing",
    "result": "success"
  },
  "stateChanges": {
    "processes": "grief_processing_memory_reduced_to_200MB",
    "resources": "freed_647MB_memory",
    "emotional_states": "grief_intensity_reduced_to_0.4"
  },
  "narrativeTrigger": {
    "fragmentId": "healthy_grief_processing_breakthrough",
    "consequence": "emily_reconnection_opportunity"
  },
  "timestamp": "2024-06-21T12:45:33Z"
}
```

### Current State Queries

#### Get Current Consciousness State
```http
GET /api/consciousness/:characterId/state
```

**Returns current working consciousness state** (modified by user actions during session). Not real-time - shows state as of last user action.

**Response:**
```javascript
{
  "characterId": "alexander-kane",
  "sessionId": "debug_alexander-kane_1719140733000",
  "lastModified": "2024-06-21T12:45:33Z",
  "consciousness": {
    "processes": [...],      // Current process list (may be modified by user)
    "memory": {...},         // Current memory state
    "resources": {...},      // Current resource usage
    "system_errors": [...],  // Current error list
    "emotional_state": "grief"
  },
  "storyProgress": {
    "milestones": ["grief_processing_optimized"],
    "endingPath": null,
    "availableActions": ["optimize_memory_search", "debug_temporal_sync"]
  }
}
```

## WebSocket Events - User Action Driven Only

WebSocket connections handle user commands and state updates **triggered only by user actions**.

### Client → Server Events

#### Start Monitoring Session
```javascript
// User action: Navigate to Monitor page with character loaded
socket.emit('start-monitoring', {
  characterId: 'alexander-kane',
  sessionId: 'debug_alexander-kane_1719140733000'
});
```

Begin monitoring session. **No automatic updates** - server only sends data when user actions change consciousness state.

#### Execute Debug Command
```javascript
// User action: Terminal command entered
socket.emit('debug-command', {
  characterId: 'alexander-kane',
  command: 'ps',
  args: {},
  sessionId: 'debug_alexander-kane_1719140733000'
});
```

**Available Commands:**
- `ps` - Show current processes (reads current state)
- `kill <pid>` - Terminate process (modifies state + potential narrative trigger)
- `monitor` - Show resources and errors (reads current state)
- `optimize <process>` - Optimize process memory (modifies state)
- `mem` - Show memory allocation (reads current state)
- `restart <process>` - Restart crashed process (modifies state)

#### Apply Player Intervention
```javascript
// User action: Debugger interface interaction
socket.emit('player-intervention', {
  characterId: 'alexander-kane',
  intervention: {
    type: 'process_optimization',
    target: 'grief_processing',
    parameters: { memory_limit: 500 }
  },
  sessionId: 'debug_alexander-kane_1719140733000'
});
```

#### Manual Refresh Request
```javascript
// User action: Explicit refresh button clicked
socket.emit('refresh-monitor', {
  characterId: 'alexander-kane',
  sessionId: 'debug_alexander-kane_1719140733000'
});
```

### Server → Client Events

#### Debug Command Result
```javascript
socket.on('debug-result', (data) => {
  console.log('Command executed:', data);
});
```

**Data Structure:**
```javascript
{
  "characterId": "alexander-kane",
  "command": "ps",
  "result": {
    "processes": [...],
    "success": true
  },
  "stateChanges": null,     // Only if command modified consciousness
  "narrativeTrigger": null, // Only if action triggered story
  "timestamp": "2024-06-21T12:45:33Z"
}
```

#### Consciousness State Update
```javascript
socket.on('consciousness-update', (data) => {
  console.log('State changed by user action:', data);
});
```

**Only sent when user actions modify consciousness state.** Never sent automatically.

**Data Structure:**
```javascript
{
  "characterId": "alexander-kane",
  "state": {
    "processes": [...],      // Updated process list
    "memory": {...},         // Updated memory allocation
    "resources": {...},      // Updated resource usage
    "system_errors": [...]   // Updated error list
  },
  "trigger": "user_command", // What caused the update
  "command": "kill 1001",    // Specific user action
  "timestamp": "2024-06-21T12:45:33Z"
}
```

#### Player Intervention Applied
```javascript
socket.on('intervention-applied', (data) => {
  console.log('Intervention successful:', data);
});
```

#### Narrative Fragment Unlocked
```javascript
socket.on('narrative-unlock', (data) => {
  console.log('Story progression triggered:', data);
});
```

**Data Structure:**
```javascript
{
  "characterId": "alexander-kane",
  "trigger": "grief_processing_optimized",
  "fragment": {
    "id": "memory_breakthrough_sequence",
    "title": "Suppressed Memory: The Accident",
    "content": "As the grief processing stabilizes, a protected memory surface...",
    "type": "revelation"
  },
  "storyImpact": {
    "endingPath": null,        // Still all paths available
    "newActions": ["access_temporal_lab_memory"],
    "lockedActions": []
  }
}
```

#### Session Management
```javascript
socket.on('monitoring-started', (data) => {
  console.log('Monitoring session active:', data.characterId);
});

socket.on('monitoring-stopped', (data) => {
  console.log('Monitoring session ended:', data.characterId);
});
```

#### Error Handling
```javascript
socket.on('error', (error) => {
  console.error('API error:', error);
});
```

## Data Types

### Process Object (Current State)
```javascript
{
  "pid": 1001,
  "name": "grief_processing",
  "status": "running",          // running|stopped|crashed|optimized|zombified
  "cpu_usage": 89.3,            // Current usage (affected by user interventions)
  "memory_mb": 847,             // Current memory (can be optimized by user)
  "priority": 10,               // Can be modified by user
  "start_time": "2024-03-15T14:30:00Z",
  "last_modified": "2024-06-21T12:45:33Z",  // When user last affected this process
  "user_modifications": [       // History of user changes
    {
      "action": "memory_optimization",
      "timestamp": "2024-06-21T12:40:00Z",
      "result": "memory_reduced_from_847MB_to_200MB"
    }
  ]
}
```

### Memory Region Object
```javascript
{
  "address": "0x1000000000000000",
  "type": "episodic",
  "label": "Leo's Memories",
  "size": 2048,                 // Current size (may change with user actions)
  "protected": true,            // Cannot be deleted directly
  "fragmented": false,          // May become fragmented by user actions
  "accessCount": 15847,         // Increases when user accesses
  "lastAccessed": "2024-06-21T12:45:33Z",
  "userAccessible": false,      // Whether user can read content
  "unlockCondition": "grief_processing_stabilized"
}
```

### System Error Object
```javascript
{
  "type": "MEMORY_LEAK_DETECTED",
  "message": "Grief processing consuming excessive memory",
  "severity": "critical",       // info|warning|error|critical
  "process": "grief_processing",
  "timestamp": "2024-06-21T12:45:33Z",
  "userTriggered": false,       // Was this error caused by user action?
  "recoverySuggestions": [
    {
      "action": "optimize_process_memory",
      "description": "Reduce memory allocation for grief processing",
      "risk": "low"
    },
    {
      "action": "kill_process",
      "description": "Terminate grief processing entirely",
      "risk": "high",
      "consequence": "May cause emotional numbness"
    }
  ]
}
```

## No Polling Architecture

**Critical Design Principle**: This API supports **zero polling** and **zero automatic updates**.

### What Happens When:
- **Character loads**: Static data loaded once, becomes working state
- **User runs command**: State potentially changes, displays update
- **User navigates pages**: Current state persists, no refresh unless user requests
- **Browser idles**: Nothing happens, no background processes
- **WebSocket disconnects**: State preserved locally, reconnect resumes session

### Client-Side State Management:
- Load character consciousness once on user selection
- Modify state only through user debugging actions
- Persist state in browser session until reload
- Display always shows current state (no refresh needed unless user acts)

### Story Progression:
- Narrative fragments unlock based on cumulative user debugging choices
- Three ending paths lock/unlock based on debugging patterns
- All story progression client-side tracked through local state changes

This API serves the ground state vision of **user-driven consciousness debugging** where every change is meaningful and directly tied to player choice.