# Consciousness Schema Documentation

This document describes the data structure used to represent character consciousness states in the Runtime.zyjeski.com platform. The schema models the mind as a computer operating system with processes, memory, resources, and debug capabilities.

**Ground State Principle**: Character consciousness data remains static until user debugging actions modify it. No automatic state changes, polling, or real-time simulation occurs without explicit user intervention.

## Overview

Each character consciousness is represented as a JSON object that serves as the **initial state template**. Once loaded by user selection, this data becomes the **working consciousness state** that persists throughout the debugging session and gets modified only by user actions.

**Consciousness-as-Code Mapping**:
- **Processes** → Mental activities and emotional states (grief processing, memory search)
- **Memory** → Emotional attachments and experiences (Leo's memories, grief storage)
- **Threads** → Parallel thought processes (background emotional processing)
- **System Errors** → Psychological issues and traumas (memory leaks, infinite loops)
- **Resources** → Mental capacity and energy (CPU attention, memory allocation)
- **Debug Hooks** → Player intervention points that trigger narrative progression

## Root Schema Structure

```javascript
{
  "id": "character-identifier",           // Used for character selection
  "name": "Character Display Name",       // Displayed in character profile
  "version": "1.0.0",                    // Character consciousness version
  "description": "Brief character background",
  "baseProcesses": [],                   // Initial mental processes (load once)
  "memoryMap": {},                       // Memory architecture (static template)
  "emotionalStates": {},                 // Emotional configuration
  "systemResources": {},                 // Resource allocation parameters
  "defaultState": {}                     // Initial consciousness state on load
}
```

### Required Fields for Ground State Architecture

- `id`: Unique character identifier for selection UI
- `name`: Display name for character card
- `version`: Semantic versioning for consciousness schema
- `description`: Brief background for character profile
- `baseProcesses`: **Initial processes** - loaded once when user selects character
- `memoryMap`: Memory architecture template
- `emotionalStates`: Emotional state configurations
- `systemResources`: Resource allocation limits
- `defaultState`: **Critical** - defines what loads when user clicks character profile

## Base Processes Array - Initial Mental State

Mental processes represent ongoing psychological activities. These are **loaded once** when the user selects a character and then **modified only by user debugging actions**.

```javascript
{
  "baseProcesses": [
    {
      "pid": 1001,                       // Unique process identifier
      "name": "grief_processing",        // Process name for debugging commands
      "command": "/usr/bin/grief_mgr",   // Executable path for terminal display
      "status": "running",               // Initial status (running/stopped/crashed)
      "priority": 10,                    // Process priority (1-20)
      "memoryUsage": 889651200,          // Initial memory usage in bytes (847MB)
      "cpuUsage": 89.3,                  // Initial CPU usage percentage
      "startTime": "2024-03-15T08:30:00Z",
      "threads": 4,                      // Number of threads
      "description": "Processes grief and loss experiences",
      
      // User Action Impact
      "debuggable": true,                // Can user set breakpoints?
      "killable": true,                  // Can user terminate process?
      "optimizable": true,               // Can user optimize memory usage?
      
      // Story Integration
      "narrativeTriggers": [             // User actions that unlock story
        {
          "action": "kill",              // Terminating this process...
          "storyFragment": "grief_termination_memory",
          "consequence": "emotional_numbness_state"
        },
        {
          "action": "memory_optimize",   // Optimizing memory usage...
          "storyFragment": "grief_processing_optimization",
          "consequence": "healthy_grief_state"
        }
      ],
      
      // Error Generation (only when user actions trigger them)
      "errors": [
        {
          "code": "MEMORY_LEAK",
          "type": "memory_leak",
          "message": "Grief processing consuming excessive memory - 847MB and growing",
          "severity": "critical",
          "triggerCondition": "memory_usage_exceeds_500MB"
        }
      ]
    }
  ]
}
```

### Process Status Values
- `running` - Process actively consuming resources
- `stopped` - Process halted by user action
- `crashed` - Process failed due to user debugging error
- `optimized` - Process improved by user intervention
- `zombified` - Process terminated but memories persist

### User Action Types
- `kill` - Terminate process (risky but immediate)
- `optimize` - Reduce resource consumption
- `debug` - Set breakpoints and step through
- `restart` - Restore crashed process
- `prioritize` - Change process priority

## Memory Map - Static Architecture Template

The memory map defines **memory regions** that get allocated when the character loads. Memory content changes only through user debugging actions.

```javascript
{
  "memoryMap": {
    "totalSize": 8192,                   // Total available memory (MB)
    "pageSize": 4096,                    // Memory page size (bytes)
    "regions": [
      {
        "address": "0x1000000000000000", // Memory address (64-bit hex)
        "size": 2048,                    // Region size in MB
        "type": "episodic",              // Memory type classification
        "label": "Leo's Memories",       // Human-readable description
        "protected": true,               // Cannot be deleted by user
        "fragmentable": true,            // Can be fragmented by trauma
        "volatility": 0.1,               // How often content changes (0-1)
        "corruptionRisk": 0.3,           // Risk of corruption (0-1)
        
        // Initial Content (loaded with character)
        "initialContent": [
          {
            "fragment": "leo_last_day",
            "size": 512,
            "description": "Final day with Leo before experiment"
          }
        ],
        
        // User Action Effects
        "debugActions": [
          {
            "action": "access_protected_memory",
            "requirement": "grief_processing_optimized",
            "storyTrigger": "suppressed_memory_unlock"
          }
        ]
      }
    ]
  }
}
```

### Memory Types and User Interaction
- `episodic` - Personal experiences (can trigger flashbacks when accessed)
- `semantic` - Factual knowledge (stable, rarely changes)
- `procedural` - Skills and learned behaviors (optimizable)
- `working` - Temporary processing space (user can clear/allocate)
- `emotional` - Emotional associations (affected by process optimization)
- `sensory` - Sensory experiences (can be corrupted or enhanced)
- `executive` - Control and decision-making (user can debug decision loops)

## Emotional States - Configuration Not Active State

Emotional states define **how emotions affect system performance** when triggered by user actions, not as continuously running simulations.

```javascript
{
  "emotionalStates": {
    "grief": {
      "baseIntensity": 0.8,             // Initial intensity when triggered
      "affectedProcesses": [            // Which processes this emotion impacts
        "grief_processing",
        "memory_search", 
        "relationship_handler"
      ],
      "memoryRegions": [                // Associated memory regions
        "0x1000000000000000",
        "0x2000000000000000"
      ],
      "systemImpact": {                 // Performance modifiers when active
        "cpuModifier": 1.5,             // CPU usage multiplier
        "memoryModifier": 1.3,          // Memory usage multiplier  
        "stabilityModifier": 0.7        // System stability impact
      },
      
      // User Action Triggers
      "userTriggers": [
        {
          "action": "access_leo_memories",
          "intensityChange": 0.3,
          "storyConsequence": "grief_spiral_sequence"
        },
        {
          "action": "optimize_grief_processing", 
          "intensityChange": -0.4,
          "storyConsequence": "healing_breakthrough"
        }
      ]
    }
  }
}
```

## Default State - Initial Load Configuration

**Critical for Ground State**: The `defaultState` defines exactly what gets loaded when the user clicks a character profile. Nothing loads before this user action.

```javascript
{
  "defaultState": {
    "emotionalState": "grief",          // Primary active emotion
    "activeProcesses": [               // Initially running processes
      "grief_processing",
      "memory_search", 
      "reality_check"
    ],
    "systemStatus": "critical",        // Overall system health
    "memoryFragments": [               // Pre-loaded memory content
      {
        "address": "0x1000000000000000",
        "content": "Leo's last day - temporal experiment preparation",
        "accessCount": 15847
      }
    ],
    "initialErrors": [                 // System errors present at load
      {
        "type": "MEMORY_LEAK_DETECTED",
        "process": "grief_processing",
        "severity": "critical",
        "message": "Grief processing consuming 847MB and growing"
      }
    ],
    "resourceUsage": {                 // Initial resource allocation
      "cpu": 89.7,
      "memory": 67.8,
      "attention": 23.4,
      "emotional_energy": 15.7
    }
  }
}
```

## User-Driven State Changes

The consciousness schema supports **state modifications only through user actions**:

### Debug Command Effects
```javascript
// Terminal: `kill 1001` (grief_processing)
{
  "stateChange": {
    "processes": "remove_pid_1001",
    "memory": "free_847MB",
    "errors": "add_emotional_numbness_warning",
    "narrative": "trigger_grief_termination_sequence"
  }
}
```

### Memory Optimization Results
```javascript
// Debugger: Optimize grief_processing memory usage
{
  "stateChange": {
    "processes": "reduce_grief_processing_memory_to_200MB", 
    "emotional_states": "reduce_grief_intensity_to_0.4",
    "memory": "defragment_leo_memories",
    "narrative": "unlock_healthy_processing_path"
  }
}
```

### Narrative Integration Points

User debugging actions trigger **specific story progression**:

```javascript
{
  "narrativeHooks": {
    "grief_processing_killed": "memory_suppression_storyline",
    "memory_leak_fixed": "emotional_breakthrough_sequence", 
    "temporal_sync_debugged": "reality_acceptance_path",
    "relationship_handler_optimized": "emily_reconnection_arc"
  }
}
```

## Implementation Notes for Ground State Architecture

### No Automatic Simulation
- **Processes don't automatically consume resources** - only change when user acts
- **Memory doesn't fragment over time** - only when user debugging causes it
- **Errors don't occur randomly** - only as consequences of user choices
- **Emotional states don't fluctuate** - only triggered by user actions

### Client-Side State Persistence  
- Character consciousness loads once on user selection
- All state changes persist in browser session until refresh/reload
- No server-side state tracking - each browser session is independent
- Story progress tracks through local state modifications

### Debug Command Integration
- `ps` command reads current process state (modified by user actions)
- `kill` command removes processes and triggers narrative consequences
- `monitor` command shows current resource usage (affected by optimizations)
- `mem` command displays memory regions and user-accessible content

### Story Progression Triggers
- Each user debugging action has **potential narrative consequences**
- Story fragments unlock based on **cumulative debugging choices**
- Three ending paths determined by **pattern of user interventions**:
  - **Complete Debug**: Systematic optimization of all processes
  - **Complete Fracture**: Destructive debugging causing system collapse  
  - **Continual Flux**: Mixed approach maintaining unstable equilibrium

The consciousness schema serves as both the **technical foundation** for debugging gameplay and the **narrative framework** for story progression through "Fractured Time."