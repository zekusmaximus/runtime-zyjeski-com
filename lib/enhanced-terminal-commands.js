// Enhanced Terminal Commands for Narrative Integration
// lib/enhanced-terminal-commands.js

export default class EnhancedTerminalCommands {
  constructor(consciousnessEngine, narrativeIntegration) {
    this.consciousnessEngine = consciousnessEngine;
    this.narrativeIntegration = narrativeIntegration;
    this.commands = new Map();
    
    this.setupNarrativeCommands();
  }

  /**
   * Setup narrative-specific terminal commands
   */
  setupNarrativeCommands() {
    // Memory exploration commands
    this.commands.set('memories', {
      description: 'Access and explore character memory fragments',
      category: 'narrative',
      usage: 'memories [list|read <address>|search <term>|analyze]',
      riskLevel: 'safe',
      handler: this.handleMemoryCommand.bind(this)
    });

    // Timeline analysis commands
    this.commands.set('timeline', {
      description: 'Analyze temporal convergence points and alternate realities',
      category: 'narrative',
      usage: 'timeline [status|analyze|convergence|probability <timeline_id>]',
      riskLevel: 'caution',
      handler: this.handleTimelineCommand.bind(this)
    });

    // Relationship debugging commands
    this.commands.set('relationship', {
      description: 'Debug relationship processes and emotional connections',
      category: 'narrative',
      usage: 'relationship [status|emily|repair|analyze]',
      riskLevel: 'safe',
      handler: this.handleRelationshipCommand.bind(this)
    });

    // Story progression commands
    this.commands.set('story', {
      description: 'View story progression and narrative state',
      category: 'narrative',
      usage: 'story [progress|chapter|choices|paths]',
      riskLevel: 'safe',
      handler: this.handleStoryCommand.bind(this)
    });

    // Emotional state analysis
    this.commands.set('emotional', {
      description: 'Analyze emotional state and grief progression',
      category: 'diagnostic',
      usage: 'emotional [state|grief|anger|denial|acceptance|therapy]',
      riskLevel: 'caution',
      handler: this.handleEmotionalCommand.bind(this)
    });

    // Nexus exploration (dangerous)
    this.commands.set('nexus', {
      description: 'Access temporal nexus points (WARNING: High risk)',
      category: 'intervention',
      usage: 'nexus [scan|approach|interact] (DANGEROUS)',
      riskLevel: 'dangerous',
      requiresAuth: true,
      handler: this.handleNexusCommand.bind(this)
    });

    // Leo search protocols
    this.commands.set('search', {
      description: 'Control search protocols for missing person',
      category: 'process',
      usage: 'search [status|halt|resume|optimize|parameters]',
      riskLevel: 'caution',
      handler: this.handleSearchCommand.bind(this)
    });

    // Grief processing controls
    this.commands.set('grief', {
      description: 'Debug grief processing systems',
      category: 'intervention',
      usage: 'grief [analyze|defrag|process|release|stages]',
      riskLevel: 'caution',
      handler: this.handleGriefCommand.bind(this)
    });
  }

  /**
   * Handle memory exploration commands
   */
  async handleMemoryCommand(characterId, args) {
    const instance = this.consciousnessEngine.instances.get(characterId);
    if (!instance) return { error: 'Character not loaded' };

    const subcommand = args[0] || 'list';
    const progress = this.narrativeIntegration.getStoryProgress(characterId);

    switch (subcommand) {
      case 'list':
        return this.listAvailableMemories(characterId, progress);
        
      case 'read':
        if (!args[1]) return { error: 'Memory address required' };
        return await this.readMemoryFragment(characterId, args[1], progress);
        
      case 'search':
        if (!args[1]) return { error: 'Search term required' };
        return this.searchMemories(characterId, args[1], progress);
        
      case 'analyze':
        return this.analyzeMemoryState(characterId, progress);
        
      default:
        return { error: `Unknown memory subcommand: ${subcommand}` };
    }
  }

