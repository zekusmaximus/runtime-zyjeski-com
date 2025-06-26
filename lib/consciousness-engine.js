import { EventEmitter } from 'events';
import { ProcessGenerator } from './process-generator.js';
import { StateManager } from './state-manager.js';
import { NarrativeEngine } from './narrative-engine.js';
import ProcessEvolutionSystem from './ProcessEvolutionSystem.js';
import { SchemaLoader } from './engine/schema-loader.js';
import { AutosaveManager } from './engine/autosave-manager.js';
import { TickLoop } from './engine/tick-loop.js';
import { CharacterLoader } from './engine/character-loader.js';
import { MonitorResponder } from './engine/monitor-responder.js';

/**
 * Universal Consciousness Engine
 * Manages character consciousness instances across multiple stories
 */
export class ConsciousnessEngine extends EventEmitter {
  constructor() {
    super();
    
    // Core components
    this.instances = new Map();           // Active consciousness instances
    this.schemas = new Map();             // Loaded schemas for validation
    this.storyContexts = new Map();       // Story-specific contexts
    
    // Subsystems
    this.processGenerator = new ProcessGenerator();
    this.stateManager = new StateManager();
    this.narrativeEngine = new NarrativeEngine();
    this.processEvolution = new ProcessEvolutionSystem();
    
    // Configuration
    this.config = {
      maxInstances: 10,
      tickRate: 5000,                    // ms between system ticks (reduced frequency)
      autosaveInterval: 30000,          // ms between autosaves
      debugMode: false
    };
    
    // System state
    this.isRunning = false;
    this.isInitialized = false; // Track initialization state

    // Engine helpers
    this.schemaLoader = new SchemaLoader(this.schemas);
    this.autosaveManager = new AutosaveManager(this);
    this.tickLoop = new TickLoop(this);
    this.characterLoader = new CharacterLoader(this);
    this.monitorResponder = new MonitorResponder(this);
  }

  /**
   * Initialize the engine
   */
  async initialize() {
    // Prevent multiple initialization
    if (this.isInitialized) {
      console.log('ConsciousnessEngine already initialized, skipping');
      return true;
    }

    try {
      console.log('Initializing ConsciousnessEngine...');
      
      // Load schemas
      await this.loadSchemas();
      
      // Initialize subsystems
      await this.processGenerator.initialize();
      await this.narrativeEngine.initialize();
      
      // Don't auto-start system tick - wait for user interaction
      // if (!this.isRunning) {
      //   this.startSystemTick();
      // }
      
      this.isInitialized = true;
      this.emit('initialized');
      console.log('ConsciousnessEngine initialization complete');
      return true;
    } catch (error) {
      this.emit('error', { type: 'initialization', error });
      throw error;
    }
  }

  /**
   * Load JSON schemas for validation
   */
  async loadSchemas() {
    return this.schemaLoader.load();
  }

  /**
   * Start the system tick interval
   */
  startSystemTick() {
    // GROUND STATE: No automatic ticks
    console.log('System tick disabled - updates occur only through user actions');
    return;
}

  /**
   * Stop the system tick
   */
  stopSystemTick() {
    this.isRunning = false;
    this.tickLoop.stop();
    this.autosaveManager.stop();
  }

  async autosaveAll() {
    return this.autosaveManager.autosaveAll();
  }


  /**
   * Load a character consciousness with story context
   */
  async loadCharacter(characterId, options = {}) {
    return this.characterLoader.loadCharacter(characterId, options);
  }

  async loadCharacterData(characterId) {
    return this.characterLoader.loadCharacterData(characterId);
  }

