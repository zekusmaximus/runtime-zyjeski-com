# Character Consciousness Schema Requirements

This document defines the required data structure for character consciousness profiles in Runtime.zyjeski.com. All character JSON files must follow this schema to ensure compatibility with the debugging platform and story integration system.

**Ground State Principle**: Character consciousness profiles serve as **static templates** that load once when the user selects a character. The working consciousness state persists throughout the debugging session and changes only through user debugging actions.

## Schema Compliance Requirements

Each character consciousness file (e.g., `alexander-kane.json`) **must include all required top-level fields** to work properly with the backend consciousness engine and frontend debugging interfaces.

### Required Top-Level Fields

- `id` (string): Unique character identifier (kebab-case, e.g., "alexander-kane")
- `name` (string): Character display name (e.g., "Alexander Kane") 
- `version` (string): Consciousness version in semantic format (e.g., "1.0.0")
- `description` (string): Brief character background for selection UI
- `storyContext` (string): Story/narrative this character belongs to
- `baseProcesses` (array): Core mental processes that load with character
- `memoryMap` (object): Memory architecture and initial allocations
- `emotionalStates` (object): Emotional configuration and triggers
- `systemResources` (object): Mental resource limits and allocation
- `defaultState` (object): **Critical** - initial consciousness state on character load
- `narrativeHooks` (object): Story progression triggers for debugging actions

### Story Integration Fields

- `storyContext` (string): Which narrative this consciousness belongs to
  - `"Fractured Time"` - Alexander Kane's grief and temporal displacement
  - `"Quantum Entangled"` - Prequel consciousness profiles
  - `"Timeline Convergence"` - Sequel consciousness profiles
- `debugDifficulty` (string): Complexity level for debugging (`beginner|intermediate|advanced|expert`)
- `narrativeHooks` (object): Maps debugging actions to story progression triggers

## Base Schema Template

Use this template when creating new character consciousness profiles:

```json
{
  "id": "character-identifier",
  "name": "Character Display Name",
  "version": "1.0.0",
  "description": "Brief character background and current psychological state",
  "storyContext": "Story Name",
  "debugDifficulty": "intermediate",
  
  "baseProcesses": [
    {
      "pid": 1001,
      "name": "primary_mental_process",
      "command": "/usr/bin/process_name",
      "status": "running",
      "priority": 10,
      "memoryUsage": 134217728,
      "cpuUsage": 45.7,
      "startTime": "2024-03-15T08:30:00Z",
      "threads": 2,
      "description": "Primary psychological process description",
      "debuggable": true,
      "killable": true,
      "optimizable": true,
      "narrativeTriggers": [
        {
          "action": "kill",
          "storyFragment": "process_termination_consequence",
          "consequence": "psychological_state_change"
        }
      ],
      "errors": [
        {
          "code": "ERROR_TYPE",
          "type": "error_category",
          "message": "Human-readable error description",
          "severity": "critical",
          "triggerCondition": "condition_description"
        }
      ]
    }
  ],
  
  "memoryMap": {
    "totalSize": 8192,
    "pageSize": 4096,
    "regions": [
      {
        "address": "0x1000000000000000",
        "size": 2048,
        "type": "episodic",
        "label": "Core Memory Description",
        "protected": true,
        "fragmentable": true,
        "volatility": 0.1,
        "corruptionRisk": 0.3,
        "initialContent": [
          {
            "fragment": "memory_fragment_id",
            "size": 512,
            "description": "Memory content description"
          }
        ],
        "debugActions": [
          {
            "action": "access_protected_memory",
            "requirement": "prerequisite_process_state",
            "storyTrigger": "narrative_unlock_id"
          }
        ]
      }
    ]
  },
  
  "emotionalStates": {
    "primary_emotion": {
      "baseIntensity": 0.8,
      "affectedProcesses": ["process1", "process2"],
      "memoryRegions": ["0x1000000000000000"],
      "systemImpact": {
        "cpuModifier": 1.5,
        "memoryModifier": 1.3,
        "stabilityModifier": 0.7
      },
      "userTriggers": [
        {
          "action": "debugging_action_type",
          "intensityChange": 0.3,
          "storyConsequence": "narrative_branch_id"
        }
      ]
    }
  },
  
  "systemResources": {
    "cpu": {
      "cores": 4,
      "baseFrequency": 2.4,
      "turboFrequency": 3.6,
      "maxUsage": 100
    },
    "memory": {
      "total": 8192,
      "available": 6144,
      "pageSize": 4096
    },
    "threads": {
      "max": 16,
      "reserved": 2
    },
    "attention": {
      "total": 100,
      "focused": 23.4,
      "diffuse": 76.6
    },
    "emotionalEnergy": {
      "total": 100,
      "current": 15.7,
      "regenerationRate": 2.3
    }
  },
  
  "defaultState": {
    "emotionalState": "primary_emotion",
    "activeProcesses": [
      "primary_mental_process",
      "secondary_process",
      "background_process"
    ],
    "systemStatus": "critical",
    "resourceUsage": {
      "cpu": 89.7,
      "memory": 67.8,
      "attention": 23.4,
      "emotionalEnergy": 15.7
    },
    "initialErrors": [
      {
        "type": "SYSTEM_ERROR_TYPE",
        "process": "problematic_process",
        "severity": "critical",
        "message": "Error description with psychological context"
      }
    ],
    "memoryFragments": [
      {
        "address": "0x1000000000000000",
        "content": "Initial memory content preview",
        "accessCount": 15847
      }
    ]
  },
  
  "narrativeHooks": {
    "debugging_action_1": "story_fragment_trigger_1",
    "debugging_action_2": "story_fragment_trigger_2",
    "process_termination": "consequence_narrative",
    "memory_optimization": "healing_progression",
    "system_collapse": "fracture_pathway"
  },
  
  "metadata": {
    "created": "2024-03-15T14:30:00Z",
    "lastUpdated": "2024-06-25T12:45:33Z",
    "schemaVersion": "2.0.0",
    "debugDifficulty": "advanced",
    "estimatedPlaytime": "45-90 minutes",
    "endingPaths": ["complete_debug", "complete_fracture", "continual_flux"]
  }
}
```

