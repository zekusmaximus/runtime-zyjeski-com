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
  "version": "1.0.0",
  "description": "Brief character background",
  "baseProcesses": [],      // Core consciousness processes
  "memoryMap": {},          // Memory architecture
  "emotionalStates": {},    // Emotional configuration
  "systemResources": {},    // Resource allocation
  "debugInterface": {}      // Debug configuration
}
```

### Required Fields

- `id`: Unique character identifier (kebab-case)
- `name`: Human-readable character name
- `version`: Consciousness version (semantic versioning)
- `description`: Brief character background
- `baseProcesses`: Array of core mental processes
- `memoryMap`: Memory architecture definition
- `emotionalStates`: Emotional state configurations
- `systemResources`: Resource allocation parameters

## Base Processes Array

Mental processes represent ongoing psychological activities, emotions, and mental states. Each process follows the structure:

```javascript
{
  "name": "grief_processing",                  // Process identifier
  "displayName": "Grief Processing System",    // Human-readable name
  "type": "emotional",                         // Process category
  "baseLoad": {                               // Resource requirements
    "cpu": 45,                                // CPU usage (0-100%)
    "memory": 512,                            // Memory in MB
    "threads": 2                              // Thread count
  },
  "stability": 0.6,                           // Stability factor (0-1)
  "dependencies": ["memory_search"],           // Process dependencies
  "triggers": [],                             // Conditional modifiers
  "errors": []                                // Possible error states
}
```

### Process Types
- `emotional` - Emotional processing and regulation
- `cognitive` - Reasoning and analytical thinking
- `memory` - Memory formation and retrieval
- `social` - Interpersonal relationships
- `executive` - Decision making and control
- `sensory` - Sensory input processing

### Process Naming Convention
Processes use snake_case identifiers:
- `grief_processing` - Primary grief management
- `memory_search` - Active memory searching
- `temporal_analysis` - Timeline processing
- `reality_check` - Reality verification
- `emily_connection` - Relationship with Emily
- `obsession_loop` - Obsessive thought patterns

### Stability Values
- **0.0-0.3**: Highly unstable, frequent errors
- **0.4-0.6**: Moderately unstable, occasional issues
- **0.7-0.8**: Stable with minor fluctuations
- **0.9-1.0**: Highly stable, reliable operation

### Triggers System
Triggers modify process behavior based on conditions:

```javascript
{
  "condition": {
    "type": "cpu_threshold",         // Trigger type
    "target": "memory_search",       // Target process
    "operator": ">",                 // Comparison operator
    "value": 80                      // Threshold value
  },
  "effect": {
    "action": "trigger_error",       // Action to perform
    "magnitude": 1,                  // Effect intensity
    "target": "infinite_loop"        // Error to trigger
  }
}
```

#### Trigger Types
- `memory_access` - Memory region access
- `cpu_threshold` - CPU usage levels
- `emotional_state` - Emotional intensity
- `time_based` - Time-dependent triggers
- `event` - External event triggers

#### Effect Actions
- `increase_load` - Increase resource usage
- `decrease_load` - Decrease resource usage
- `spawn_thread` - Create new thread
- `kill_thread` - Terminate thread
- `trigger_error` - Generate system error
- `allocate_memory` - Allocate memory block

### Error Specifications
Processes can generate specific types of errors:

```javascript
{
  "code": "INFINITE_LOOP",           // Error code identifier
  "type": "infinite_loop",           // Error type category
  "message": "Caught in obsessive thought pattern about Leo",
  "severity": "high",                // Error severity level
  "probability": 0.4                 // Likelihood of occurrence (0-1)
}
```

#### Error Types
- `segfault` - Invalid memory access
- `overflow` - Resource overflow
- `deadlock` - Process deadlock
- `race_condition` - Race condition
- `memory_leak` - Memory leak
- `null_reference` - Null reference
- `infinite_loop` - Infinite loop

#### Severity Levels
- `low` - Minor issues, minimal impact
- `medium` - Moderate issues, noticeable effects
- `high` - Significant problems affecting function
- `critical` - Severe problems threatening stability

## Memory Map Object

Memory represents emotional attachments, experiences, and knowledge stored in consciousness:

```javascript
{
  "totalSize": 8192,                 // Total memory in MB
  "pageSize": 4096,                  // Memory page size in bytes
  "regions": [
    {
      "address": "0x1000000000000000", // Memory start address
      "size": 2048,                    // Region size in MB
      "type": "episodic",              // Memory type
      "label": "Leo's Memories",       // Human-readable label
      "protected": true,               // Write protection
      "fragmentable": true,            // Can fragment
      "volatility": 0.1,               // Change frequency (0-1)
      "corruptionRisk": 0.3            // Risk of corruption (0-1)
    }
  ]
}
```

### Memory Types
- `episodic` - Personal experiences and events
- `semantic` - Factual knowledge and concepts
- `procedural` - Skills and learned behaviors
- `working` - Temporary processing space
- `emotional` - Emotional associations
- `sensory` - Sensory experiences and archives
- `executive` - Control and decision-making data

### Memory Address Convention
- Use realistic 64-bit hexadecimal addresses
- Protected memories (trauma, core attachments) use lower addresses
- Temporary/working memory uses higher addresses
- Related memories should have adjacent addresses

### Memory Protection Levels
- `protected: true` - Cannot be modified directly
- `fragmentable: true` - Can be split across pages
- `volatility` - How frequently content changes (0 = stable, 1 = highly volatile)
- `corruptionRisk` - Probability of data corruption (0 = safe, 1 = high risk)

## Emotional States Object

Emotional states define how emotions affect system performance:

```javascript
{
  "grief": {
    "baseIntensity": 0.8,             // Base emotional intensity (0-1)
    "processes": [                    // Affected processes
      "grief_processing",
      "memory_search",
      "obsession_loop"
    ],
    "memoryRegions": [                // Associated memory regions
      "0x1000000000000000",
      "0x2000000000000000"
    ],
    "systemImpact": {                 // Performance modifiers
      "cpuModifier": 1.5,             // CPU usage multiplier
      "memoryModifier": 1.3,          // Memory usage multiplier
      "stabilityModifier": 0.7        // Stability multiplier
    },
    "triggers": [                     // Intensity modifiers
      {
        "type": "time",
        "condition": "anniversary_date",
        "intensityModifier": 0.3
      }
    ]
  }
}
```

### Emotional Intensity Scale
- **0.0-0.2**: Minimal emotional impact
- **0.3-0.5**: Moderate emotional influence
- **0.6-0.8**: Strong emotional dominance
- **0.9-1.0**: Overwhelming emotional control

### System Impact Modifiers
- `cpuModifier` - Multiplies CPU usage (>1.0 increases usage)
- `memoryModifier` - Multiplies memory usage (>1.0 increases usage)
- `stabilityModifier` - Multiplies stability (<1.0 decreases stability)

## System Resources Object

Resources represent mental capacity and energy allocation:

```javascript
{
  "attention": {
    "max": 100,                       // Maximum attention capacity
    "reserved": 20                    // Reserved for system processes
  },
  "emotionalEnergy": {
    "max": 100,
    "reserved": 15
  },
  "processingCapacity": {
    "max": 100,
    "reserved": 25
  },
  "memory": {
    "max": 8192,                      // Maximum memory in MB
    "reserved": 1024                  // Reserved memory in MB
  },
  "threads": {
    "max": 64,                        // Maximum thread count
    "reserved": 8                     // Reserved threads
  }
}
```

### Resource Types
- `attention` - Focus and concentration capacity
- `emotionalEnergy` - Emotional processing energy
- `processingCapacity` - General cognitive processing
- `memory` - Total memory allocation
- `threads` - Available thread pool

### Resource Allocation
- `max` - Total available resource
- `reserved` - Amount reserved for critical systems
- Available for processes = `max - reserved`

## Debug Interface Object

Debug interface configuration defines available debugging capabilities:

```javascript
{
  "commands": [
    {
      "command": "ps",                // Command identifier
      "description": "List running processes",
      "category": "process",          // Command category
      "requiresAuth": false,          // Authentication requirement
      "riskLevel": "safe"             // Risk assessment
    }
  ],
  "monitors": [                       // Available monitoring types
    "cpu",
    "memory", 
    "threads",
    "errors",
    "emotional",
    "stability"
  ]
}
```

### Command Categories
- `process` - Process management commands
- `memory` - Memory inspection and management
- `diagnostic` - System diagnostics
- `intervention` - Player intervention commands
- `system` - System-level operations

### Risk Levels
- `safe` - No risk of system damage
- `caution` - Minor risk, reversible effects
- `dangerous` - Significant risk, permanent effects

## Default State Object

Initial consciousness state when character is first loaded:

```javascript
{
  "emotionalState": "grief",          // Primary emotional state
  "activeProcesses": [               // Initially running processes
    "grief_processing",
    "memory_search",
    "reality_check"
  ],
  "memoryFragments": [               // Pre-loaded memory fragments
    {
      "address": "0x1000000000000000",
      "content": "Leo's last day - temporal experiment preparation"
    }
  ]
}
```

## Implementation Notes

### Real-time Simulation
- Process CPU usage fluctuates based on emotional states and triggers
- Memory allocation changes as emotional intensity varies
- Errors occur probabilistically based on process stability
- Resource contention affects system performance

### Player Intervention Points
- Memory optimization to reduce grief processing overhead
- Process prioritization to balance competing mental activities
- Error handling to resolve psychological deadlocks
- Resource reallocation to restore system stability

### Narrative Integration
- Consciousness state reflects character psychology
- Debugging actions influence story progression
- System errors correspond to plot conflicts
- Character healing parallels system optimization

## Example: Alexander Kane

The Alexander Kane character demonstrates all schema features:
- **Grief processing** with memory leak consuming 847MB
- **Infinite search loop** for his lost son Leo
- **Temporal analysis** system causing reality desynchronization
- **Relationship handler** experiencing thread starvation with Emily
- **Memory fragmentation** affecting episodic recall
- **Resource exhaustion** due to obsessive mental processes

Players debug Alexander's consciousness by optimizing grief processing, breaking search loops, and rebalancing attention allocation between past trauma and present relationships.