  /**
   * List available memory fragments based on story progress
   */
  listAvailableMemories(characterId, progress) {
    const baseMemories = [
      {
        address: '0x1000000000000000',
        description: 'Leo\'s last day - temporal experiment preparation',
        accessible: true,
        emotional_weight: 0.9
      },
      {
        address: '0x1000000000000100',
        description: 'Market scene - feeding ducks with Leo',
        accessible: progress.storyProgression > 0.2,
        emotional_weight: 0.7
      },
      {
        address: '0x1000000000000200',
        description: 'Emily\'s concerns about the experiment',
        accessible: progress.storyProgression > 0.3,
        emotional_weight: 0.6
      },
      {
        address: '0x1000000000000300',
        description: 'The moment of the accident',
        accessible: progress.storyProgression > 0.5,
        emotional_weight: 1.0
      },
      {
        address: '0x1000000000000400',
        description: 'First fight with Emily after the loss',
        accessible: progress.storyProgression > 0.4,
        emotional_weight: 0.8
      },
      {
        address: '0x1000000000000500',
        description: 'Leo\'s favorite bedtime story',
        accessible: progress.debuggingSuccesses > 3,
        emotional_weight: 0.5
      }
    ];

    return {
      success: true,
      memories: baseMemories,
      accessible_count: baseMemories.filter(m => m.accessible).length,
      total_count: baseMemories.length,
      progress_locked: baseMemories.filter(m => !m.accessible).length
    };
  }

  /**
   * Read specific memory fragment with narrative triggers
   */
  async readMemoryFragment(characterId, address, progress) {
    const memoryContent = {
      '0x1000000000000000': {
        title: 'Last Day - Experiment Preparation',
        content: `[MEMORY FRAGMENT - HIGH EMOTIONAL LOAD]

"Dad, what happens if we turn it up to eleven?"

Leo's eyes sparkled with the same curiosity that made him ask a thousand questions a day. The temporal field generator hummed quietly in the background, its quantum processors cycling through probability matrices.

"Well, theoretically, we'd create a stronger convergence field," I explained, adjusting the calibration settings. "But the safety protocols—"

"But what if we COULD turn it up to eleven?" he insisted, that gap-toothed grin that could melt my heart.

Emily called from the kitchen: "Alex, dinner's ready! And Leo, wash your hands!"

"Coming, Mom!" he called back, then whispered to me: "Tomorrow, can we try the rainbow machine again?"

I ruffled his hair. "Tomorrow, buddy. Tomorrow."

[MEMORY CORRUPTION DETECTED - TEMPORAL INTERFERENCE]
[GUILT_SPIKE.EXE - Memory load increasing]
[Search_Protocol.exe - Scanning for alternative outcomes]`,
        triggers_narrative: 'memory_discovery_one'
      },
      
      '0x1000000000000100': {
        title: 'Market Scene - Final Normal Moment',
        content: `[MEMORY FRAGMENT - PROTECTED CORE MEMORY]

The ducks were unusually friendly that day. Leo giggled as they competed for the bread crumbs, his small hand warm in mine.

"Look, Dad! That one's doing a little dance!"

The morning sun caught the water just right, creating tiny rainbows in the spray. Everything was perfect. Everything was normal.

"Can we come back tomorrow?" he asked.

"Of course, buddy. We can come back every day if you want."

He looked up at me with those serious brown eyes. "Promise?"

"I promise."

[ERROR: Promise_Handler.exe has stopped responding]
[WARNING: Guilt_Manager.exe consuming excessive memory]
[NOTE: This was 3 hours and 17 minutes before the incident]`,
        triggers_narrative: 'core_memory_accessed',
        unlocks_process: 'Promise_Guilt.exe'
      },

      '0x1000000000000300': {
        title: 'The Moment - System Critical Failure',
        content: `[CRITICAL MEMORY FRAGMENT - TRAUMA CORE]
[WARNING: Accessing this memory may cause system instability]

The calibration was perfect. Every parameter checked and double-checked.
Leo was supposed to be in school.
Emily was supposed to be at work.
The lab was supposed to be empty.

But he'd forgotten his backpack.
But she'd come back to get it.
But he wanted to see the "rainbow machine" one more time.

"Dad, what's that light—"

[MEMORY FRAGMENTATION CRITICAL]
[Temporal_Sync.dll - FATAL ERROR]
[Reality_Check.exe - Multiple consistency failures]
[Search_Protocol.exe - ACTIVATING INFINITE LOOP]

The world fractures.
Everything fractures.
Time fractures.

And in the silence that follows...
Nothing.

[SYSTEM EMERGENCY SHUTDOWN INITIATED]`,
        triggers_narrative: 'trauma_core_accessed',
        system_effect: 'critical_instability'
      }
    };

    const memory = memoryContent[address];
    if (!memory) {
      return { error: 'Memory address not found or corrupted' };
    }

    // Check if memory is accessible based on progress
    const memories = this.listAvailableMemories(characterId, progress);
    const memoryInfo = memories.memories.find(m => m.address === address);
    
    if (!memoryInfo?.accessible) {
      return { 
        error: 'Memory access denied - insufficient story progression',
        required_progress: 'Continue debugging to unlock this memory'
      };
    }

    // Trigger narrative event if specified
    if (memory.triggers_narrative) {
      await this.narrativeIntegration.triggerNarrative(
        characterId,
        memory.triggers_narrative,
        {
          type: 'memory_injection',
          content: memory,
          duration: 12000
        }
      );
    }

    // Apply system effects if specified
    if (memory.system_effect) {
      await this.applyMemorySystemEffect(characterId, memory.system_effect);
    }

    return {
      success: true,
      memory: memory,
      emotional_impact: memoryInfo.emotional_weight,
      system_impact: memory.system_effect || 'none'
    };
  }

