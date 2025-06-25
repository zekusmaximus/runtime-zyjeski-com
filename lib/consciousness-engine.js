import fs from 'fs/promises';
import path from 'path';
import { validate } from 'jsonschema';
import { EventEmitter } from 'events';
import { ConsciousnessInstance } from './consciousness-instance.js';
import { ProcessGenerator } from './process-generator.js';
import { StateManager } from './state-manager.js';
import { NarrativeEngine } from './narrative-engine.js';
import ProcessEvolutionSystem from './ProcessEvolutionSystem.js';

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
    this.tickInterval = null;
    this.autosaveInterval = null;
    this.isInitialized = false;  // Track initialization state
    this.broadcastInterval = null;  // <-- ADD THIS LINE HERE
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
    
    // Start system tick only once
    if (!this.isRunning) {
      this.startSystemTick();
    }
    
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
   */  async loadSchemas() {
  // Skip if already loaded
  if (this.schemas.size > 0) {
    console.log('Schemas already loaded, skipping');
    return;
  }

  const schemaDir = path.join(process.cwd(), 'data', 'schema');
  const schemaFiles = [
    'consciousness-schema.json',
    'story-schema.json',
    'narrative-fragment-schema.json'
  ];

  console.log(`Loading schemas from: ${schemaDir}`);

  for (const file of schemaFiles) {
    const schemaPath = path.join(schemaDir, file);
    try {
      const schemaData = await fs.readFile(schemaPath, 'utf8');
      const schema = JSON.parse(schemaData);
      const schemaKey = file.replace('.json', '');
      this.schemas.set(schemaKey, schema);
      console.log(`Loaded schema: ${schemaKey}`);
    } catch (error) {
      console.error(`Failed to load schema ${file}:`, error);
      throw new Error(`Failed to load schema ${file}: ${error.message}`);
    }
  }
  
  console.log(`Successfully loaded ${this.schemas.size} schemas`);
}

  /**
   * Start the system tick interval
 */
