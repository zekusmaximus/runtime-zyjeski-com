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
    
    // Real-time update frequency (milliseconds)
    this.updateFrequency = 1000;
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
    
    // Emit update event for WebSocket broadcasting
    this.emit('consciousness-updated', {
      characterId,
      state: state.consciousness,
      timestamp: new Date().toISOString()
    });
    
    return state;
  }

  startMonitoring(characterId, socketId) {
    const simulator = this.simulators.get(characterId);
    if (!simulator) {
      throw new Error(`Character ${characterId} not loaded`);
    }
    
    simulator.startSimulation();
    
    // Set up real-time updates for this socket
    if (!this.updateIntervals.has(socketId)) {
      const interval = setInterval(async () => {
        try {
          const state = await this.getState(characterId);
          this.emit('real-time-update', {
            socketId,
            characterId,
            state: state.consciousness,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Real-time update error:', error);
        }
      }, this.updateFrequency);
      
      this.updateIntervals.set(socketId, interval);
    }
    
    console.log(`Started monitoring ${characterId} for socket ${socketId}`);
  }

  stopMonitoring(characterId, socketId) {
    // Stop real-time updates for this socket
    if (this.updateIntervals.has(socketId)) {
      clearInterval(this.updateIntervals.get(socketId));
      this.updateIntervals.delete(socketId);
    }
    
    // Check if anyone else is monitoring this character
    const stillMonitored = Array.from(this.updateIntervals.values()).length > 0;
    
    if (!stillMonitored) {
      const simulator = this.simulators.get(characterId);
      if (simulator) {
        simulator.stopSimulation();
      }
    }
    
    console.log(`Stopped monitoring ${characterId} for socket ${socketId}`);
  }

  // Debug command execution
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
        break;
        
      case 'monitor':
        result.memory = simulator.getMemory();
        result.errors = simulator.getErrors();
        result.resources = simulator.getResources();
        result.threads = simulator.getThreads();
        break;
        
      case 'attach':
        result.character = await this.getState(characterId);
        result.message = `Attached to ${result.character.name}'s consciousness`;
        break;
        
      case 'debug':
        // Start debugging session
        const sessionId = this.startDebuggingSession(characterId);
        result.sessionId = sessionId;
        result.message = `Debug session started: ${sessionId}`;
        break;
        
      case 'memory':
        result.memory = simulator.getMemory();
        result.allocation = simulator.getMemoryAllocation();
        break;
        
      case 'errors':
        result.errors = simulator.getErrors();
        break;
        
      case 'step_into':
      case 'step_over':
      case 'continue':
      case 'break_all':
        result = this.executeDebuggerCommand(characterId, command, args);
        break;
        
      default:
        throw new Error(`Unknown command: ${command}`);
    }
    
    // Emit command result
    this.emit('debug-command-executed', {
      characterId,
      command,
      args,
      result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }

  startDebuggingSession(characterId) {
    const sessionId = `debug_${characterId}_${Date.now()}`;
    const simulator = this.simulators.get(characterId);
    
    if (simulator) {
      simulator.enableDebugging();
    }
    
    this.debugSessions.set(sessionId, {
      characterId,
      startTime: new Date().toISOString(),
      breakpoints: [],
      callStack: [],
      currentLine: null,
      status: 'active'
    });
    
    return sessionId;
  }

  executeDebuggerCommand(characterId, command, args) {
    const simulator = this.simulators.get(characterId);
    if (!simulator) {
      throw new Error(`Character ${characterId} not loaded`);
    }
    
    return simulator.executeDebuggerCommand(command, args);
  }

  // Cleanup methods
  cleanup(socketId) {
    if (this.updateIntervals.has(socketId)) {
      clearInterval(this.updateIntervals.get(socketId));
      this.updateIntervals.delete(socketId);
    }
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
    
    // Initialize simulation state from character data
    this.state = {
      processes: [...(character.consciousness.processes || [])],
      memory: {...(character.consciousness.memory || {})},
      threads: [...(character.consciousness.threads || [])],
      errors: [...(character.consciousness.system_errors || [])],
      resources: {...(character.consciousness.resources || {})},
      debug_hooks: [...(character.consciousness.debug_hooks || [])]
    };
    
    // Simulation parameters
    this.simulationSpeed = 1000; // milliseconds
    this.memoryLeakRate = 0.1; // MB per tick for grief processes
    this.cpuFluctuationRange = 5; // +/- CPU percentage
    this.errorGenerationChance = 0.05; // 5% chance per tick
    
    console.log(`Initialized consciousness simulator for ${character.name}`);
  }

  startSimulation() {
    if (this.isSimulating) return;
    
    this.isSimulating = true;
    this.simulationInterval = setInterval(() => {
      this.simulationTick();
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
    
    console.log(`Stopped consciousness simulation for ${this.character.name}`);
  }

  simulationTick() {
    // Update processes
    this.updateProcesses();
    
    // Update memory
    this.updateMemory();
    
    // Update resources
    this.updateResources();
    
    // Update threads
    this.updateThreads();
    
    // Generate errors
    this.generateErrors();
    
    // Check debug hooks
    this.checkDebugHooks();
    
    // Emit state change
    this.engine.emit('consciousness-updated', {
      characterId: this.character.id,
      state: this.getCurrentState(),
      timestamp: new Date().toISOString()
    });
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
      if (block.protected && Math.random() < 0.05) {
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
        attention.current + (Math.random() - 0.5) * 3
      ));
    }
    
    if (this.state.resources.emotional_energy) {
      const energy = this.state.resources.emotional_energy;
      energy.current = Math.max(0, Math.min(energy.max,
        energy.current + (Math.random() - 0.6) * 2 // Slight downward trend
      ));
    }
    
    if (this.state.resources.processing_capacity) {
      const capacity = this.state.resources.processing_capacity;
      const totalCpu = this.state.processes.reduce((sum, p) => sum + (p.cpu_usage || 0), 0);
      capacity.current = Math.min(capacity.max, totalCpu);
    }
  }

  updateThreads() {
    this.state.threads.forEach(thread => {
      if (thread.status === 'terminated') return;
      
      // Update CPU time
      if (thread.status === 'running') {
        thread.cpu_time += Math.random() * 0.5;
      }
      
      // Check for thread starvation
      const relatedProcess = this.state.processes.find(p => p.pid === thread.related_process);
      if (relatedProcess && relatedProcess.cpu_usage < 5 && thread.priority > 5) {
        thread.status = 'waiting';
        thread.wait_reason = 'Thread starvation - insufficient CPU allocation';
        
        if (Math.random() < 0.1) {
          this.addError({
            type: 'THREAD_STARVATION',
            message: `Thread ${thread.name} starved of resources`,
            severity: 'warning',
            related_process: thread.related_process
          });
        }
      }
    });
  }

  generateErrors() {
    if (Math.random() < this.errorGenerationChance) {
      const errorTypes = [
        'IO_PROCESSING_ERROR',
        'STACK_OVERFLOW',
        'DEADLOCK_DETECTED',
        'RESOURCE_EXHAUSTION'
      ];
      
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      const messages = {
        'IO_PROCESSING_ERROR': 'Reality parsing failed - temporal desynchronization detected',
        'STACK_OVERFLOW': 'Emotional processing stack overflow - too many concurrent feelings',
        'DEADLOCK_DETECTED': 'Conflicting thought processes locked in deadlock',
        'RESOURCE_EXHAUSTION': 'Mental resources depleted - system performance degraded'
      };
      
      this.addError({
        type: errorType,
        message: messages[errorType],
        severity: Math.random() > 0.7 ? 'critical' : 'warning'
      });
    }
  }

  checkDebugHooks() {
    this.state.debug_hooks.forEach(hook => {
      if (!hook.enabled) return;
      
      // Check hook conditions
      let triggered = false;
      
      switch (hook.type) {
        case 'breakpoint':
          if (hook.target === 'Grief_Manager.exe') {
            const griefProcess = this.state.processes.find(p => p.name === 'Grief_Manager.exe');
            if (griefProcess && griefProcess.memory_mb > 800) {
              triggered = true;
            }
          }
          break;
          
        case 'watchpoint':
          if (hook.target === 'Search_Protocol.exe') {
            const searchProcess = this.state.processes.find(p => p.name === 'Search_Protocol.exe');
            if (searchProcess && searchProcess.cpu_usage > 60) {
              triggered = true;
            }
          }
          break;
      }
      
      if (triggered) {
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
    console.log(`Applying intervention for ${this.character.name}:`, intervention);
    
    switch (intervention.type) {
      case 'kill_process':
        this.killProcess(intervention.pid);
        break;
        
      case 'restart_process':
        this.restartProcess(intervention.pid);
        break;
        
      case 'adjust_resource':
        this.adjustResource(intervention.resource_type, intervention.amount);
        break;
        
      case 'allocate_memory':
        this.allocateMemory(intervention.memory_type, intervention.size, intervention.description);
        break;
        
      case 'deallocate_memory':
        this.deallocateMemory(intervention.address);
        break;
        
      case 'optimize_process':
        this.optimizeProcess(intervention.pid, intervention.parameters);
        break;
    }
  }

  killProcess(pid) {
    const process = this.state.processes.find(p => p.pid === pid);
    if (!process) {
      throw new Error(`Process ${pid} not found`);
    }
    
    process.status = 'terminated';
    process.cpu_usage = 0;
    
    // Add termination log
    this.addError({
      type: 'PROCESS_TERMINATED',
      message: `Process ${process.name} (PID: ${pid}) was terminated by user intervention`,
      severity: 'info'
    });
    
    return {
      pid: pid,
      name: process.name,
      status: 'terminated',
      message: `Successfully terminated ${process.name}`
    };
  }

  restartProcess(pid) {
    const process = this.state.processes.find(p => p.pid === pid);
    if (!process) {
      throw new Error(`Process ${pid} not found`);
    }
    
    process.status = 'running';
    process.cpu_usage = Math.random() * 30; // Start with moderate CPU usage
    process.last_activity = new Date().toISOString();
    
    // Reset memory for certain processes
    if (process.name.includes('Grief_Manager')) {
      process.memory_mb = Math.max(100, process.memory_mb * 0.5); // Reduce memory usage
    }
    
    return {
      pid: pid,
      name: process.name,
      status: 'running',
      message: `Successfully restarted ${process.name}`
    };
  }

  adjustResource(resourceType, amount) {
    const resource = this.state.resources[resourceType];
    if (!resource) {
      throw new Error(`Resource ${resourceType} not found`);
    }
    
    resource.current = Math.max(0, Math.min(resource.max, resource.current + amount));
    
    return {
      resource: resourceType,
      newValue: resource.current,
      message: `Adjusted ${resourceType} by ${amount}`
    };
  }

  optimizeProcess(pid, parameters = {}) {
    const process = this.state.processes.find(p => p.pid === pid);
    if (!process) {
      throw new Error(`Process ${pid} not found`);
    }
    
    // Apply optimization parameters
    if (parameters.memory_limit && process.memory_mb > parameters.memory_limit) {
      process.memory_mb = parameters.memory_limit;
    }
    
    if (parameters.cpu_limit && process.cpu_usage > parameters.cpu_limit) {
      process.cpu_usage = parameters.cpu_limit;
    }
    
    if (parameters.priority !== undefined) {
      process.priority = parameters.priority;
    }
    
    return {
      pid: pid,
      name: process.name,
      message: `Optimized ${process.name} with new parameters`
    };
  }

  // Debugging methods
  enableDebugging() {
    this.debugMode = true;
    console.log(`Enabled debugging mode for ${this.character.name}`);
  }

  executeDebuggerCommand(command, args) {
    if (!this.debugMode) {
      throw new Error('Debugging not enabled for this character');
    }
    
    switch (command) {
      case 'step_into':
        return this.debugStepInto();
      case 'step_over':
        return this.debugStepOver();
      case 'continue':
        return this.debugContinue();
      case 'break_all':
        return this.debugBreakAll();
      default:
        throw new Error(`Unknown debugger command: ${command}`);
    }
  }

  debugStepInto() {
    // Simulate stepping into function
    return {
      action: 'step_into',
      currentLine: 15,
      function: 'process_grief()',
      message: 'Stepped into grief processing function'
    };
  }

  debugStepOver() {
    return {
      action: 'step_over',
      currentLine: 16,
      message: 'Executed current line'
    };
  }

  debugContinue() {
    return {
      action: 'continue',
      message: 'Resumed execution until next breakpoint'
    };
  }

  debugBreakAll() {
    return {
      action: 'break_all',
      message: 'Paused all consciousness processes'
    };
  }

  // Utility methods
  addError(errorData) {
    const error = {
      ...errorData,
      timestamp: new Date().toISOString()
    };
    
    this.state.errors.push(error);
    
    // Keep only last 20 errors
    if (this.state.errors.length > 20) {
      this.state.errors.shift();
    }
  }

  allocateMemory(type, size, description) {
    // Generate new memory address
    const address = `0x${Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0')}`;
    
    this.state.memory[address] = {
      type: type,
      size: size,
      description: description,
      access_count: 0,
      last_accessed: new Date().toISOString(),
      fragmented: false,
      protected: type === 'trauma' || type === 'relationship'
    };
    
    return address;
  }

  deallocateMemory(address) {
    if (this.state.memory[address]) {
      delete this.state.memory[address];
      return true;
    }
    return false;
  }

  // Getters for current state
  getCurrentState() {
    return {
      processes: this.state.processes,
      memory: this.state.memory,
      threads: this.state.threads,
      system_errors: this.state.errors,
      resources: this.state.resources,
      debug_hooks: this.state.debug_hooks
    };
  }

  getProcesses() {
    return this.state.processes;
  }

  getMemory() {
    return this.state.memory;
  }

  getMemoryAllocation() {
    const total = Object.values(this.state.memory).reduce((sum, block) => sum + block.size, 0);
    const byType = {};
    
    Object.values(this.state.memory).forEach(block => {
      byType[block.type] = (byType[block.type] || 0) + block.size;
    });
    
    return { total, byType };
  }

  getThreads() {
    return this.state.threads;
  }

  getErrors() {
    return this.state.errors;
  }

  getResources() {
    return this.state.resources;
  }
}

// Export singleton instance
module.exports = new ConsciousnessEngine();