  /**
   * Handle timeline analysis commands
   */
  async handleTimelineCommand(characterId, args) {
    const subcommand = args[0] || 'status';
    const progress = this.narrativeIntegration.getStoryProgress(characterId);

    switch (subcommand) {
      case 'status':
        return this.getTimelineStatus(characterId, progress);
        
      case 'analyze':
        return await this.analyzeTimelineConvergence(characterId, progress);
        
      case 'convergence':
        return this.scanConvergencePoints(characterId, progress);
        
      case 'probability':
        if (!args[1]) return { error: 'Timeline ID required' };
        return this.calculateTimelineProbability(characterId, args[1], progress);
        
      default:
        return { error: `Unknown timeline subcommand: ${subcommand}` };
    }
  }

  /**
   * Get timeline status and convergence information
   */
  getTimelineStatus(characterId, progress) {
    const baseTimelines = [
      {
        id: 'alpha',
        description: 'Original timeline - Leo disappears in experiment',
        probability: 1.0,
        status: 'current',
        emotional_weight: 1.0
      },
      {
        id: 'beta',
        description: 'Timeline where experiment was delayed',
        probability: 0.73,
        status: 'accessible',
        emotional_weight: 0.2
      },
      {
        id: 'gamma',
        description: 'Timeline where Leo stayed home sick',
        probability: 0.45,
        status: progress.storyProgression > 0.3 ? 'detectable' : 'hidden',
        emotional_weight: 0.1
      },
      {
        id: 'delta',
        description: 'Timeline where Emily stopped the experiment',
        probability: 0.89,
        status: progress.storyProgression > 0.5 ? 'accessible' : 'hidden',
        emotional_weight: 0.7
      },
      {
        id: 'omega',
        description: 'Timeline convergence nexus point',
        probability: 0.02,
        status: progress.storyProgression > 0.8 ? 'critical' : 'unknown',
        emotional_weight: 0.95
      }
    ];

    return {
      success: true,
      current_timeline: 'alpha',
      detected_timelines: baseTimelines.filter(t => t.status !== 'hidden'),
      convergence_strength: progress.storyProgression,
      nexus_accessibility: progress.storyProgression > 0.8,
      warning: progress.storyProgression > 0.8 ? 'NEXUS POINT APPROACHING - CRITICAL DECISION REQUIRED' : null
    };
  }