  /**
   * Execute a debug action on a character
   */
  async executeDebugAction(characterId, action, parameters = {}) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }

    const storyContext = this.storyContexts.get(characterId);

    // Capture pre-execution state
    const preState = instance.captureState();

    try {
      // Execute the technical action
      const result = await instance.executeAction(action, parameters);

      // Check for narrative triggers if in story context
      if (storyContext) {
        const narrativeEvents = await this.narrativeEngine.checkTriggers(
          instance.getState(),
          action,
          result,
          storyContext
        );

        // Apply narrative effects
        if (narrativeEvents.length > 0) {
          result.narrativeEvents = await this.applyNarrativeEffects(
            instance,
            narrativeEvents,
            storyContext
          );
        }
      }

      // Emit event for UI updates
      this.emit('actionExecuted', {
        characterId,
        action,
        result,
        state: instance.getState()
      });

      return result;

    } catch (error) {
      // Rollback on error
      await instance.restoreState(preState);
      
      this.emit('actionError', {
        characterId,
        action,
        error
      });
      
      throw error;
    }
  }

  /**
   * Apply narrative effects from triggered fragments
   */
  async applyNarrativeEffects(instance, narrativeEvents, storyContext) {
    const appliedEffects = [];

    for (const event of narrativeEvents) {
      const fragment = event.fragment;
      
      // Apply fragment effects
      if (fragment.effects) {
        // Emotional effects
        if (fragment.effects.emotional) {
          for (const effect of fragment.effects.emotional) {
            await instance.modifyEmotionalState(
              effect.emotion,
              effect.modifier,
              effect.duration
            );
          }
        }

        // Process effects
        if (fragment.effects.processes) {
          for (const effect of fragment.effects.processes) {
            await instance.modifyProcess(
              effect.process,
              effect.action,
              effect.parameters
            );
          }
        }

        // Memory effects
        if (fragment.effects.memory) {
          for (const effect of fragment.effects.memory) {
            await instance.modifyMemory(
              effect.action,
              effect.address,
              effect.data
            );
          }
        }
      }

      appliedEffects.push({
        fragmentId: fragment.id,
        type: event.type,
        content: fragment.content,
        effects: fragment.effects
      });
    }

    return appliedEffects;
  }

  /**
   * Switch between stories
   */
  async switchStory(fromStoryId, toStoryId, options = {}) {
    const { 
      transferProgress = false,
      userId = null,
      maintainCharacter = false 
    } = options;

    // Find character associated with current story
    let currentCharacterId = null;
    for (const [charId, context] of this.storyContexts.entries()) {
      if (context.storyId === fromStoryId) {
        currentCharacterId = charId;
        break;
      }
    }

    // Save current progress if requested
    if (transferProgress && currentCharacterId && userId) {
      await this.saveProgress(userId, currentCharacterId, fromStoryId);
    }

    // Unload current story
    if (!maintainCharacter && currentCharacterId) {
      await this.unloadCharacter(currentCharacterId);
    }

    // Load new story configuration
    const newStoryConfig = await this.loadStoryConfig(toStoryId);
    
    // Load new character for story
    const newCharacter = await this.loadCharacter(
      newStoryConfig.protagonist.characterId,
      {
        storyContext: {
          storyId: toStoryId,
          config: newStoryConfig
        },
        startingState: newStoryConfig.protagonist.startingState,
        userId,
        loadProgress: true
      }
    );

    this.emit('storySwitch', {
      from: fromStoryId,
      to: toStoryId,
      character: newCharacter.id
    });

    return {
      story: newStoryConfig,
      character: newCharacter
    };
  }

  /**
   * Load story configuration
  */
  async loadStoryConfig(storyId) {
    return this.characterLoader.loadStoryConfig(storyId);
  }

  /**
   * Unload a character consciousness
  */
  async unloadCharacter(characterId) {
    return this.characterLoader.unloadCharacter(characterId);
  }

  /**
   * Save progress for a character
   */
  async saveProgress(userId, characterId, storyId) {
    const instance = this.instances.get(characterId);
    if (!instance) return;

    const state = instance.captureState();
    const storyContext = this.storyContexts.get(characterId);

    await this.stateManager.saveProgress(userId, characterId, storyId, {
      consciousness: state,
      narrative: this.narrativeEngine.getProgress(storyId),
      timestamp: new Date().toISOString(),
      context: storyContext
    });
  }

  /**
   * System tick - update all active consciousnesses
   */
  async systemTick() {
    return this.tickLoop.systemTick();
  }

  /**
   * Trigger manual update for a character
   */
  async triggerUpdate(characterId, reason) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }

    console.log(`🔧 Triggering manual update for ${characterId} due to: ${reason}`);
    await instance.update();
    await this.broadcastStateChange(characterId, `manual-update-${reason}`);
  }

  /**
   * Start monitoring a character consciousness
   */

