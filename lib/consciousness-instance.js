import { EventEmitter } from 'events';
import { ProcessManager } from './process-manager.js';
import { MemoryManager } from './memory-manager.js';
import { EmotionalProcessor } from './emotional-processor.js';

/**
 * Individual consciousness instance
 * Represents a single character's mental state
 */
export class ConsciousnessInstance extends EventEmitter {
  constructor(config) {
    super();
    
    // Core identity
    this.id = config.id;
    this.name = config.name;
    this.version = config.version;
    
    // Configuration
    this.config = {
      dynamicProcessing: config.dynamicProcessing ?? true,
      difficultyLevel: config.difficultyLevel ?? 'intermediate',
      debugMode: config.debugMode ?? false,
      tickRate: config.tickRate ?? 100
    };
    
    // System resources
    this.resources = {
      cpu: { ...config.systemResources.cpu },
      memory: { ...config.systemResources.memory },
      threads: { ...config.systemResources.threads }
    };
    
    // Current resource usage
    this.usage = {
      cpu: 0,
      memory: 0,
      threads: 0
    };
    
    // Subsystems
    this.processManager = new ProcessManager(this);
    this.memoryManager = new MemoryManager(this, config.memoryMap);
    this.emotionalProcessor = new EmotionalProcessor(this, config.emotionalStates);
    
    // State tracking
    this.state = {
      status: 'uninitialized',
      stability: 1.0,
      corruption: 0.0,
      uptime: 0,
      errors: [],
      lastUpdate: Date.now()
    };
    
    // History for rollback
    this.stateHistory = [];
    this.maxHistorySize = 10;
    
    // Reference to parent engine
    this.engine = config.engine;
  }