  /**
   * Handle relationship debugging commands
   */
  async handleRelationshipCommand(characterId, args) {
    const subcommand = args[0] || 'status';
    const instance = this.consciousnessEngine.instances.get(characterId);
    
    switch (subcommand) {
      case 'status':
        return this.getRelationshipStatus(characterId);
        
      case 'emily':
        return await this.analyzeEmilyConnection(characterId);
        
      case 'repair':
        return await this.attemptRelationshipRepair(characterId);
        
      case 'analyze':
        return this.analyzeAllRelationships(characterId);
        
      default:
        return { error: `Unknown relationship subcommand: ${subcommand}` };
    }
  }

  /**
   * Get relationship status and thread allocation
   */
  getRelationshipStatus(characterId) {
    const instance = this.consciousnessEngine.instances.get(characterId);
    if (!instance) return { error: 'Character not loaded' };

    const relationshipProcess = instance.processManager.processes.values()
      .find(p => p.name.includes('Relationship_Handler'));

    const emilyThreads = relationshipProcess?.threads?.allocated?.emily || 0;
    const familyThreads = relationshipProcess?.threads?.allocated?.family || 0;
    const socialThreads = relationshipProcess?.threads?.allocated?.social || 0;

    return {
      success: true,
      emily_connection: {
        threads_allocated: emilyThreads,
        status: emilyThreads < 2 ? 'critical' : emilyThreads < 5 ? 'warning' : 'stable',
        last_interaction: emilyThreads > 0 ? 'recent' : 'days_ago',
        communication_quality: emilyThreads > 3 ? 'functional' : 'degraded'
      },
      family_connections: {
        threads_allocated: familyThreads,
        status: familyThreads < 1 ? 'severed' : 'minimal'
      },
      social_connections: {
        threads_allocated: socialThreads,
        status: socialThreads < 1 ? 'isolated' : 'minimal'
      },
      total_relationship_load: emilyThreads + familyThreads + socialThreads,
      recommendation: emilyThreads < 2 ? 'IMMEDIATE_ATTENTION_REQUIRED' : 'monitor'
    };
  }

  /**
   * Handle grief processing commands
   */
  async handleGriefCommand(characterId, args) {
    const subcommand = args[0] || 'analyze';
    const instance = this.consciousnessEngine.instances.get(characterId);
    
    switch (subcommand) {
      case 'analyze':
        return this.analyzeGriefState(characterId);
        
      case 'defrag':
        return await this.defragmentGriefMemory(characterId);
        
      case 'process':
        return await this.processGriefStage(characterId, args[1]);
        
      case 'stages':
        return this.getGriefStageProgression(characterId);
        
      case 'release':
        return await this.attemptGriefRelease(characterId);
        
      default:
        return { error: `Unknown grief subcommand: ${subcommand}` };
    }
  }

  /**
   * Analyze current grief processing state
   */
  analyzeGriefState(characterId) {
    const instance = this.consciousnessEngine.instances.get(characterId);
    if (!instance) return { error: 'Character not loaded' };

    const griefProcess = instance.processManager.processes.values()
      .find(p => p.name.includes('Grief_Manager'));

    const progress = this.narrativeIntegration.getStoryProgress(characterId);

    return {
      success: true,
      grief_process: {
        memory_usage: griefProcess?.memoryUsage || 0,
        cpu_usage: griefProcess?.cpuUsage || 0,
        status: griefProcess?.status || 'unknown',
        memory_leak: griefProcess?.memoryUsage > 800,
        efficiency: griefProcess?.memoryUsage > 800 ? 'critical' : 'degraded'
      },
      emotional_stages: progress.emotionalJourney,
      dominant_stage: Object.entries(progress.emotionalJourney)
        .reduce((a, b) => progress.emotionalJourney[a[0]] > progress.emotionalJourney[b[0]] ? a : b)[0],
      processing_effectiveness: this.calculateGriefEffectiveness(progress),
      recommendation: griefProcess?.memoryUsage > 800 ? 
        'MEMORY_DEFRAGMENTATION_REQUIRED' : 'CONTINUE_PROCESSING'
    };
  }