startSystemTick() {
  // Prevent multiple tick loops
  if (this.isRunning || this.tickInterval) {
    console.log('System tick already running');
    return;
  }

  this.isRunning = true;
  this.tickInterval = setInterval(() => {
    this.systemTick();
  }, this.config.tickRate);

  // Start autosave interval only if not already running
  if (!this.autosaveInterval) {
    this.autosaveInterval = setInterval(() => {
      this.autosaveAll();
    }, this.config.autosaveInterval);
  }
  
  console.log('System tick started');
}

  /**
   * Stop the system tick
   */
  stopSystemTick() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
    }
    
    this.isRunning = false;
    console.log('System tick stopped');
  }


  /**
   * Load a character consciousness with story context
   */
  async loadCharacter(characterId, options = {}) {
     // Return existing instance if already loaded
  if (this.instances.has(characterId)) {
    console.log(`Character ${characterId} already loaded`);
    return this.instances.get(characterId);
  }
    // Check instance limit
    if (this.instances.size >= this.config.maxInstances) {
      throw new Error('Maximum consciousness instances reached');
    }

    // Load character data
    const characterData = await this.loadCharacterData(characterId);    
    // Validate against schema
    const schema = this.schemas.get('consciousness-schema');
    if (!schema) {
      throw new Error('Consciousness schema not loaded. Engine may not be properly initialized.');
    }
    
    const validation = validate(characterData, schema);
    if (!validation.valid) {
      throw new Error(`Invalid consciousness data: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Create instance with options
    const instance = new ConsciousnessInstance({
      ...characterData,
      engine: this,
      dynamicProcessing: options.enableDynamic ?? true,
      difficultyLevel: options.difficulty ?? 'intermediate',
      debugMode: options.debugMode ?? this.config.debugMode
    });

    // Set story context if provided
    if (options.storyContext) {
      this.storyContexts.set(characterId, options.storyContext);
      
      // Load story-specific narrative fragments
      await this.narrativeEngine.loadStoryFragments(options.storyContext.storyId);
    }

    // Initialize with starting state
    const startingState = options.startingState ?? characterData.defaultState;
    await instance.initialize(startingState);

    // Store instance
    this.instances.set(characterId, instance);

    this.emit('characterLoaded', { characterId, instance });
    console.log(`Character ${characterId} loaded successfully`);
    
    return instance;

    // Load previous progress if exists
    if (options.loadProgress) {
      const progress = await this.stateManager.loadProgress(
        options.userId,
        characterId,
        options.storyContext?.storyId
      );
      if (progress) {
        await instance.restoreState(progress);
      }
    }

    this.emit('characterLoaded', { characterId, instance });
    return instance;
  }

  /**
   * Load character data from file
   */
  async loadCharacterData(characterId) {
    const characterPath = path.join(
      process.cwd(),
      'data',
      'characters',
      `${characterId}.json`
    );

    try {
      await fs.access(characterPath);
    } catch (err) {
      throw new Error(`Character ${characterId} not found`);
    }

    const data = await fs.readFile(characterPath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch (err) {
      throw new Error(`Failed to parse ${characterId}.json`);
    }

    return parsed;
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
    const storyPath = path.join(
      process.cwd(),
      'data',
      'stories',
      storyId,
      'story-config.json'
    );
    
    const data = await fs.readFile(storyPath, 'utf8');
    const config = JSON.parse(data);
    
    // Validate against schema
    const validation = validate(config, this.schemas.get('story-schema'));
    if (!validation.valid) {
      throw new Error(`Invalid story configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    
    return config;
  }

  /**
   * Unload a character consciousness
   */
  async unloadCharacter(characterId) {
    const instance = this.instances.get(characterId);
    if (!instance) return;

    // Save final state
    await instance.shutdown();

    // Remove from tracking
    this.instances.delete(characterId);
    this.storyContexts.delete(characterId);

    this.emit('characterUnloaded', { characterId });
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
    for (const [characterId, instance] of this.instances) {
      try {
        // Update instance
        const updates = await instance.tick();

        // Apply process evolution rules
        const gameState = instance.getState();
        for (const process of instance.processManager.processes.values()) {
          const evolved = this.processEvolution.evolveProcess(process, gameState);
          Object.assign(process, evolved);
        }

        // Spawn emergent processes
        const emergent = this.processEvolution.checkForEmergentProcesses(gameState);
        if (emergent.length > 0) {
          emergent.forEach(p => {
            instance.processManager.processes.set(p.pid, p);
          });
        }
        
        // Check for narrative triggers from system state
        const storyContext = this.storyContexts.get(characterId);
        if (storyContext && updates.stateChanges.length > 0) {
          const narrativeEvents = await this.narrativeEngine.checkSystemTriggers(
            instance.getState(),
            updates,
            storyContext
          );
          
          if (narrativeEvents.length > 0) {
            await this.applyNarrativeEffects(instance, narrativeEvents, storyContext);
          }
        }

        // Emit updates for UI
        if (updates.hasChanges) {
          this.emit('stateUpdate', {
            characterId,
            updates,
            state: instance.getState()
          });
        }
      } catch (error) {
        this.emit('tickError', { characterId, error });
      }
    }
  }

  /**
   * Start the system tick interval
   */
  startSystemTick() {
    if (this.tickInterval) return;
    
    this.isRunning = true;
    this.tickInterval = setInterval(() => {
      this.systemTick();
    }, this.config.tickRate);

    // Start autosave
    this.autosaveInterval = setInterval(() => {
      this.autosaveAll();
    }, this.config.autosaveInterval);
  }

  /**
   * Stop the system tick
   */
  stopSystemTick() {
    this.isRunning = false;
    
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    
    if (this.autosaveInterval) {
      clearInterval(this.autosaveInterval);
      this.autosaveInterval = null;
    }
  }

  /**
   * Autosave all active instances
   */
  async autosaveAll() {
    for (const [characterId, instance] of this.instances) {
      const storyContext = this.storyContexts.get(characterId);
      if (storyContext?.userId) {
        await this.saveProgress(
          storyContext.userId,
          characterId,
          storyContext.storyId
        );
      }
    }
  }

  /**
   * Shutdown the engine
   */
  async shutdown() {
  console.log('Shutting down ConsciousnessEngine...');
  
  // Stop system tick
  this.stopSystemTick();
  
  // Save all states
  await this.autosaveAll();
  
  // Cleanup instances
  for (const [characterId, instance] of this.instances) {
    if (instance.shutdown) {
      await instance.shutdown();
    }
  }
  
  this.instances.clear();
  this.isInitialized = false;
  
  this.emit('shutdown');
  console.log('ConsciousnessEngine shutdown complete');
}

  /**
   * Start monitoring a character consciousness
   */
  async startMonitoring(characterId, socketId) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }

    // Set up monitoring for this socket
    if (!this.monitoringSockets) {
      this.monitoringSockets = new Map();
    }
    
    this.monitoringSockets.set(socketId, {
      characterId,
      startTime: Date.now(),
      lastUpdate: Date.now()
    });

    // Start sending updates to this socket
    this.emit('monitoringStarted', {
      characterId,
      socketId,
      initialState: instance.getState()
    });

    return {
      success: true,
      message: `Monitoring started for ${characterId}`,
      characterId,
      socketId
    };
  }
