# Consciousness Schema Documentation

This document describes the data structure used to represent character consciousness
states in the Runtime.zyjeski.com platform. The schema models the mind as a computer
operating system with processes, memory, resources, and debug capabilities.

## Overview

Each character consciousness is represented as a JSON object following a specific
schema that maps psychological states to computational concepts:

- **Processes** → Mental activities and emotional states
- **Memory** → Emotional attachments and experiences
- **Threads** → Parallel thought processes
- **System Errors** → Psychological issues and traumas
- **Resources** → Mental capacity and energy
- **Debug Hooks** → Player intervention points

## Root Schema Structure

```javascript
{
  "id": "character-identifier",
  "name": "Character Display Name",
  "status": "stable|unstable|critical|offline",
  "description": "Brief character and consciousness description",
  "consciousness": { /* Core consciousness object */ },
  "metadata": { /* Additional character metadata */ }
}
```

### Required Fields

- `id`: Unique character identifier (kebab-case)
- `name`: Human-readable character name
- `status`: Current operational status of consciousness
- `description`: Brief description of character and mental state
- `consciousness`: Core consciousness data structure

## Consciousness Object

The core consciousness object contains six main components:

```javascript
{
  "processes": [],      // Running mental processes
  "memory": {},         // Emotional memory allocation
  "threads": [],        // Parallel thought processes
  "system_errors": [],  // Psychological issues as system errors
  "resources": {},      // Mental resource allocation
  "debug_hooks": []     // Player intervention points
}
```

## Processes Array

Mental processes represent ongoing psychological activities, emotions, and mental states. Each process follows the structure:

```javascript
{
  "pid": 1001,                              // Unique process identifier
  "name": "Grief_Manager.exe",              // Process name (executable style)
  "status": "error",                        // Current process status
  "cpu_usage": 89.7,                       // CPU usage percentage (0-100)
  "memory_mb": 847.2,                      // Memory usage in megabytes
  "priority": -5,                          // Process priority (-20 to 19, lower = higher priority)
  "start_time": "2024-03-15T14:30:00Z",   // When process started (ISO datetime)
  "last_activity": "2024-06-21T12:45:33Z", // Last activity timestamp
  "description": "Primary grief processing system - experiencing severe memory leak",
  "error_message": "MEMORY_LEAK: Emotional attachment consuming increasing resources"
}
```

### Process Status Values
- `running` - Process operating normally
- `sleeping` - Process dormant but can resume
- `stopped` - Process halted intentionally
- `zombie` - Process terminated but not cleaned up
- `error` - Process experiencing malfunction

### Process Naming Convention
Processes use executable-style naming to reinforce the computational metaphor:
- `Grief_Manager.exe` - Grief processing system
- `Temporal_Sync.dll` - Temporal perception module
- `Search_Protocol.exe` - Active search behaviors
- `Relationship_Handler.exe` - Social connection management
- `Reality_Parser.exe` - Sensory input processing
- `Memory_Defrag.sys` - Memory optimization system

### CPU Usage Interpretation
- **0-30%**: Normal, healthy processing
- **30-60%**: Elevated but manageable
- **60-80%**: High usage, potential issues
- **80-100%**: Critical usage, system instability

## Memory Object

Memory represents emotional attachments, experiences, and knowledge stored in consciousness. Uses hexadecimal memory addresses as keys:

```javascript
{
  "0x7FF8A1B2C000": {
    "type": "relationship",                   // Memory content type
    "size": 2048576,                         // Memory block size in bytes
    "description": "Leo Kane - Son, age 8, lost in temporal experiment",
    "access_count": 15847,                   // How often accessed
    "last_accessed": "2024-06-21T12:45:33Z", // Last access timestamp
    "fragmented": true,                      // Whether memory is fragmented
    "protected": true                        // Whether memory is protected from modification
  }
}
```

### Memory Types
- `emotion` - Emotional states and feelings
- `relationship` - Connections with other people
- `trauma` - Traumatic experiences and memories
- `skill` - Learned abilities and knowledge
- `knowledge` - Factual information and understanding
- `system` - Core system functions and processes

### Memory Address Convention
- Use realistic hexadecimal memory addresses (e.g., `0x7FF8A1B2C000`)
- Group related memories in adjacent address ranges
- Protected memories (traumas, core attachments) use lower addresses
- Temporary/working memory uses higher addresses

### Memory Size Guidelines
- Small emotions: 1KB - 1MB
- Significant relationships: 1MB - 10MB  
- Core attachments: 10MB - 100MB
- Major traumas: 100MB - 1GB
- Knowledge/skills: Variable based on complexity

## Threads Array

Threads represent parallel thought processes and background mental activities:

```javascript
{
  "tid": 2001,                             // Thread identifier
  "name": "Continuous_Leo_Search",         // Descriptive thread name
  "status": "running",                     // Thread status
  "priority": 1,                          // Thread priority (1-10)
  "cpu_time": 847.3,                      // Total CPU time used
  "wait_reason": "Insufficient emotional energy allocation", // Why waiting/blocked
  "related_process": 1003                  // Associated process PID
}
```

### Thread Status Values
- `running` - Thread actively executing
- `waiting` - Thread waiting for resources
- `blocked` - Thread blocked by external condition
- `terminated` - Thread has ended

### Thread Naming Convention
Threads use descriptive names that explain the parallel mental activity:
- `Continuous_Leo_Search` - Ongoing search for lost son
- `Guilt_Processing` - Background guilt management
- `Emily_Relationship_Monitor` - Relationship maintenance
- `Timeline_Analysis` - Temporal perception processing
- `Memory_Reconstruction` - Memory defragmentation

## System Errors Array

System errors represent psychological issues as debuggable technical problems:

```javascript
{
  "type": "MEMORY_LEAK_DETECTED",          // Error type identifier
  "message": "Grief_Manager.exe consuming excessive memory - 847MB and growing",
  "timestamp": "2024-06-21T12:45:33Z",    // When error occurred
  "severity": "critical",                  // Error severity level
  "related_process": 1001,                 // Associated process PID
  "stack_trace": [                         // Technical stack trace
    "grief_manager.cpp:line 234 - emotional_attachment_loop()",
    "memory_allocator.cpp:line 89 - allocate_emotional_memory()",
    "consciousness_core.cpp:line 456 - process_grief_event()"
  ],
  "recovery_suggestion": "Implement grief processing limits or restart Grief_Manager.exe"
}
```

### Error Types
- `MEMORY_LEAK_DETECTED` - Increasing memory consumption
- `INFINITE_LOOP_WARNING` - Repetitive thought patterns
- `THREAD_STARVATION` - Neglected mental processes
- `IO_PROCESSING_ERROR` - Reality perception issues
- `STACK_OVERFLOW` - Overwhelming emotional states
- `SEGMENTATION_FAULT` - Accessing protected memories
- `DEADLOCK_DETECTED` - Conflicting mental processes
- `RESOURCE_EXHAUSTION` - Depleted mental capacity

### Severity Levels
- `info` - Minor issues, informational only
- `warning` - Potential problems requiring attention
- `error` - Significant problems affecting function
- `critical` - Severe problems threatening stability

## Resources Object

Resources represent mental capacity and energy allocation:

```javascript
{
  "attention": {
    "current": 23.4,                       // Current attention level (0-100)
    "max": 100.0,                         // Maximum attention capacity
    "allocation": {                        // How attention is distributed
      "Leo_Search": 67.2,
      "Grief_Processing": 22.5,
      "Reality_Parsing": 8.1,