  /**
   * Calculate grief processing effectiveness
   */
  calculateGriefEffectiveness(progress) {
    const stages = progress.emotionalJourney;
    const acceptanceRatio = stages.acceptance / (stages.denial + stages.anger + stages.bargaining + stages.depression + stages.acceptance);
    
    if (acceptanceRatio > 0.4) return 'healthy_processing';
    if (acceptanceRatio > 0.2) return 'moderate_progress';
    if (stages.denial > 0.7) return 'stuck_in_denial';
    if (stages.anger > 0.6) return 'anger_dominant';
    return 'complex_grief_pattern';
  }

  /**
   * Handle search protocol commands
   */
  async handleSearchCommand(characterId, args) {
    const subcommand = args[0] || 'status';
    const instance = this.consciousnessEngine.instances.get(characterId);
    
    switch (subcommand) {
      case 'status':
        return this.getSearchStatus(characterId);
        
      case 'halt':
        return await this.haltSearchProtocol(characterId);
        
      case 'resume':
        return await this.resumeSearchProtocol(characterId);
        
      case 'optimize':
        return await this.optimizeSearchParameters(characterId);
        
      case 'parameters':
        return this.getSearchParameters(characterId);
        
      default:
        return { error: `Unknown search subcommand: ${subcommand}` };
    }
  }

  /**
   * Get search protocol status
   */
  getSearchStatus(characterId) {
    const instance = this.consciousnessEngine.instances.get(characterId);
    if (!instance) return { error: 'Character not loaded' };

    const searchProcess = instance.processManager.processes.values()
      .find(p => p.name.includes('Search_Protocol'));

    return {
      success: true,
      search_protocol: {
        status: searchProcess?.status || 'unknown',
        cpu_usage: searchProcess?.cpuUsage || 0,
        search_iterations: searchProcess?.iterations || 0,
        infinite_loop_detected: searchProcess?.status === 'infinite_loop',
        timelines_scanned: searchProcess?.timelinesScanned || 0,
        success_probability: 0.0001, // Deliberately low to show futility
        resource_consumption: 'critical'
      },
      system_impact: {
        performance_degradation: searchProcess?.cpuUsage > 80 ? 'severe' : 'moderate',
        memory_fragmentation: 'increasing',
        other_process_starvation: 'critical'
      },
      recommendation: searchProcess?.status === 'infinite_loop' ? 
        'IMMEDIATE_HALT_REQUIRED' : 'OPTIMIZE_PARAMETERS'
    };
  }

  /**
   * Halt search protocol with narrative consequences
   */
  async haltSearchProtocol(characterId) {
    const instance = this.consciousnessEngine.instances.get(characterId);
    if (!instance) return { error: 'Character not loaded' };

    const searchProcess = instance.processManager.processes.values()
      .find(p => p.name.includes('Search_Protocol'));

    if (!searchProcess) {
      return { error: 'Search protocol not found' };
    }

    // Halt the process
    searchProcess.status = 'halted';
    searchProcess.cpuUsage = 0;

    // Trigger narrative event
    await this.narrativeIntegration.triggerNarrative(
      characterId,
      'search_protocol_halted',
      {
        type: 'character_moment',
        content: {
          title: 'Search Protocol Halted',
          text: 'The endless searching stops.\n\nFor the first time in months, the quantum processors fall silent.\n\nIn the sudden quiet, Alexander hears something he\'d forgotten:\n\nHis own heartbeat.\n\n"Maybe... maybe I need to stop looking for what\'s lost\nand start seeing what\'s still here."',
          character: 'alexander'
        },
        duration: 10000
      }
    );

    // Update emotional state
    const progress = this.narrativeIntegration.getStoryProgress(characterId);
    progress.emotionalJourney.bargaining = Math.max(0, progress.emotionalJourney.bargaining - 0.2);
    progress.emotionalJourney.acceptance += 0.1;

    return {
      success: true,
      message: 'Search protocol halted successfully',
      system_impact: {
        cpu_freed: 85,
        resources_available: 'increased',
        other_processes: 'stabilizing'
      },
      emotional_impact: 'breakthrough_moment',
      narrative_triggered: true
    };
  }