/**
 * Start real-time broadcasting for active monitoring sockets
 * DISABLED: Only send updates on-demand or when state actually changes
 */
startRealTimeBroadcasting() {
  // DISABLED: No automatic polling/broadcasting
  // Users will request data via refresh button or state changes will trigger updates
  console.log('📴 Real-time broadcasting disabled - using on-demand updates only');
  return;
  
  // OLD CODE (disabled):
  // if (this.broadcastInterval) return;
  // this.broadcastInterval = setInterval(() => {
  //   this.broadcastToMonitoringSockets();
  // }, 10000); // Update every 10 seconds
}

/**
 * Stop real-time broadcasting
 */
stopRealTimeBroadcasting() {
  if (this.broadcastInterval) {
    clearInterval(this.broadcastInterval);
    this.broadcastInterval = null;
  }
}

/**
 * Broadcast consciousness updates to all monitoring sockets
 */
async broadcastToMonitoringSockets() {
  if (!this.monitoringSockets || this.monitoringSockets.size === 0) {
    return;
  }

  for (const [socketId, monitoring] of this.monitoringSockets) {
    try {
      const { characterId } = monitoring;
      const instance = this.instances.get(characterId);
      
      if (!instance) {
        // Character instance no longer exists, clean up
        this.monitoringSockets.delete(socketId);
        continue;
      }

      // Get current consciousness state
      const currentState = await this.getState(characterId);
      
      // FIXED: Send data in the structure the client expects
      // The client expects the consciousness data directly, not nested
      this.emit('consciousnessUpdate', {
        socketId,
        characterId,
        consciousness: {
          processes: currentState.processes || [],
          resources: currentState.consciousness?.resources || {
            cpu: { used: 0, total: 100, percentage: 0 },
            memory: { used: 0, total: 1024, available: 1024, percentage: 0 },
            threads: { used: 0, total: 16, percentage: 0 }
          },
          system_errors: currentState.system_errors || [],
          memory: currentState.consciousness?.memory || {},
          threads: currentState.threads || []
        },
        timestamp: Date.now(),
        type: 'real-time-update'
      });
      
      // Update last update time
      monitoring.lastUpdate = Date.now();
      
    } catch (error) {
      console.error(`Error broadcasting to socket ${socketId}:`, error);
      // Remove problematic socket
      this.monitoringSockets.delete(socketId);
    }
  }
}

/**
 * Broadcast updates only when state actually changes (on-demand)
 * This replaces the automatic 10-second polling with event-driven updates
 */
async broadcastStateChange(characterId, changeType = 'state-change') {
  if (!this.monitoringSockets || this.monitoringSockets.size === 0) {
    return;
  }

  console.log(`📡 Broadcasting state change for ${characterId} (${changeType})`);

  for (const [socketId, monitoring] of this.monitoringSockets) {
    try {
      if (monitoring.characterId !== characterId) {
        continue; // Only broadcast to sockets monitoring this specific character
      }

      const instance = this.instances.get(characterId);
      if (!instance) {
        this.monitoringSockets.delete(socketId);
        continue;
      }

      // Get current consciousness state
      const currentState = await this.getState(characterId);
      
      // Send data in the structure the client expects
      this.emit('consciousnessUpdate', {
        socketId,
        characterId,
        consciousness: {
          processes: currentState.processes || [],
          resources: currentState.consciousness?.resources || {
            cpu: { used: 0, total: 100, percentage: 0 },
            memory: { used: 0, total: 1024, available: 1024, percentage: 0 },
            threads: { used: 0, total: 16, percentage: 0 }
          },
          system_errors: currentState.system_errors || [],
          memory: currentState.consciousness?.memory || {},
          threads: currentState.threads || []
        },
        timestamp: Date.now(),
        type: changeType
      });
      
      monitoring.lastUpdate = Date.now();
      
    } catch (error) {
      console.error(`Error broadcasting state change to socket ${socketId}:`, error);
      this.monitoringSockets.delete(socketId);
    }
  }
}

