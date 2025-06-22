const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class ConsciousnessEngine extends EventEmitter {
  constructor() {
    super();
    this.activeStates = new Map();
    this.simulators = new Map();
    this.updateIntervals = new Map();
    this.debugSessions = new Map();
    
    // CHANGED: Only update on user interactions by default
    this.autoUpdateEnabled = false;
    this.updateFrequency = 2000; // Slower updates when auto-enabled
  }

  async loadCharacter(characterId) {
    try {
      const filePath = path.join(__dirname, '../data/characters', `${characterId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const character = JSON.parse(data);
      
      // Initialize consciousness simulation
      const simulator = new ConsciousnessSimulator(character, this);
      this.simulators.set(characterId, simulator);
      this.activeStates.set(characterId, character);
      
      console.log(`Loaded character: ${character.name}`);
      return character;
    } catch (error) {
      throw new Error(`Failed to load character ${characterId}: ${error.message}`);
    }
  }

  async getState(characterId) {
    if (!this.activeStates.has(characterId)) {
      await this.loadCharacter(characterId);
    }
    
    const state = this.activeStates.get(characterId);
    const simulator = this.simulators.get(characterId);
    
    if (simulator) {
      // Get real-time consciousness data
      state.consciousness = simulator.getCurrentState();
    }
    
    return state;
  }

  async updateState(characterId, updates) {
    if (!this.activeStates.has(characterId)) {
      await this.loadCharacter(characterId);
    }
    
    const simulator = this.simulators.get(characterId);
    if (simulator) {
      simulator.applyPlayerIntervention(updates);
    }
    
    const state = await this.getState(characterId);
    
    // CHANGED: Always emit on user-triggered updates
    this.emit('consciousness-updated', {
      characterId,
      state: state.consciousness,
      timestamp: new Date().toISOString(),
      type: 'user-triggered'
    });
    
    return state;
  }

  startMonitoring(characterId, socketId) {
    const simulator = this.simulators.get(characterId);
    if (!simulator) {
      throw new Error(`Character ${characterId} not loaded`);
    }
  
    // CHANGED: Start simulation but don't auto-update
    simulator.startSimulation();
    
    // REMOVED: Automatic real-time updates
    // Only send initial state
    this.getState(characterId).then(state => {
      this.emit('real-time-update', {
        socketId,
        characterId,
        state: state.consciousness,
        timestamp: new Date().toISOString(),
        type: 'initial'
      });
    });
    
    console.log(`Started monitoring ${characterId} for socket ${socketId}`);
  }

  stopMonitoring(characterId, socketId) {
    // CHANGED: Remove automatic update intervals
    if (this.updateIntervals.has(socketId)) {
      clearInterval(this.updateIntervals.get(socketId));
      this.updateIntervals.delete(socketId);
    }
    
    // Check if anyone else is monitoring this character
    const stillMonitored = Array.from(this.updateIntervals.values()).length > 0;
    
    if (!stillMonitored) {
      const simulator = this.simulators.get(characterId);
      if (simulator) {
        // CHANGED: Keep simulation running but pause auto-updates
        simulator.pauseAutoUpdates();
      }
    }
    
    console.log(`Stopped monitoring ${characterId} for socket ${socketId}`);
  }

  // ADDED: Method to trigger manual updates
  triggerUpdate(characterId, reason = 'manual') {
    const simulator = this.simulators.get(characterId);
    if (simulator) {
      simulator.triggerUpdate(reason);
    }
  }

  // ADDED: Enable/disable periodic simulation updates
  setAutoUpdates(characterId, enabled) {
    const simulator = this.simulators.get(characterId);
    if (simulator) {
      if (enabled) {
        simulator.enableAutoUpdates();
      } else {
        simulator.pauseAutoUpdates();
      }
    }
  }

  // Debug command execution - CHANGED: Always trigger update after debug command
  async executeDebugCommand(characterId, command, args = {}) {
    const simulator = this.simulators.get(characterId);
    if (!simulator) {
      throw new Error(`Character ${characterId} not loaded`);
    }
    
    let result = {};
    
    switch (command) {
      case 'ps':
        result.processes = simulator.getProcesses();
        break;
        
      case 'top':
        result.processes = simulator.getProcesses()
          .sort((a, b) => (b.cpu_usage || 0) - (a.cpu_usage || 0))
          .slice(0, 10);
        result.resources = simulator.getResources();
        break;
        
      case 'kill':
        if (!args.pid) {
          throw new Error('PID required for kill command');
        }
        result = simulator.killProcess(parseInt(args.pid));
        // ADDED: Trigger update after process termination
        this.triggerUpdate(characterId, 'process-killed');
        break;

      case 'attach':
        // ADDED: Handle attach command
        result = {
          success: true,
          message: `Attached to ${simulator.character.name}'s consciousness`,
          characterId: characterId
        };
        this.triggerUpdate(characterId, 'debugger-attached');
        break;
        
      case 'monitor':
        result.memory = simulator.getMemoryMap();
        result.errors = simulator.getSystemErrors();
        result.resources = simulator.getResources();
        break;
        
      case 'step_into':
        result = simulator.stepInto();
        this.triggerUpdate(characterId, 'debugger-step');
        break;
        
      case 'step_over':
        result = simulator.stepOver();
        this.triggerUpdate(characterId, 'debugger-step');
        break;
        
      case 'continue':
        result = simulator.continue();
        this.triggerUpdate(characterId, 'debugger-continue');
        break;
        
      case 'break_all':
        result = simulator.breakAll();
        this.triggerUpdate(characterId, 'debugger-break');
        break;

      case 'memory':
        // ADDED: Memory command
        result.memory = simulator.getMemoryMap();
        result.allocation = simulator.getMemoryAllocation();
        break;

      case 'errors':
        // ADDED: Errors command
        result.errors = simulator.getSystemErrors();
        break;

      case 'threads':
        // ADDED: Threads command
        result.threads = simulator.getThreads();
        break;

      case 'debug':
        // ADDED: Debug command
        result = {
          success: true,
          message: `Debug mode activated for ${simulator.character.name}`,
          sessionId: `debug-${characterId}-${Date.now()}`
        };
        break;
        
      default:
        throw new Error(`Unknown debug command: ${command}`);
    }
    
    this.emit('debug-command-executed', {
      characterId,
      command,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }

  // Player intervention - CHANGED: Always trigger update
  async applyPlayerIntervention(characterId, intervention) {
    const simulator = this.simulators.get(characterId);
    if (!simulator) {
      throw new Error(`Character ${characterId} not loaded`);
    }
    
    const result = simulator.applyPlayerIntervention(intervention);
    
    // ADDED: Always trigger update after intervention
    this.triggerUpdate(characterId, 'player-intervention');
    
    this.emit('intervention-applied', {
      characterId,
      intervention,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }

  // Cleanup methods
  stopCharacter(characterId) {
    const simulator = this.simulators.get(characterId);
    if (simulator) {
      simulator.stopSimulation();
    }
    
    // Clear all intervals for this character
    for (const [socketId, interval] of this.updateIntervals.entries()) {
      const socketInfo = this.connectedSockets?.get(socketId);
      if (socketInfo && socketInfo.characterId === characterId) {
        clearInterval(interval);
        this.updateIntervals.delete(socketId);
      }
    }
    
    this.simulators.delete(characterId);
    this.activeStates.delete(characterId);
  }

  getAllActiveCharacters() {
    return Array.from(this.activeStates.keys());
  }
}

class ConsciousnessSimulator {
  constructor(character, engine) {
    this.character = character;
    this.engine = engine;
    this.isSimulating = false;
    this.simulationInterval = null;
    this.debugMode = false;
    
    // ADDED: Control automatic updates
    this.autoUpdatesEnabled = false;
    this.autoUpdateInterval = null;
    
    // Initialize simulation state from character data
    this.state = {
      processes: [...(character.consciousness.processes || [])],
      memory: {...(character.consciousness.memory || {})},
      threads: [...(character.consciousness.threads || [])],
      errors: [...(character.consciousness.system_errors || [])],
      resources: {...(character.consciousness.resources || {})},
      debug_hooks: [...(character.consciousness.debug_hooks || [])]
    };
    
    // CHANGED: Slower simulation parameters
    this.simulationSpeed = 5000; // 5 seconds for background changes
    this.memoryLeakRate = 0.05; // Slower memory leak
    this.cpuFluctuationRange = 2; // Smaller CPU fluctuations
    this.errorGenerationChance = 0.01; // 1% chance per tick
    
    console.log(`Initialized consciousness simulator for ${character.name}`);
  }

  startSimulation() {
    if (this.isSimulating) return;
    
    this.isSimulating = true;
    
    // CHANGED: Background simulation runs slower and doesn't emit updates
    this.simulationInterval = setInterval(() => {
      this.backgroundTick();
    }, this.simulationSpeed);
    
    console.log(`Started consciousness simulation for ${this.character.name}`);
  }

  stopSimulation() {
    if (!this.isSimulating) return;
    
    this.isSimulating = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    
    this.pauseAutoUpdates();
    
    console.log(`Stopped consciousness simulation for ${this.character.name}`);
  }

  // ADDED: Enable automatic periodic updates
  enableAutoUpdates() {
    if (this.autoUpdatesEnabled) return;
    
    this.autoUpdatesEnabled = true;
    this.autoUpdateInterval = setInterval(() => {
      this.triggerUpdate('auto-update');
    }, 3000); // Every 3 seconds when enabled
    
    console.log(`Enabled auto-updates for ${this.character.name}`);
  }

  // ADDED: Pause automatic updates
  pauseAutoUpdates() {
    if (!this.autoUpdatesEnabled) return;
    
    this.autoUpdatesEnabled = false;
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
    }
    
    console.log(`Paused auto-updates for ${this.character.name}`);
  }

  // CHANGED: Background simulation that doesn't emit updates
  backgroundTick() {
    // Only update state internally, don't emit
    this.updateProcesses();
    this.updateMemory();
    this.updateResources();
    this.updateThreads();
    this.generateErrors();
  }

  // ADDED: Manual update trigger
  triggerUpdate(reason = 'manual') {
    // Run a simulation tick and emit the update
    this.simulationTick();
    
    this.engine.emit('consciousness-updated', {
      characterId: this.character.id,
      state: this.getCurrentState(),
      timestamp: new Date().toISOString(),
      type: 'triggered-update',
      reason: reason
    });
  }

  // CHANGED: Full simulation tick for triggered updates
  simulationTick() {
    this.updateProcesses();
    this.updateMemory();
    this.updateResources();
    this.updateThreads();
    this.generateErrors();
    this.checkDebugHooks();
  }

  updateProcesses() {
    this.state.processes.forEach(process => {
      if (process.status === 'terminated') return;
      
      // Simulate CPU fluctuation
      const baseCpu = process.cpu_usage || 0;
      process.cpu_usage = Math.max(0, Math.min(100, 
        baseCpu + (Math.random() - 0.5) * this.cpuFluctuationRange
      ));
      
      // Simulate memory leaks for grief-related processes
      if (process.name.toLowerCase().includes('grief')) {
        process.memory_mb += this.memoryLeakRate * (1 + Math.random());
        
        // Add memory leak error if it gets too high
        if (process.memory_mb > 800 && Math.random() < 0.1) {
          this.addError({
            type: 'MEMORY_LEAK_DETECTED',
            message: `${process.name} consuming excessive memory - ${Math.round(process.memory_mb)}MB`,
            severity: 'critical',
            related_process: process.pid
          });
        }
      }
      
      // Simulate infinite loops for search processes
      if (process.name.toLowerCase().includes('search')) {
        if (Math.random() < 0.3) {
          process.cpu_usage = Math.max(process.cpu_usage, 60 + Math.random() * 30);
        }
      }
      
      // Update last activity
      process.last_activity = new Date().toISOString();
    });
  }

  updateMemory() {
    // Memory access simulation
    Object.values(this.state.memory).forEach(block => {
      if (block.protected && Math.random() < 0.02) {
        // Occasional access to protected memory
        block.access_count++;
        block.last_accessed = new Date().toISOString();
        
        if (Math.random() < 0.1) {
          this.addError({
            type: 'SEGMENTATION_FAULT',
            message: `Attempted to access protected memory region: ${block.description}`,
            severity: 'warning'
          });
        }
      }
    });
  }

  updateResources() {
    // Resource fluctuation
    if (this.state.resources.attention) {
      const attention = this.state.resources.attention;
      attention.current = Math.max(0, Math.min(attention.max,
        attention.current + (Math.random() - 0.5) * 1
      ));
    }
    
    if (this.state.resources.emotional_energy) {
      const energy = this.state.resources.emotional_energy;
      energy.current = Math.max(0, Math.min(energy.max,
        energy.current + (Math.random() - 0.5) * 0.5
      ));
    }
  }

  updateThreads() {
    this.state.threads.forEach(thread => {
      if (thread.status === 'terminated') return;
      
      // Random thread activity
      if (Math.random() < 0.1) {
        thread.status = thread.status === 'active' ? 'idle' : 'active';
        thread.last_activity = new Date().toISOString();
      }
    });
  }

  generateErrors() {
    // Reduced error generation
    if (Math.random() < this.errorGenerationChance) {
      const errorTypes = [
        'MINOR_MEMORY_FRAGMENTATION',
        'TEMPORARY_PROCESSING_DELAY',
        'BACKGROUND_THREAD_WARNING'
      ];
      
      const newError = {
        type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
        message: `Background process issue detected`,
        timestamp: new Date().toISOString(),
        severity: 'info',
        auto_generated: true
      };
      
      this.addError(newError);
    }
  }

  checkDebugHooks() {
    // Check for debug hooks and conditions
    this.state.debug_hooks.forEach(hook => {
      if (hook.condition && this.evaluateCondition(hook.condition)) {
        this.engine.emit('debug-hook-triggered', {
          characterId: this.character.id,
          hook: hook,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  // Player intervention methods
  applyPlayerIntervention(intervention) {
  console.log('Applying intervention:', intervention);
  
  switch (intervention.type) {
    case 'optimize_process':
      return this.optimizeProcess(intervention.pid, intervention.parameters);
    case 'restart_process':
      return this.restartProcess(intervention.pid);
    case 'kill_process':
      return this.killProcess(intervention.pid);
    case 'process_optimization':
      return this.optimizeProcess(intervention.target, intervention.parameters);
    case 'memory_cleanup':
      return this.cleanupMemory(intervention.parameters);
    case 'resource_reallocation':
      return this.reallocateResources(intervention.parameters);
    case 'error_resolution':
      return this.resolveError(intervention.target);
    case 'adjust_resource':
      return this.adjustResource(intervention.resource_type, intervention.amount);
    default:
      throw new Error(`Unknown intervention type: ${intervention.type}`);
  }
}

  optimizeProcess(pidOrName, parameters = {}) {
  // Handle both PID and process name
  const process = typeof pidOrName === 'number' 
    ? this.state.processes.find(p => p.pid === pidOrName)
    : this.state.processes.find(p => p.name === pidOrName);
  
  if (!process) {
    throw new Error(`Process ${pidOrName} not found`);
  }
  
  // Apply optimizations
  if (parameters.memory_limit && process.memory_mb > parameters.memory_limit) {
    process.memory_mb = Math.max(parameters.memory_limit, 50); // Minimum 50MB
    this.addSystemMessage(`Memory optimized for ${process.name}: ${process.memory_mb}MB`);
  }
  
  if (parameters.cpu_limit && process.cpu_usage > parameters.cpu_limit) {
    process.cpu_usage = Math.max(parameters.cpu_limit, 5); // Minimum 5%
    this.addSystemMessage(`CPU optimized for ${process.name}: ${process.cpu_usage}%`);
  }
  
  // Update process status
  process.status = 'optimized';
  process.last_optimized = new Date().toISOString();
  
  return { 
    success: true, 
    message: `Process ${process.name} optimized successfully`,
    process: process
  };
}

// ADD these new methods AFTER the existing optimizeProcess method:
restartProcess(pid) {
  const process = this.state.processes.find(p => p.pid === pid);
  if (!process) {
    throw new Error(`Process ${pid} not found`);
  }
  
  // Restart process - reset some values
  process.status = 'running';
  process.cpu_usage = Math.max(process.cpu_usage * 0.7, 5); // Reduce CPU usage
  process.memory_mb = Math.max(process.memory_mb * 0.8, 50); // Reduce memory
  process.last_restart = new Date().toISOString();
  
  this.addSystemMessage(`Process ${process.name} restarted successfully`);
  
  return { 
    success: true, 
    message: `Process ${pid} restarted`,
    process: process
  };
}

adjustResource(resourceType, amount) {
  if (!this.state.resources[resourceType]) {
    throw new Error(`Resource ${resourceType} not found`);
  }
  
  const resource = this.state.resources[resourceType];
  const newValue = Math.max(0, Math.min(resource.max, resource.current + amount));
  const actualChange = newValue - resource.current;
  
  resource.current = newValue;
  
  this.addSystemMessage(`${resourceType} adjusted by ${actualChange.toFixed(1)}`);
  
  return {
    success: true,
    message: `Resource ${resourceType} adjusted`,
    resource: resource,
    change: actualChange
  };
}

// ADD this new helper method AFTER the adjustResource method:
addSystemMessage(message) {
  const systemError = {
    type: 'SYSTEM_MESSAGE',
    message: message,
    timestamp: new Date().toISOString(),
    severity: 'info',
    system_generated: true
  };
  
  this.state.errors.unshift(systemError);
  
  // Keep only last 50 errors
  if (this.state.errors.length > 50) {
    this.state.errors = this.state.errors.slice(0, 50);
  }
}

  cleanupMemory(parameters) {
    Object.values(this.state.memory).forEach(block => {
      if (!block.protected && block.access_count === 0) {
        // Mark for cleanup
        block.fragmented = false;
      }
    });
    
    return { success: true, message: 'Memory cleanup completed' };
  }

  reallocateResources(parameters) {
    if (parameters.attention_distribution) {
      // Redistribute attention resources
      const total = Object.values(parameters.attention_distribution).reduce((a, b) => a + b, 0);
      if (total <= this.state.resources.attention.max) {
        // Apply new distribution
        return { success: true, message: 'Resources reallocated' };
      }
    }
    
    return { success: false, message: 'Invalid resource allocation' };
  }

  resolveError(errorId) {
    const errorIndex = this.state.errors.findIndex(e => e.id === errorId);
    if (errorIndex !== -1) {
      this.state.errors.splice(errorIndex, 1);
      return { success: true, message: 'Error resolved' };
    }
    
    return { success: false, message: 'Error not found' };
  }

  // Debug command implementations
  killProcess(pid) {
    const process = this.state.processes.find(p => p.pid === pid);
    if (!process) {
      throw new Error(`Process ${pid} not found`);
    }
    
    process.status = 'terminated';
    process.cpu_usage = 0;
    
    return { success: true, message: `Process ${pid} terminated` };
  }

  getProcesses() {
    return this.state.processes.filter(p => p.status !== 'terminated');
  }

  getMemoryMap() {
    return this.state.memory;
  }

  getSystemErrors() {
    return this.state.errors;
  }

  getResources() {
    return this.state.resources;
  }

  // ADDED: Additional methods for debug commands
  getMemoryAllocation() {
    const memory = this.state.memory;
    const allocation = {
      total: 0,
      byType: {}
    };

    Object.values(memory).forEach(block => {
      allocation.total += block.size || 0;
      allocation.byType[block.type] = (allocation.byType[block.type] || 0) + (block.size || 0);
    });

    return allocation;
  }

  getThreads() {
    return this.state.threads;
  }

  getCurrentState() {
    return {
      processes: this.state.processes,
      memory: this.state.memory,
      threads: this.state.threads,
      system_errors: this.state.errors,
      resources: this.state.resources,
      debug_hooks: this.state.debug_hooks,
      timestamp: new Date().toISOString()
    };
  }

  // Utility methods
  addError(error) {
    error.id = Date.now().toString();
    this.state.errors.push(error);
    
    // Limit error count
    if (this.state.errors.length > 20) {
      this.state.errors = this.state.errors.slice(-15);
    }
  }

  // =============================================================================
// 1. FILE: lib/consciousness-engine.js
// =============================================================================

// FIND the evaluateCondition method (should be around line 300-350):
evaluateCondition(condition) {
  // Implementation for evaluating debug hook conditions
  // This is a placeholder - implement based on your condition syntax
  return false;
}

// REPLACE WITH:
evaluateCondition(condition) {
  try {
    // Simple condition evaluation - extend as needed
    if (!condition || typeof condition !== 'string') {
      return false;
    }
    
    // Handle memory conditions like "memory_usage > 800MB"
    if (condition.includes('memory_usage >')) {
      const match = condition.match(/memory_usage > (\d+)MB/);
      if (match) {
        const threshold = parseInt(match[1]);
        const totalMemory = this.state.processes.reduce((sum, p) => sum + (p.memory_mb || 0), 0);
        return totalMemory > threshold;
      }
    }
    
    // Handle CPU conditions like "cpu_usage > 60% for 30 seconds"
    if (condition.includes('cpu_usage >')) {
      const match = condition.match(/cpu_usage > (\d+)%/);
      if (match) {
        const threshold = parseInt(match[1]);
        const maxCpu = Math.max(...this.state.processes.map(p => p.cpu_usage || 0));
        return maxCpu > threshold;
      }
    }
    
    // Handle resource allocation conditions
    if (condition.includes('relationship_allocation <')) {
      const match = condition.match(/relationship_allocation < (\d+)%/);
      if (match) {
        const threshold = parseInt(match[1]);
        const attention = this.state.resources.attention;
        if (attention) {
          const allocation = (attention.current / attention.max) * 100;
          return allocation < threshold;
        }
      }
    }
    
    // Handle error count conditions
    if (condition.includes('desync_error_count >')) {
      const match = condition.match(/desync_error_count > (\d+)/);
      if (match) {
        const threshold = parseInt(match[1]);
        const desyncErrors = this.state.errors.filter(e => 
          e.type && e.type.toLowerCase().includes('desync')
        ).length;
        return desyncErrors > threshold;
      }
    }
    
    // Handle security conditions
    if (condition.includes('unauthorized_access_attempt')) {
      const unauthorizedErrors = this.state.errors.filter(e => 
        e.type && e.type.toLowerCase().includes('unauthorized')
      ).length;
      return unauthorizedErrors > 0;
    }
    
    // Default: condition not met
    return false;
    
  } catch (error) {
    console.warn(`Failed to evaluate debug hook condition: ${condition}`, error);
    return false;
  }
}


  // Debugger methods
  stepInto() {
    return { success: true, message: 'Stepped into function' };
  }

  stepOver() {
    return { success: true, message: 'Stepped over line' };
  }

  continue() {
    return { success: true, message: 'Resumed execution' };
  }

  breakAll() {
    return { success: true, message: 'Paused all processes' };
  }
}

module.exports = new ConsciousnessEngine();