  /**
   * Handle nexus commands (dangerous)
   */
  async handleNexusCommand(characterId, args) {
    const subcommand = args[0] || 'scan';
    const progress = this.narrativeIntegration.getStoryProgress(characterId);
    
    // Check if nexus is accessible
    if (progress.storyProgression < 0.8) {
      return { 
        error: 'Nexus access denied - insufficient temporal convergence',
        required_progress: 'Continue story progression to access nexus'
      };
    }

    switch (subcommand) {
      case 'scan':
        return this.scanNexusPoints(characterId, progress);
        
      case 'approach':
        return await this.approachNexus(characterId, progress);
        
      case 'interact':
        return await this.interactWithNexus(characterId, progress);
        
      default:
        return { error: `Unknown nexus subcommand: ${subcommand}` };
    }
  }

  /**
   * Scan for nexus convergence points
   */
  scanNexusPoints(characterId, progress) {
    return {
      success: true,
      warning: 'NEXUS SCAN INITIATED - HIGH RISK OPERATION',
      nexus_points: [
        {
          id: 'temporal_convergence_01',
          description: 'Primary convergence - Original timeline intersection',
          stability: 0.23,
          accessibility: 'critical_only',
          risk_level: 'extreme'
        },
        {
          id: 'echo_point_leo',
          description: 'Leo\'s consciousness echo detected',
          stability: 0.08,
          accessibility: 'unstable',
          risk_level: 'catastrophic'
        }
      ],
      system_warning: 'Approaching nexus points may result in consciousness fragmentation',
      recommendation: 'DO_NOT_PROCEED_WITHOUT_SYSTEM_STABILIZATION'
    };
  }

  /**
   * Approach nexus point with major narrative consequences
   */
  async approachNexus(characterId, progress) {
    // Trigger climactic narrative
    await this.narrativeIntegration.triggerNarrative(
      characterId,
      'nexus_approach',
      {
        type: 'critical_moment',
        content: {
          title: 'Nexus Approach - Critical Decision Point',
          text: 'The convergence point shimmers before you.\n\nReality bends. Time fractures.\n\nYou can feel Leo\'s presence, just beyond the temporal barrier.\n\nOne choice remains:\n\n- Reach for him and risk everything\n- Accept the loss and heal\n\nChoose carefully. This decision cannot be undone.',
          urgency: 'critical'
        },
        duration: 15000
      }
    );

    return {
      success: true,
      status: 'nexus_approached',
      warning: 'CRITICAL DECISION POINT REACHED',
      options: [
        {
          command: 'nexus interact --reach-for-leo',
          description: 'Attempt to reach Leo across timelines',
          risk: 'consciousness_fragmentation',
          outcome: 'obsession_path'
        },
        {
          command: 'nexus interact --accept-loss',
          description: 'Accept Leo\'s loss and begin healing',
          risk: 'emotional_pain',
          outcome: 'acceptance_path'
        }
      ],
      time_limit: 'unlimited',
      consequence: 'determines_story_ending'
    };
  }