/**
 * Start real-time broadcasting for active monitoring sockets
 * DISABLED: Only send updates on-demand or when state actually changes
 */
startRealTimeBroadcasting() {
  this.monitorResponder.startRealTimeBroadcasting();
}

/**
 * Stop real-time broadcasting
 */
stopRealTimeBroadcasting() {
  this.monitorResponder.stopRealTimeBroadcasting();
}

/**
 * Broadcast consciousness updates to all monitoring sockets
 */
async broadcastToMonitoringSockets() {
  return this.monitorResponder.broadcastStateChange();
}

/**
 * Broadcast updates only when state actually changes (on-demand)
 * This replaces the automatic 10-second polling with event-driven updates
 */
async broadcastStateChange(characterId, changeType = 'state-change') {
  console.log(`📡 Broadcasting state change for ${characterId} (${changeType})`);
  try {
    await this.monitorResponder.broadcastStateChange(characterId, changeType);
    console.log(`✅ Successfully broadcast state for ${characterId}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to broadcast state for ${characterId}:`, err);
    return false;
  }
}

/**
 * Enhanced startMonitoring method
 */
async startMonitoring(characterId, socketId) {
  return this.monitorResponder.startMonitoring(characterId, socketId);
}

/**
 * Enhanced stopMonitoring method
 */
async stopMonitoring(socketId) {
  return this.monitorResponder.stopMonitoring(socketId);
}