## Story-Specific Templates

### Fractured Time Character Requirements

Characters in the "Fractured Time" story context must include:

- **Temporal processing elements**: Processes related to time perception and reality synchronization
- **Grief/loss mechanics**: Memory leaks, infinite loops, or process starvation related to loss
- **Relationship dynamics**: Processes representing connections to other characters
- **Timeline confusion**: Memory fragmentation or corruption related to temporal displacement

**Example processes for Fractured Time characters**:
- `temporal_sync.dll` - Reality timeline synchronization
- `grief_processing.exe` - Loss and mourning processing
- `memory_search.exe` - Searching for lost/changed memories
- `relationship_handler.exe` - Social connection management

### Quantum Entangled (Prequel) Character Requirements

Characters in the prequel story context should include:

- **Scientific curiosity processes**: Research, experimentation, discovery
- **Ethical decision making**: Moral reasoning and consequence evaluation
- **Collaboration dynamics**: Team interaction and communication processes
- **Ambitious goal pursuit**: Drive and determination processing

### Timeline Convergence (Sequel) Character Requirements

Characters in the sequel story context should include:

- **Reality integration processes**: Merging multiple timeline experiences
- **Advanced temporal mechanics**: Complex time manipulation and understanding
- **Resolution processing**: Bringing closure to multiple narrative threads
- **Legacy management**: Dealing with consequences of previous actions

## Character Creation Workflow

### Step 1: Story Context Planning
1. Determine which story this character belongs to
2. Define their role in the narrative (protagonist, supporting, antagonist)
3. Identify their primary psychological conflicts or growth arcs
4. Plan their relationship to other characters in the story

### Step 2: Psychological Profile Design
1. Map character emotions and mental states to technical processes
2. Identify memory types and protection levels
3. Design resource allocation reflecting character priorities
4. Create initial system errors representing psychological conflicts