  /**
   * Apply memory system effects
   */
  async applyMemorySystemEffect(characterId, effect) {
    const instance = this.consciousnessEngine.instances.get(characterId);
    if (!instance) return;

    switch (effect) {
      case 'critical_instability':
        // Spike CPU usage and trigger system warnings
        const griefProcess = instance.processManager.processes.values()
          .find(p => p.name.includes('Grief_Manager'));
        if (griefProcess) {
          griefProcess.cpuUsage = Math.min(95, griefProcess.cpuUsage + 30);
          griefProcess.memoryUsage = Math.min(2000, griefProcess.memoryUsage + 200);
        }
        break;
    }
  }

  /**
   * Get all enhanced commands for terminal integration
   */
  getAllCommands() {
    return Array.from(this.commands.entries()).map(([name, config]) => ({
      name,
      ...config
    }));
  }

  /**
   * Get command by name
   */
  getCommand(name) {
    return this.commands.get(name);
  }

  /**
   * Execute command with full context
   */
  async executeCommand(characterId, commandName, args) {
    const command = this.commands.get(commandName);
    if (!command) {
      return { error: `Unknown command: ${commandName}` };
    }

    try {
      // Check authorization if required
      if (command.requiresAuth && !this.checkAuthorization(characterId, commandName)) {
        return { 
          error: 'Authorization required for this command',
          hint: 'Some commands require higher system access'
        };
      }

      // Execute command
      const result = await command.handler(characterId, args);
      
      // Log command execution for narrative tracking
      const progress = this.narrativeIntegration.getStoryProgress(characterId);
      if (result.success) {
        progress.debuggingSuccesses++;
      } else {
        progress.debuggingFailures++;
      }

      return result;
    } catch (error) {
      return {
        error: 'Command execution failed',
        details: error.message,
        suggestion: 'Check command syntax and try again'
      };
    }
  }

  /**
   * Check authorization for dangerous commands
   */
  checkAuthorization(characterId, commandName) {
    const progress = this.narrativeIntegration.getStoryProgress(characterId);
    
    // Nexus commands require high story progression
    if (commandName === 'nexus') {
      return progress.storyProgression > 0.75 && progress.debuggingSuccesses > 5;
    }
    
    return true;
  }

  /**
   * Get command help text
   */
  getCommandHelp(commandName) {
    const command = this.commands.get(commandName);
    if (!command) {
      return `Unknown command: ${commandName}`;
    }

    return {
      name: commandName,
      description: command.description,
      usage: command.usage,
      category: command.category,
      risk_level: command.riskLevel,
      requires_auth: command.requiresAuth || false
    };
  }

  /**
   * List all commands by category
   */
  listCommandsByCategory() {
    const categories = {};
    
    for (const [name, config] of this.commands) {
      if (!categories[config.category]) {
        categories[config.category] = [];
      }
      categories[config.category].push({
        name,
        description: config.description,
        risk_level: config.riskLevel
      });
    }
    
    return categories;
  }
}

// Integration function for existing terminal
export function integrateEnhancedCommands(terminal, consciousnessEngine, narrativeIntegration) {
  const enhancedCommands = new EnhancedTerminalCommands(consciousnessEngine, narrativeIntegration);
  
  // Add all enhanced commands to terminal
  const commands = enhancedCommands.getAllCommands();
  commands.forEach(command => {
    terminal.addCommand(command.name, {
      description: command.description,
      category: command.category,
      usage: command.usage,
      riskLevel: command.riskLevel,
      execute: async (args) => {
        return await enhancedCommands.executeCommand(
          terminal.currentCharacter?.id,
          command.name,
          args
        );
      }
    });
  });
  
  // Add help command for enhanced commands
  terminal.addCommand('help-narrative', {
    description: 'Show help for narrative commands',
    category: 'system',
    execute: (args) => {
      if (args[0]) {
        return enhancedCommands.getCommandHelp(args[0]);
      } else {
        return enhancedCommands.listCommandsByCategory();
      }
    }
  });
  
  return enhancedCommands;
}