/**
 * Enhanced shutdown method
 */
  async shutdown() {
    this.stopSystemTick();
    this.stopRealTimeBroadcasting();
    
    // Save all progress
    await this.autosaveAll();
    
    // Shutdown all instances
    for (const [characterId, instance] of this.instances) {
      await instance.shutdown();
    }
    
    this.instances.clear();
    this.storyContexts.clear();
    
    if (this.monitorResponder.monitoringSockets) {
      this.monitorResponder.monitoringSockets.clear();
    }
    
    this.emit('shutdown');
  }
  /**
   * Get current statistics
   */
  getStatistics() {
    const stats = {
      activeInstances: this.instances.size,
      isRunning: this.isRunning,
      instances: {}
    };

    for (const [characterId, instance] of this.instances) {
      stats.instances[characterId] = instance.getStatistics();
    }

    return stats;
  }
  /**
   * Get consciousness state for a character
   */
  async getState(characterId) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }
    
    // Get the raw state from the instance
    const rawState = instance.getState();
    
    // Ensure all required properties are properly formatted
    const normalizedState = {
      ...rawState,
      // Ensure processes is available at the top level
      processes: rawState.consciousness?.processes || [],
      system_errors: [],
      threads: rawState.consciousness?.resources?.threads ? [rawState.consciousness.resources.threads] : [],
      // Preserve the nested consciousness structure
      consciousness: {
        ...rawState.consciousness,
        memory: rawState.consciousness?.memory || {
          capacity: { allocated: 0, available: 10000, reserved: 1000, total: 10000 },
          pools: { shortTerm: 0, longTerm: 0, traumatic: 0, suppressed: 0, procedural: 0 },
          totalMemories: 0,
          compressionRatio: 1,
          fragmentationLevel: 0,
          emotionalIndexes: 0,
          isInitialized: true,
          debuggableIssues: {
            memoryLeaks: [],
            corruptedMemories: [],
            fragmentedMemories: [],
            highPressureWarning: false
          }
        }
      }
    };
    
    return normalizedState;
  }
  /**
   * Update consciousness state
   */
  async updateState(characterId, updates) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }
    
    // Apply updates to the instance
    if (updates.emotional) {
      await instance.emotionalProcessor.processEmotionalInput(updates.emotional);
    }
    
    if (updates.memory) {
      await instance.memoryManager.storeMemory(updates.memory);
    }
    
    if (updates.processes) {
      for (const processUpdate of updates.processes) {
        await instance.processManager.executeAction(processUpdate.action, processUpdate.parameters);
      }
    }
    
    // Return normalized state (same as getState)
    return this.getState(characterId);
  }

  /**
   * Get memory for a character
   */
  async getMemory(characterId) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }
    
    // Fix: Access memoryState.manager instead of memoryManager
    if (!instance.memoryState || !instance.memoryState.manager) {
      // Return default memory structure if manager not initialized
      return {
        capacity: {
          total: 10000,
          allocated: 0,
          available: 10000,
          reserved: 1000,
          utilizationPercentage: 0
        },
        pools: {
          shortTerm: { count: 0, maxSize: 2000, utilizationPercentage: 0 },
          longTerm: { count: 0, maxSize: 2000, utilizationPercentage: 0 },
          traumatic: { count: 0, maxSize: 2000, utilizationPercentage: 0 },
          suppressed: { count: 0, maxSize: 2000, utilizationPercentage: 0 },
          procedural: { count: 0, maxSize: 2000, utilizationPercentage: 0 }
        },
        fragmentation: {
          level: 0,
          severity: 'low'
        },
        statistics: {
          totalMemories: 0,
          emotionalIndexes: 0,
          accessPatterns: 0
        },
        issues: {
          memoryLeaks: [],
          corruptedMemories: [],
          fragmentedMemories: [],
          highPressureWarning: false
        },
        recentActivity: []
      };
    }
    
    // Use getMemoryStatus instead of getMemoryDataForFrontend to get the full data
    return instance.memoryState.manager.getMemoryStatus();
  }  /**
   * Get system errors for a character - Updated version
   */
  async getErrors(characterId) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }
    
    // Collect errors from all subsystems
    const errors = [];
  
  // Process errors
  if (instance.processManager) {
    const processIssues = instance.processManager.getDebuggableProcesses();
    processIssues.forEach(process => {
      if (process.issues && Array.isArray(process.issues)) {
        process.issues.forEach(issue => {
          errors.push({
            type: 'process_error',
            source: process.name,
            severity: issue.severity,
            description: issue.description,
            timestamp: issue.timestamp || Date.now()
          });
        });
      }
    });
  }
  
  // Memory errors - Fixed to use memoryState.manager
  if (instance.memoryState && instance.memoryState.manager) {
    try {
      const memoryIssues = instance.memoryState.manager.getDebuggableMemoryIssues();
      
      // Handle memory leaks
      if (memoryIssues.memoryLeaks && memoryIssues.memoryLeaks.length > 0) {
        memoryIssues.memoryLeaks.forEach(leak => {
          errors.push({
            type: 'memory_leak',
            source: 'MemoryManager',
            severity: leak.leakScore > 0.8 ? 'high' : leak.leakScore > 0.5 ? 'medium' : 'low',
            description: `Potential memory leak detected: ${leak.id} (age: ${Math.round(leak.age / 1000)}s, size: ${leak.size})`,
            timestamp: Date.now() - leak.age
          });
        });
      }
      
      // Handle corrupted memories
      if (memoryIssues.corruptedMemories && memoryIssues.corruptedMemories.length > 0) {
        memoryIssues.corruptedMemories.forEach(memory => {
          errors.push({
            type: 'memory_corruption',
            source: 'MemoryManager',
            severity: memory.integrityScore < 0.3 ? 'high' : 'medium',
            description: `Memory corruption detected: ${memory.id} (integrity: ${Math.round(memory.integrityScore * 100)}%)`,
            timestamp: Date.now()
          });
        });
      }
      
      // Handle fragmented memories
      if (memoryIssues.fragmentedMemories && memoryIssues.fragmentedMemories.length > 0) {
        errors.push({
          type: 'memory_fragmentation',
          source: 'MemoryManager',
          severity: memoryIssues.fragmentedMemories.length > 10 ? 'high' : 'medium',
          description: `Memory fragmentation detected: ${memoryIssues.fragmentedMemories.length} fragmented blocks`,
          timestamp: Date.now()
        });
      }
      
      // Handle high memory pressure
      if (memoryIssues.highPressureWarning) {
        errors.push({
          type: 'memory_pressure',
          source: 'MemoryManager',
          severity: 'high',
          description: 'High memory pressure detected - available memory below reserved threshold',
          timestamp: Date.now()
        });
      }
    } catch (memErr) {
      // If there's an error accessing memory issues, log it but continue
      console.error('Error getting memory issues:', memErr);
    }
  }
  
  // Emotional errors
  if (instance.emotionalState && instance.emotionalState.processor) {
    try {
      const emotionalIssues = instance.emotionalState.processor.getDebuggableEmotionalIssues();
      if (Array.isArray(emotionalIssues)) {
        emotionalIssues.forEach(issue => {
          errors.push({
            type: 'emotional_error',
            source: 'EmotionalProcessor',
            severity: issue.severity || 'medium',
            description: issue.description,
            timestamp: issue.timestamp || Date.now()
          });
        });
      }
    } catch (emoErr) {
      // If there's an error accessing emotional issues, log it but continue
      console.error('Error getting emotional issues:', emoErr);
    }
  }
  
  return errors.sort((a, b) => b.timestamp - a.timestamp);
}

  /**
   * Execute a simple debug command on a character
   */
  async executeDebugCommand(characterId, command, args = {}) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }

    const state = instance.getState().consciousness;
    let result;
    let stateChanged = false;

    switch (command) {
      case 'ps':
        result = { processes: instance.processManager.getProcessList() };
        break;
      case 'top':
        result = {
          processes: instance.processManager.getProcessList().slice(0, 5),
          resources: state.resources
        };
        break;
      case 'monitor':
        result = {
          memory: state.memory,
          errors: state.system_errors,
          resources: state.resources
        };
        break;
      case 'kill':
        if (args.pid) {
          try {
            await instance.processManager.killProcess(args.pid);
            result = { success: true, pid: args.pid, status: 'killed' };
            stateChanged = true; // Process state changed
          } catch (err) {
            result = { error: `Process ${args.pid} not found` };
          }
        } else {
          result = { error: 'PID required for kill command' };
        }
        break;
      default:
        result = { error: `Unknown command: ${command}` };
    }

    // Only broadcast updates when state actually changes
    if (stateChanged) {
      console.log(`🔄 State changed due to debug command '${command}' - broadcasting update`);
      await this.broadcastStateChange(characterId, `debug-${command}`);
    }

    return result;
  }

  /**
   * Apply player intervention and trigger state update
   */
  async applyPlayerIntervention(characterId, intervention) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }

    console.log(`🎮 Applying player intervention: ${intervention.type} to ${characterId}`);
    
    // Apply the intervention based on type
    let result = { success: false, message: 'Unknown intervention type' };
    
    switch (intervention.type) {
      case 'memory-injection':
        if (intervention.memory) {
          instance.memoryManager.injectMemory(intervention.memory);
          result = { success: true, message: 'Memory injected successfully' };
        }
        break;
        
      case 'process-restart':
        if (intervention.processId) {
          await instance.processManager.restartProcess(intervention.processId);
          result = { success: true, message: `Process ${intervention.processId} restarted` };
        }
        break;
        
      case 'emotional-adjustment':
        if (intervention.emotion && intervention.intensity) {
          instance.emotionalProcessor.adjustEmotion(intervention.emotion, intervention.intensity);
          result = { success: true, message: `Adjusted ${intervention.emotion} to ${intervention.intensity}` };
        }
        break;
        
      default:
        result = { success: false, message: `Unknown intervention type: ${intervention.type}` };
    }

    // Trigger state update since intervention changes the consciousness state
    if (result.success) {
      console.log(`🔄 State changed due to intervention '${intervention.type}' - broadcasting update`);
      await this.broadcastStateChange(characterId, `intervention-${intervention.type}`);
    } else {
      console.log(`⚠️ Intervention '${intervention.type}' did not change state - skipping broadcast`);
    }

    return result;
  }
}
