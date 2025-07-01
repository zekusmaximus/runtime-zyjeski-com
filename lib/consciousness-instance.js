import { EventEmitter } from 'events';
import ProcessManager from './ProcessManager.js';
import EmotionalState from './instance/emotional-state.js';
import MemoryState from './instance/memory-state.js';
import ActionRouter from './instance/action-router.js';
import SnapshotManager from './instance/snapshot-manager.js';
import InstanceEvents from './instance/instance-events.js';
import * as InstanceUtils from './instance/instance-utils.js';

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
    this.memoryState = new MemoryState(this, config.memoryMap);
    this.emotionalState = new EmotionalState(this, config.emotionalStates);
    this.events = new InstanceEvents(this);
    this.snapshotManager = new SnapshotManager(this);
    this.actionRouter = new ActionRouter(this);
    
    // State tracking
    this.state = {
      status: 'uninitialized',
      stability: 1.0,
      corruption: 0.0,
      uptime: 0,
      errors: [],
      lastUpdate: Date.now()
    };
    
    
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
      await this.memoryState.initialize();
      await this.emotionalState.initialize(startingState.emotional);
      
      // Load starting processes
      if (startingState.activeProcesses) {
        for (const processName of startingState.activeProcesses) {
          await this.processManager.startProcess(processName);
        }
      }
      
      // Load memory fragments
      if (startingState.memoryFragments) {
        for (const fragment of startingState.memoryFragments) {
          await this.memoryState.manager.writeMemory(fragment.address, fragment.content);
        }
      }

      // Load initial errors from character configuration
      if (startingState.initialErrors) {
        for (const error of startingState.initialErrors) {
          this.state.errors.push({
            timestamp: Date.now(),
            type: error.type,
            message: error.message,
            severity: error.severity,
            process: error.process
          });
        }
      }

      // Set initial stability and corruption
      this.state.stability = startingState.stability ?? 1.0;
      this.state.corruption = startingState.corruption ?? 0.0;
      
      this.state.status = 'running';
      this.events.initialized(this.getState());
      
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
    return this.actionRouter.execute(action, parameters);
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
      const memoryEvents = await this.memoryState.tick();
      const emotionalShifts = await this.emotionalState.tick();
      
      // Aggregate updates
      updates.processUpdates = processUpdates;
      updates.memoryEvents = memoryEvents;
      updates.emotionalShifts = emotionalShifts;
      
      // Update resource usage
      await InstanceUtils.updateResourceUsage(this);
      
      // Calculate stability changes
      const stabilityDelta = InstanceUtils.calculateStabilityDelta(this);
      if (Math.abs(stabilityDelta) > 0.001) {
        this.state.stability = Math.max(0, Math.min(1, this.state.stability + stabilityDelta));
        updates.stateChanges.push({
          type: 'stability',
          value: this.state.stability,
          delta: stabilityDelta
        });
      }
      
      // Check for corruption spread
      const corruptionDelta = InstanceUtils.calculateCorruptionSpread(this);
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
      InstanceUtils.cleanErrorLog(this);
      
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
    return this.snapshotManager.getState();
  }


  /**
   * Capture complete state for save/restore
   */
  captureState() {
    return this.snapshotManager.capture();
  }

  /**
   * Restore consciousness from saved state
   */
  async restoreState(savedState) {
    try {
      await this.snapshotManager.restore(savedState);
    } catch (error) {
      this.state.status = 'error';
      throw new Error(`State restoration failed: ${error.message}`);
    }
  }

  /**
   * Modify emotional state
   */
  async modifyEmotionalState(emotion, modifier, duration) {
    const result = await this.emotionalState.modifyEmotion(emotion, modifier, duration);
    
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
    return await this.memoryState.modifyMemory(action, address, data);
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
    await this.memoryState.clearVolatile();
    
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
    
    const result = await this.memoryState.defragment(aggressive);
    
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
    const fragmentation = this.memoryState.getFragmentation();
    if (fragmentation > 0.3) {
      analysis.findings.push({
        type: 'memory_fragmentation',
        severity: fragmentation > 0.6 ? 'high' : 'medium',
        value: fragmentation,
        recommendation: 'Run defragmentation'
      });
    }
    
    // Check emotional volatility
    const volatility = this.emotionalState.getVolatility();
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
      analysis.memoryMap = this.memoryState.generateMemoryMap();
      analysis.processTree = this.processManager.generateProcessTree();
      analysis.emotionalProfile = this.emotionalState.generateProfile();
    }
    
    return analysis;
  }

  getStatistics() {
    return InstanceUtils.getStatistics(this);
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
    await this.memoryState.manager.shutdown();
    await this.emotionalState.processor.shutdown();
    
    this.state.status = 'shutdown';
    this.events.shutdown(finalState);
  }
}