// Enhanced Narrative Integration System - Fixed for compatibility
// lib/narrative-integration.js

import { EventEmitter } from 'events';

export default class NarrativeIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    this.storyProgress = new Map(); // userId -> progress data
    this.activeNarratives = new Map(); // characterId -> current narrative state
    this.narrativeTriggers = new Map();
    this.visualCueQueue = new Map(); // characterId -> pending visual cues
    
    this.setupCoreTriggers();
  }

  /**
   * Initialize narrative integration with consciousness engine
   */
  async attach(consciousnessEngine, scenarioEngine) {
    this.consciousnessEngine = consciousnessEngine;
    this.scenarioEngine = scenarioEngine;
    
    // Listen to EXISTING consciousness events (fixed event names)
    consciousnessEngine.on('consciousness-updated', (data) => this.checkNarrativeTriggers(data));
    consciousnessEngine.on('debug-command-executed', (data) => this.processUserAction(data));
    consciousnessEngine.on('real-time-update', (data) => this.handleRealTimeUpdate(data));
    
    // Listen to scenario events if scenarioEngine exists
    if (scenarioEngine) {
      scenarioEngine.on('scenarioStarted', (data) => this.handleScenarioProgress(data));
      scenarioEngine.on('scenarioCompleted', (data) => this.handleScenarioProgress(data));
    }
    
    console.log('Narrative integration attached successfully');
  }

  /**
   * Setup core narrative triggers that respond to debugging actions
   */
  setupCoreTriggers() {
    // Memory leak discovery triggers grief revelation
    this.narrativeTriggers.set('grief_memory_leak', {
      condition: (data) => {
        try {
          const processes = data.state?.processes || data.processes;
          if (!Array.isArray(processes)) return false;
          
          const griefProcess = processes.find(p => 
            p.name && p.name.toLowerCase().includes('grief')
          );
          return griefProcess && griefProcess.memoryUsage > 800;
        } catch (error) {
          console.error('Error checking grief memory leak condition:', error);
          return false;
        }
      },
      narrative: {
        type: 'character_moment',
        duration: 8000,
        content: {
          title: 'Memory Leak Detected',
          text: 'The numbers don\'t lie. 847MB and growing.\n\nEach byte a moment with Leo I can\'t let go.\n\nThe park, the ducks, his laugh before the flash—\n\nNo. Focus. This is just data. Just... data.',
          character: 'alexander',
          emotionalWeight: 0.8
        },
        visualCue: {
          type: 'memory_fragment',
          location: 'monitor',
          style: 'pulsing_red'
        }
      }
    });

    // First process scan triggers system awareness
    this.narrativeTriggers.set('first_consciousness_scan', {
      condition: (data) => {
        try {
          return data.command === 'ps' && !this.hasSeenNarrative(data.characterId, 'first_consciousness_scan');
        } catch (error) {
          return false;
        }
      },
      narrative: {
        type: 'system_message',
        duration: 6000,
        content: {
          title: 'Consciousness Scan Complete',
          text: 'SYSTEM: First consciousness scan detected.\nWARNING: Multiple critical processes identified.\nDr. Kane, your mental state requires immediate attention.\n\nA memory surfaces: Dr. Cross\'s voice, \'Alexander, you can\'t debug your way out of grief.\'',
          style: 'terminal_overlay'
        },
        visualCue: {
          type: 'terminal_highlight',
          location: 'terminal',
          style: 'warning_glow'
        }
      }
    });

    // Emily relationship thread starvation
    this.narrativeTriggers.set('emily_thread_starvation', {
      condition: (data) => {
        try {
          const processes = data.state?.processes || data.processes;
          if (!Array.isArray(processes)) return false;
          
          const relationshipProcess = processes.find(p => 
            p.name && p.name.toLowerCase().includes('relationship')
          );
          return relationshipProcess && relationshipProcess.threads && relationshipProcess.threads.available < 2;
        } catch (error) {
          console.error('Error checking Emily thread starvation condition:', error);
          return false;
        }
      },
      narrative: {
        type: 'memory_injection',
        duration: 10000,
        content: {
          title: 'Relationship Memory Fragment',
          text: 'MEMORY FRAGMENT DETECTED:\n\nEmily (last week): "You haven\'t looked at me in months, Alex."\nEmily (yesterday): "I lost him too."\nEmily (today): [NO_RECENT_MEMORY_FOUND]',
          memoryAddress: '0x7FFF8A2B4C90'
        },
        effect: {
          process: 'guilt_spike',
          magnitude: 0.3
        },
        visualCue: {
          type: 'memory_overlay',
          location: 'debugger',
          style: 'fragmented_text'
        }
      }
    });

    // Infinite search loop recognition
    this.narrativeTriggers.set('infinite_search_detected', {
      condition: (data) => {
        try {
          const processes = data.state?.processes || data.processes;
          if (!Array.isArray(processes)) return false;
          
          const searchProcess = processes.find(p => 
            p.name && p.name.toLowerCase().includes('search')
          );
          return searchProcess && searchProcess.status === 'infinite_loop';
        } catch (error) {
          console.error('Error checking infinite search condition:', error);
          return false;
        }
      },
      narrative: {
        type: 'technical_revelation',
        duration: 12000,
        content: {
          title: 'Search Loop Analysis',
          text: 'TEMPORAL ANALYSIS LOG - Personal Note:\n\nThe equations were perfect. Every calculation checked twice.\nVariable unaccounted for: Leo\'s curiosity.\nHe just wanted to see the "rainbow machine" work.\n\nSeven timelines detected. In one, I stopped him at the door.\nIn another, the experiment was scheduled for Thursday.\n\nBut in this timeline... in this timeline, he\'s gone.',
          style: 'code_comment'
        },
        visualCue: {
          type: 'timeline_visualization',
          location: 'monitor',
          style: 'branching_paths'
        }
      }
    });
  }

  /**
   * Check for narrative triggers based on consciousness state updates
   */
  async checkNarrativeTriggers(data) {
    if (!data || !data.characterId) {
      return;
    }
    
    try {
      for (const [triggerId, trigger] of this.narrativeTriggers) {
        if (trigger.condition(data)) {
          await this.triggerNarrative(data.characterId, triggerId, trigger.narrative);
        }
      }
    } catch (error) {
      console.error('Error checking narrative triggers:', error);
    }
  }

  /**
   * Handle real-time updates
   */
  async handleRealTimeUpdate(data) {
    // Process real-time updates for narrative purposes
    await this.checkNarrativeTriggers(data);
  }

  /**
   * Process user debugging actions for narrative consequences
   */
  async processUserAction(data) {
    if (!data || !data.characterId) {
      return;
    }
    
    try {
      const { characterId, command, result } = data;
      
      // Track debugging competency for story branching
      const progress = this.getStoryProgress(characterId);
      
      // Check for specific commands that trigger narratives
      if (command === 'ps' && result && result.success) {
        await this.triggerNarrative(characterId, 'first_consciousness_scan', 
          this.narrativeTriggers.get('first_consciousness_scan').narrative);
      }
      
      if (result && result.success) {
        progress.debuggingSuccesses++;
      } else {
        progress.debuggingFailures++;
      }
    } catch (error) {
      console.error('Error processing user action:', error);
    }
  }

  /**
   * Trigger a narrative moment with visual cues
   */
  async triggerNarrative(characterId, triggerId, narrative) {
    if (!characterId || !triggerId || !narrative) {
      return;
    }
    
    try {
      // Prevent duplicate triggers
      if (this.hasSeenNarrative(characterId, triggerId)) {
        return;
      }
      
      // Mark as seen
      this.markNarrativeSeen(characterId, triggerId);
      
      // Queue visual cue if specified
      if (narrative.visualCue) {
        this.queueVisualCue(characterId, narrative.visualCue);
      }
      
      // Apply any system effects
      if (narrative.effect) {
        await this.applyNarrativeEffect(characterId, narrative.effect);
      }
      
      // Emit narrative event for UI
      this.emit('narrativeTriggered', {
        characterId,
        triggerId,
        narrative,
        timestamp: Date.now()
      });
      
      console.log(`Narrative triggered: ${triggerId} for character ${characterId}`);
    } catch (error) {
      console.error('Error triggering narrative:', error);
    }
  }

  /**
   * Queue visual cue for UI display
   */
  queueVisualCue(characterId, visualCue) {
    if (!this.visualCueQueue.has(characterId)) {
      this.visualCueQueue.set(characterId, []);
    }
    
    this.visualCueQueue.get(characterId).push({
      ...visualCue,
      id: `cue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    });
    
    // Emit for immediate UI handling
    this.emit('visualCueQueued', {
      characterId,
      cue: visualCue
    });
  }

  /**
   * Apply narrative effects to consciousness state (simplified)
   */
  async applyNarrativeEffect(characterId, effect) {
    // Simplified version that doesn't require deep engine integration
    console.log(`Applying narrative effect: ${effect.process} for character ${characterId}`);
    
    // Future: This could trigger actual consciousness state changes
    // For now, just log the effect
  }

  /**
   * Get visual cues for a character
   */
  getVisualCues(characterId) {
    return this.visualCueQueue.get(characterId) || [];
  }

  /**
   * Clear processed visual cues
   */
  clearVisualCue(characterId, cueId) {
    const cues = this.visualCueQueue.get(characterId);
    if (cues) {
      const index = cues.findIndex(cue => cue.id === cueId);
      if (index !== -1) {
        cues.splice(index, 1);
      }
    }
  }

  /**
   * Track story progress for branching narratives
   */
  getStoryProgress(characterId) {
    if (!this.storyProgress.has(characterId)) {
      this.storyProgress.set(characterId, {
        debuggingSuccesses: 0,
        debuggingFailures: 0,
        narrativesSeen: new Set(),
        relationshipProgress: 0,
        emotionalJourney: {
          denial: 1.0,
          anger: 0.2,
          bargaining: 0.0,
          depression: 0.0,
          acceptance: 0.0
        },
        storyProgression: 0.0
      });
    }
    return this.storyProgress.get(characterId);
  }

  /**
   * Check if character has seen specific narrative
   */
  hasSeenNarrative(characterId, triggerId) {
    const progress = this.getStoryProgress(characterId);
    return progress.narrativesSeen.has(triggerId);
  }

  /**
   * Mark narrative as seen
   */
  markNarrativeSeen(characterId, triggerId) {
    const progress = this.getStoryProgress(characterId);
    progress.narrativesSeen.add(triggerId);
  }

  /**
   * Handle scenario progression for story advancement
   */
  async handleScenarioProgress(data) {
    if (!data || !data.characterId) {
      return;
    }
    
    try {
      const { characterId, scenarioId, progress } = data;
      
      // Update story progression based on scenario completion
      const storyProgress = this.getStoryProgress(characterId);
      storyProgress.storyProgression = Math.max(storyProgress.storyProgression, progress || 0);
      
      console.log(`Scenario progress updated: ${characterId} - ${progress}`);
    } catch (error) {
      console.error('Error handling scenario progress:', error);
    }
  }

  /**
   * Enhanced terminal commands for narrative interaction (simplified)
   */
  getEnhancedTerminalCommands() {
    return {
      'memories': {
        description: 'Access character memory fragments',
        category: 'narrative',
        handler: this.handleMemoryCommand.bind(this)
      },
      'story': {
        description: 'View current story progression',
        category: 'narrative',
        handler: this.handleStoryCommand.bind(this)
      }
    };
  }

  /**
   * Handle memory command for narrative discovery (simplified)
   */
  async handleMemoryCommand(characterId, args) {
    if (!characterId) {
      return { error: 'Character not loaded' };
    }
    
    const subcommand = args[0] || 'list';
    
    switch (subcommand) {
      case 'list':
        return {
          success: true,
          memories: [
            {
              address: '0x1000000000000000',
              description: 'Leo\'s last day - temporal experiment preparation',
              accessible: true
            }
          ]
        };
      default:
        return { error: 'Unknown memory subcommand' };
    }
  }

  /**
   * Handle story command
   */
  async handleStoryCommand(characterId, args) {
    if (!characterId) {
      return { error: 'Character not loaded' };
    }
    
    const progress = this.getStoryProgress(characterId);
    return {
      success: true,
      progress: {
        debuggingSuccesses: progress.debuggingSuccesses,
        debuggingFailures: progress.debuggingFailures,
        storyProgression: progress.storyProgression,
        emotionalState: progress.emotionalJourney
      }
    };
  }

  /**
   * Get comprehensive status for debugging narrative integration
   */
  getDebugStatus() {
    return {
      activeNarratives: Array.from(this.activeNarratives.entries()),
      triggerCount: this.narrativeTriggers.size,
      storyProgressTracking: Array.from(this.storyProgress.entries()),
      queuedVisualCues: Array.from(this.visualCueQueue.entries())
    };
  }
}