  /**
   * Initialize consciousness with starting state
   */
  async initialize(startingState = {}) {
    try {
      this.state.status = 'initializing';
      
      // Initialize subsystems
      await this.processManager.initialize(this.config.baseProcesses);
      await this.memoryManager.initialize();
      await this.emotionalProcessor.initialize(startingState.emotional);
      
      // Load starting processes
      if (startingState.activeProcesses) {
        for (const processName of startingState.activeProcesses) {
          await this.processManager.startProcess(processName);
        }
      }
      
      // Load memory fragments
      if (startingState.memoryFragments) {
        for (const fragment of startingState.memoryFragments) {
          await this.memoryManager.writeMemory(fragment.address, fragment.content);
        }
      }
      
      // Set initial stability and corruption
      this.state.stability = startingState.stability ?? 1.0;
      this.state.corruption = startingState.corruption ?? 0.0;
      
      this.state.status = 'running';
      this.emit('initialized', this.getState());
      
    } catch (error) {
      this.state.status = 'error';
      this.state.errors.push({
        timestamp: Date.now(),
        type: 'initialization_failure',
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Execute a debug action
   */
  async executeAction(action, parameters = {}) {
    // Validate action
    if (!this.isValidAction(action)) {
      throw new Error(`Invalid action: ${action}`);
    }
    
    // Check system stability
    if (this.state.stability < 0.1 && !parameters.force) {
      throw new Error('System too unstable for action execution');
    }
    
    // Save state for potential rollback
    this.saveStateSnapshot();
    
    try {
      let result = {};
      
      // Route action to appropriate subsystem
      switch (this.getActionCategory(action)) {
        case 'process':
          result = await this.processManager.executeAction(action, parameters);
          break;
          
        case 'memory':
          result = await this.memoryManager.executeAction(action, parameters);
          break;
          
        case 'emotional':
          result = await this.emotionalProcessor.executeAction(action, parameters);
          break;
          
        case 'system':
          result = await this.executeSystemAction(action, parameters);
          break;
          
        default:
          throw new Error(`Unknown action category for: ${action}`);
      }
      
      // Update resource usage
      await this.updateResourceUsage();
      
      // Check for system instability
      this.checkSystemHealth();
      
      return {
        success: true,
        action,
        result,
        state: this.getState(),
        timestamp: Date.now()
      };
      
    } catch (error) {
      // Log error
      this.state.errors.push({
        timestamp: Date.now(),
        action,
        type: 'action_execution',
        message: error.message
      });
      
      // Potentially trigger error cascade
      if (this.shouldCascadeError(error)) {
        await this.triggerErrorCascade(error);
      }
      
      throw error;
    }
  }

  /**
   * System tick - update consciousness state
   */
  async tick() {
    const updates = {
      stateChanges: [],
      processUpdates: [],
      memoryEvents: [],
      emotionalShifts: [],
      errors: [],
      hasChanges: false
    };
    
    try {
      // Update subsystems
      const processUpdates = await this.processManager.tick();
      const memoryEvents = await this.memoryManager.tick();
      const emotionalShifts = await this.emotionalProcessor.tick();
      
      // Aggregate updates
      updates.processUpdates = processUpdates;
      updates.memoryEvents = memoryEvents;
      updates.emotionalShifts = emotionalShifts;
      
      // Update resource usage
      await this.updateResourceUsage();
      
      // Calculate stability changes
      const stabilityDelta = this.calculateStabilityDelta();
      if (Math.abs(stabilityDelta) > 0.001) {
        this.state.stability = Math.max(0, Math.min(1, this.state.stability + stabilityDelta));
        updates.stateChanges.push({
          type: 'stability',
          value: this.state.stability,
          delta: stabilityDelta
        });
      }
      
      // Check for corruption spread
      const corruptionDelta = this.calculateCorruptionSpread();
      if (corruptionDelta > 0) {
        this.state.corruption = Math.min(1, this.state.corruption + corruptionDelta);
        updates.stateChanges.push({
          type: 'corruption',
          value: this.state.corruption,
          delta: corruptionDelta
        });
      }
      
      // Update uptime
      this.state.uptime += this.config.tickRate;
      
      // Clean old errors
      this.cleanErrorLog();
      
      updates.hasChanges = updates.stateChanges.length > 0 ||
                          updates.processUpdates.length > 0 ||
                          updates.memoryEvents.length > 0 ||
                          updates.emotionalShifts.length > 0;
      
    } catch (error) {
      updates.errors.push({
        timestamp: Date.now(),
        type: 'tick_error',
        message: error.message
      });
    }
    
    this.state.lastUpdate = Date.now();
    return updates;
  }

  /**
   * Get current consciousness state
   */
  getState() {
    return {
      id: this.id,
      name: this.name,
      status: this.state.status,
      stability: this.state.stability,
      corruption: this.state.corruption,
      uptime: this.state.uptime,
      resources: {
        cpu: {
          used: this.usage.cpu,
          total: 100,
          percentage: this.usage.cpu
        },
        memory: {
          used: this.usage.memory,
          total: this.resources.memory.total,
          percentage: (this.usage.memory / this.resources.memory.total) * 100
        },
        threads: {
          used: this.usage.threads,
          total: this.resources.threads.max,
          percentage: (this.usage.threads / this.resources.threads.max) * 100
        }
      },
      processes: this.processManager.getState(),
      memory: this.memoryManager.getState(),
      emotional: this.emotionalProcessor.getState(),
      errors: this.state.errors.slice(-5) // Last 5 errors
    };
  }

  /**
   * Capture complete state for save/restore
   */
  captureState() {
    return {
      core: { ...this.state },
      resources: { ...this.usage },
      processes: this.processManager.captureState(),
      memory: this.memoryManager.captureState(),
      emotional: this.emotionalProcessor.captureState(),
      timestamp: Date.now()
    };
  }

  /**
   * Restore consciousness from saved state
   */
  async restoreState(savedState) {
    try {
      this.state = { ...savedState.core };
      this.usage = { ...savedState.resources };
      
      await this.processManager.restoreState(savedState.processes);
      await this.memoryManager.restoreState(savedState.memory);
      await this.emotionalProcessor.restoreState(savedState.emotional);
      
      this.emit('stateRestored', savedState);
      
    } catch (error) {
      this.state.status = 'error';
      throw new Error(`State restoration failed: ${error.message}`);
    }
  }

  /**
   * Modify emotional state
   */
  async modifyEmotionalState(emotion, modifier, duration) {
    const result = await this.emotionalProcessor.modifyEmotion(emotion, modifier, duration);
    
    // Emotional changes affect system stability
    const stabilityImpact = Math.abs(modifier) * 0.1;
    this.state.stability = Math.max(0, this.state.stability - stabilityImpact);
    
    return result;
  }

  /**
   * Modify process state
   */
  async modifyProcess(processName, action, parameters) {
    return await this.processManager.modifyProcess(processName, action, parameters);
  }

  /**
   * Modify memory
   */
  async modifyMemory(action, address, data) {
    return await this.memoryManager.modifyMemory(action, address, data);
  }

  /**
   * Execute system-level actions
   */
  async executeSystemAction(action, parameters) {
    switch (action) {
      case 'reboot':
        return await this.reboot(parameters);
        
      case 'stabilize':
        return await this.stabilize(parameters);
        
      case 'defragment':
        return await this.defragment(parameters);
        
      case 'analyze':
        return this.analyze(parameters);
        
      default:
        throw new Error(`Unknown system action: ${action}`);
    }
  }

  /**
   * System reboot
   */
  async reboot(parameters = {}) {
    const rebootTime = parameters.quick ? 1000 : 5000;
    
    this.state.status = 'rebooting';
    
    // Stop all processes
    await this.processManager.stopAll();
    
    // Clear volatile memory
    await this.memoryManager.clearVolatile();
    
    // Simulate reboot time
    await new Promise(resolve => setTimeout(resolve, rebootTime));
    
    // Restart core processes
    await this.processManager.restartCore();
    
    // Reset stability
    this.state.stability = 0.8;
    this.state.corruption = Math.max(0, this.state.corruption - 0.1);
    this.state.status = 'running';
    
    return {
      action: 'reboot',
      duration: rebootTime,
      stabilityGain: 0.3,
      corruptionReduction: 0.1
    };
  }

  /**
   * Stabilize system
   */
  async stabilize(parameters = {}) {
    const intensity = parameters.intensity ?? 0.5;
    const duration = parameters.duration ?? 3000;
    
    this.state.status = 'stabilizing';
    
    // Reduce process loads
    await this.processManager.throttleAll(1 - intensity);
    
    // Wait for stabilization
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Calculate stability gain
    const stabilityGain = intensity * 0.3;
    this.state.stability = Math.min(1, this.state.stability + stabilityGain);
    
    // Restore process loads
    await this.processManager.throttleAll(1);
    
    this.state.status = 'running';
    
    return {
      action: 'stabilize',
      intensity,
      duration,
      stabilityGain,
      finalStability: this.state.stability
    };
  }

  /**
   * Defragment memory
   */
  async defragment(parameters = {}) {
    const aggressive = parameters.aggressive ?? false;
    
    this.state.status = 'defragmenting';
    
    const result = await this.memoryManager.defragment(aggressive);
    
    // Defragmentation improves stability
    this.state.stability = Math.min(1, this.state.stability + 0.1);
    
    this.state.status = 'running';
    
    return {
      action: 'defragment',
      ...result,
      stabilityGain: 0.1
    };
  }

  /**
   * Analyze system state
   */
  analyze(parameters = {}) {
    const depth = parameters.depth ?? 'standard';
    
    const analysis = {
      timestamp: Date.now(),
      depth,
      findings: []
    };
    
    // Check for process anomalies
    const processAnomalies = this.processManager.detectAnomalies();
    if (processAnomalies.length > 0) {
      analysis.findings.push({
        type: 'process_anomaly',
        severity: 'medium',
        details: processAnomalies
      });
    }
    
    // Check memory fragmentation
    const fragmentation = this.memoryManager.getFragmentation();
    if (fragmentation > 0.3) {
      analysis.findings.push({
        type: 'memory_fragmentation',
        severity: fragmentation > 0.6 ? 'high' : 'medium',
        value: fragmentation,
        recommendation: 'Run defragmentation'
      });
    }
    
    // Check emotional volatility
    const volatility = this.emotionalProcessor.getVolatility();
    if (volatility > 0.5) {
      analysis.findings.push({
        type: 'emotional_volatility',
        severity: volatility > 0.8 ? 'high' : 'medium',
        value: volatility,
        recommendation: 'Stabilize emotional processes'
      });
    }
    
    // Check resource pressure
    if (this.usage.cpu > 80) {
      analysis.findings.push({
        type: 'cpu_pressure',
        severity: this.usage.cpu > 90 ? 'high' : 'medium',
        value: this.usage.cpu,
        recommendation: 'Reduce process load'
      });
    }
    
    // Deep analysis
    if (depth === 'deep') {
      analysis.memoryMap = this.memoryManager.generateMemoryMap();
      analysis.processTree = this.processManager.generateProcessTree();
      analysis.emotionalProfile = this.emotionalProcessor.generateProfile();
    }
    
    return analysis;
  }

  /**
   * Update resource usage from subsystems
   */
  async updateResourceUsage() {
    const processUsage = this.processManager.getResourceUsage();
    const memoryUsage = this.memoryManager.getResourceUsage();
    const emotionalUsage = this.emotionalProcessor.getResourceUsage();
    
    this.usage.cpu = Math.min(100, 
      processUsage.cpu + emotionalUsage.cpu
    );
    
    this.usage.memory = Math.min(this.resources.memory.total,
      processUsage.memory + memoryUsage.memory + emotionalUsage.memory
    );
    
    this.usage.threads = Math.min(this.resources.threads.max,
      processUsage.threads + emotionalUsage.threads
    );
  }

  /**
   * Calculate stability delta based on current state
   */
  calculateStabilityDelta() {
    let delta = 0;
    
    // High resource usage decreases stability
    if (this.usage.cpu > 90) delta -= 0.01;
    else if (this.usage.cpu > 80) delta -= 0.005;
    
    // Process errors decrease stability
    const recentErrors = this.state.errors.filter(
      e => Date.now() - e.timestamp < 5000
    ).length;
    delta -= recentErrors * 0.02;
    
    // Emotional intensity affects stability
    const emotionalIntensity = this.emotionalProcessor.getTotalIntensity();
    if (emotionalIntensity > 0.8) delta -= 0.01;
    
    // Natural recovery when stable
    if (this.usage.cpu < 50 && recentErrors === 0) {
      delta += 0.003;
    }
    
    return delta;
  }

  /**
   * Calculate corruption spread
   */
  calculateCorruptionSpread() {
    if (this.state.corruption === 0) return 0;
    
    let spread = 0;
    
    // Corruption spreads faster at low stability
    if (this.state.stability < 0.3) {
      spread = this.state.corruption * 0.01;
    } else if (this.state.stability < 0.5) {
      spread = this.state.corruption * 0.005;
    }
    
    // Memory errors accelerate corruption
    const memoryErrors = this.memoryManager.getCorruptedRegions().length;
    spread += memoryErrors * 0.005;
    
    return spread;
  }

  /**
   * Check if error should cascade
   */
  shouldCascadeError(error) {
    // Critical errors always cascade
    if (error.severity === 'critical') return true;
    
    // Cascade if system unstable
    if (this.state.stability < 0.3) return true;
    
    // Cascade if high corruption
    if (this.state.corruption > 0.7) return true;
    
    return false;
  }

  /**
   * Trigger error cascade
   */
  async triggerErrorCascade(error) {
    // Affect related processes
    const relatedProcesses = this.processManager.getRelatedProcesses(error.source);
    for (const process of relatedProcesses) {
      await this.processManager.destabilizeProcess(process, 0.2);
    }
    
    // Corrupt nearby memory
    if (error.memoryAddress) {
      await this.memoryManager.corruptRegion(error.memoryAddress, 0.1);
    }
    
    // Intensify emotions
    await this.emotionalProcessor.intensifyAll(0.1);
    
    // Reduce stability
    this.state.stability = Math.max(0, this.state.stability - 0.1);
  }

  /**
   * Check overall system health
   */
  checkSystemHealth() {
    // Critical failure conditions
    if (this.state.stability < 0.1) {
      this.state.status = 'critical';
      this.emit('criticalState', this.getState());
    }
    
    // Total corruption
    if (this.state.corruption >= 1) {
      this.state.status = 'corrupted';
      this.emit('totalCorruption', this.getState());
    }
    
    // Resource exhaustion
    if (this.usage.memory >= this.resources.memory.total) {
      this.state.status = 'memory_exhausted';
      this.emit('resourceExhaustion', { type: 'memory' });
    }
  }

  /**
   * Validate action
   */
  isValidAction(action) {
    const validActions = [
      // Process actions
      'ps', 'kill', 'nice', 'renice', 'suspend', 'resume',
      // Memory actions
      'free', 'dump', 'peek', 'poke', 'protect', 'unprotect',
      // Emotional actions
      'calm', 'intensify', 'balance', 'suppress',
      // System actions
      'reboot', 'stabilize', 'defragment', 'analyze'
    ];
    
    return validActions.includes(action);
  }

  /**
   * Get action category
   */
  getActionCategory(action) {
    const categories = {
      process: ['ps', 'kill', 'nice', 'renice', 'suspend', 'resume'],
      memory: ['free', 'dump', 'peek', 'poke', 'protect', 'unprotect'],
      emotional: ['calm', 'intensify', 'balance', 'suppress'],
      system: ['reboot', 'stabilize', 'defragment', 'analyze']
    };
    
    for (const [category, actions] of Object.entries(categories)) {
      if (actions.includes(action)) return category;
    }
    
    return 'unknown';
  }

  /**
   * Save state snapshot for rollback
   */
  saveStateSnapshot() {
    const snapshot = this.captureState();
    this.stateHistory.push(snapshot);
    
    // Limit history size
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Clean old errors from log
   */
  cleanErrorLog() {
    const maxAge = 60000; // 1 minute
    const now = Date.now();
    
    this.state.errors = this.state.errors.filter(
      error => now - error.timestamp < maxAge
    );
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      uptime: this.state.uptime,
      stability: this.state.stability,
      corruption: this.state.corruption,
      resourceUsage: {
        cpu: this.usage.cpu,
        memory: `${this.usage.memory}/${this.resources.memory.total}MB`,
        threads: `${this.usage.threads}/${this.resources.threads.max}`
      },
      processes: {
        total: this.processManager.getProcessCount(),
        running: this.processManager.getRunningCount(),
        errors: this.processManager.getErrorCount()
      },
      memory: {
        fragmentation: this.memoryManager.getFragmentation(),
        corrupted: this.memoryManager.getCorruptedRegions().length
      },
      emotional: {
        primary: this.emotionalProcessor.getPrimaryEmotion(),
        intensity: this.emotionalProcessor.getTotalIntensity(),
        volatility: this.emotionalProcessor.getVolatility()
      }
    };
  }

  /**
   * Shutdown consciousness
   */
  async shutdown() {
    this.state.status = 'shutting_down';
    
    // Save final state
    const finalState = this.captureState();
    
    // Shutdown subsystems
    await this.processManager.shutdown();
    await this.memoryManager.shutdown();
    await this.emotionalProcessor.shutdown();
    
    this.state.status = 'shutdown';
    this.emit('shutdown', finalState);
  }
}