### Step 3: Process Architecture Design
1. Create 3-7 base processes representing core mental activities
2. Assign realistic resource usage based on psychological intensity
3. Design process dependencies and interactions
4. Plan error conditions and failure modes

### Step 4: Memory Layout Design
1. Allocate memory regions by type (episodic, emotional, procedural, etc.)
2. Set protection levels for traumatic or critical memories
3. Plan initial memory content and access restrictions
4. Design memory unlock conditions through debugging milestones

### Step 5: Narrative Integration Planning
1. Map debugging actions to story progression triggers
2. Design three potential ending paths based on debugging choices
3. Create narrative hooks for major debugging decisions
4. Plan story fragment unlocks through technical achievements

### Step 6: Debugging Difficulty Calibration
1. Set appropriate complexity for target audience
2. Balance challenge level with narrative pacing
3. Design safety nets and recovery options
4. Test debugging progression flow

## Validation and Testing

### Schema Validation Checklist
- [ ] All required fields present and correctly typed
- [ ] Process PIDs are unique and sequential
- [ ] Memory addresses follow 64-bit hexadecimal format
- [ ] Memory regions don't overlap or exceed total size
- [ ] Resource usage values are within realistic ranges (0-100%)
- [ ] Emotional state modifiers are reasonable (0.5-2.0 range)
- [ ] Initial errors reference existing processes
- [ ] Narrative hooks reference valid story fragments

### Technical Testing Requirements
- [ ] Character loads successfully in consciousness engine
- [ ] All processes start and run without immediate crashes
- [ ] Memory allocation works within defined limits
- [ ] Error conditions trigger appropriately
- [ ] Debug commands execute properly on character processes
- [ ] State changes persist correctly throughout session

### Narrative Testing Requirements
- [ ] Story progression triggers activate correctly
- [ ] Debugging actions produce expected narrative consequences
- [ ] Three ending paths are achievable through different debugging approaches
- [ ] Memory unlocks occur at appropriate story beats
- [ ] Character voice and psychological consistency maintained

## Expansion Guidelines for Future Stories

### Adding New Story Contexts
1. Create new story-specific process types and templates
2. Design unique memory architectures reflecting new themes
3. Establish story-specific debugging command sets
4. Create narrative progression systems for new themes

### Character Archetype Templates
- **Scientist/Researcher**: Curiosity-driven processes, knowledge management, ethical reasoning
- **Artist/Creative**: Inspiration processes, emotional expression, creative flow states
- **Caregiver/Healer**: Empathy processes, emotional support systems, sacrifice management
- **Warrior/Protector**: Threat assessment, courage processing, duty vs. personal conflict
- **Explorer/Adventurer**: Risk assessment, discovery processes, freedom vs. security

### Cross-Story Character Integration
- Shared memory references for characters appearing in multiple stories
- Process evolution showing character development across narratives
- Timeline-aware consciousness states for temporal story connections
- Relationship process inheritance for recurring character interactions

## Troubleshooting Common Issues

### Backend Integration Errors
- **Schema validation failures**: Check all required fields are present and properly typed
- **Process startup errors**: Verify PIDs are unique and process definitions are complete
- **Memory allocation errors**: Ensure memory regions fit within total size and don't overlap
- **Resource calculation errors**: Check that resource usage values are within valid ranges

### Frontend Display Issues
- **Character card display problems**: Verify `name`, `description`, and `storyContext` fields
- **Process list formatting issues**: Check process objects have all required display fields
- **Monitor display errors**: Ensure `defaultState` contains properly formatted resource usage
- **Memory visualization problems**: Verify memory regions have valid addresses and descriptions

### Story Integration Problems
- **Narrative triggers not firing**: Check `narrativeHooks` reference valid story fragments
- **Debugging actions not recognized**: Verify process names match those used in debug commands
- **Ending paths not accessible**: Ensure character design supports all three ending types
- **Memory unlock conditions not met**: Check prerequisite process states are achievable

This schema serves as the foundation for creating rich, debuggable consciousness profiles that integrate seamlessly with the Runtime.zyjeski.com platform while supporting diverse narrative experiences across multiple story contexts.