/**
 * Enhanced startMonitoring method
 */
async startMonitoring(characterId, socketId) {
  const instance = this.instances.get(characterId);
  if (!instance) {
    throw new Error(`No consciousness loaded: ${characterId}`);
  }

  // Set up monitoring for this socket
  if (!this.monitoringSockets) {
    this.monitoringSockets = new Map();
  }
  
  this.monitoringSockets.set(socketId, {
    characterId,
    startTime: Date.now(),
    lastUpdate: Date.now()
  });

  // Start broadcasting if this is the first monitoring socket
  if (this.monitoringSockets.size === 1) {
    this.startRealTimeBroadcasting();
  }

  // Send initial state immediately
  const initialState = await this.getState(characterId);
  this.emit('monitoringStarted', {
    characterId,
    socketId,
    initialState: {
      consciousness: initialState.consciousness,
      processes: initialState.processes,
      system_errors: initialState.system_errors,
      threads: initialState.threads
    }
  });

  // Send first real-time update
  setTimeout(() => {
    this.emit('consciousnessUpdate', {
      socketId,
      characterId,
      state: {
        consciousness: initialState.consciousness,
        processes: initialState.processes,
        system_errors: initialState.system_errors,
        threads: initialState.threads
      },
      timestamp: Date.now(),
      type: 'initial-update'
    });
  }, 100);

  return {
    success: true,
    message: `Monitoring started for ${characterId}`,
    characterId,
    socketId
  };
}

/**
 * Enhanced stopMonitoring method
 */
async stopMonitoring(socketId) {
  console.log(`Stopping monitoring for socket: ${socketId}`);
  
  if (!this.monitoringSockets) return;
  
  const monitoring = this.monitoringSockets.get(socketId);
  if (monitoring) {
    this.monitoringSockets.delete(socketId);
    console.log(`Removed socket ${socketId} from monitoring. Remaining sockets: ${this.monitoringSockets.size}`);
    
    // Stop broadcasting if no more monitoring sockets
    if (this.monitoringSockets.size === 0) {
      console.log('No more monitoring sockets, stopping broadcast interval');
      this.stopRealTimeBroadcasting();
    }
    
    this.emit('monitoringStopped', {
      characterId: monitoring.characterId,
      socketId,
      duration: Date.now() - monitoring.startTime
    });
  }
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
  
  if (this.monitoringSockets) {
    this.monitoringSockets.clear();
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
   * Get processes for a character
   */
  async getProcesses(characterId) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }
    return instance.processManager.getProcessDataForFrontend();
  }

  /**
   * Get memory allocation for a character
   */
  async getMemory(characterId) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }
    return instance.memoryManager.getMemoryDataForFrontend();
  }

  /**
   * Get system errors for a character
   */
  async getErrors(characterId) {
    const instance = this.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }
    
    // Collect errors from all subsystems
    const errors = [];
    
    // Process errors
    const processIssues = instance.processManager.getDebuggableProcesses();
    processIssues.forEach(process => {
      process.issues.forEach(issue => {
        errors.push({
          type: 'process_error',
          source: process.name,
          severity: issue.severity,
          description: issue.description,
          timestamp: issue.timestamp
        });
      });
    });
    
    // Memory errors
    const memoryIssues = instance.memoryManager.getDebuggableMemoryIssues();
    
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
    
    // Emotional errors
    const emotionalIssues = instance.emotionalProcessor.getDebuggableEmotionalIssues();
    emotionalIssues.forEach(issue => {
      errors.push({
        type: 'emotional_error',
        source: 'EmotionalProcessor',
        severity: issue.severity,
        description: issue.description,
        timestamp: issue.timestamp
      });
    });
    
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
    }

    return result;
  }
}
