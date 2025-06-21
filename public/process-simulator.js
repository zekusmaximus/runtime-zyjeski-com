class ProcessSimulator {
  constructor(character) {
    this.character = character;
    this.isRunning = false;
    this.interval = null;
    this.updateFrequency = 1000; // Update every second
    
    // Initialize simulation state
    this.simulationState = {
      processes: [...(character.consciousness.processes || [])],
      memory: {...(character.consciousness.memory || {})},
      errors: [...(character.consciousness.system_errors || [])],
      resources: {...(character.consciousness.resources || {})}
    };
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.updateSimulation();
    }, this.updateFrequency);
    
    console.log(`Started consciousness simulation for ${this.character.name}`);
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    console.log(`Stopped consciousness simulation for ${this.character.name}`);
  }

  updateSimulation() {
    // Simulate process CPU and memory fluctuations
    this.simulationState.processes.forEach(process => {
      // Add some randomness to CPU usage
      const baseCpu = process.cpu_usage || 0;
      process.cpu_usage = Math.max(0, Math.min(100, 
        baseCpu + (Math.random() - 0.5) * 10
      ));
      
      // Simulate memory leaks for grief processes
      if (process.name.toLowerCase().includes('grief')) {
        process.memory_mb += Math.random() * 2;
      }
      
      // Update last activity
      process.last_activity = new Date().toISOString();
    });

    // Simulate resource fluctuations
    if (this.simulationState.resources.attention) {
      this.simulationState.resources.attention.current = Math.max(0, Math.min(100,
        this.simulationState.resources.attention.current + (Math.random() - 0.5) * 5
      ));
    }

    if (this.simulationState.resources.emotional_energy) {
      this.simulationState.resources.emotional_energy.current = Math.max(0, Math.min(100,
        this.simulationState.resources.emotional_energy.current + (Math.random() - 0.5) * 3
      ));
    }

    // Occasionally generate new errors
    if (Math.random() < 0.1) { // 10% chance per update
      this.generateRandomError();
    }
  }

  generateRandomError() {
    const errorTypes = [
      'MEMORY_LEAK_DETECTED',
      'INFINITE_LOOP_WARNING',
      'THREAD_STARVATION',
      'IO_PROCESSING_ERROR',
      'STACK_OVERFLOW'
    ];

    const newError = {
      type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
      message: `Simulated error at ${new Date().toISOString()}`,
      timestamp: new Date().toISOString(),
      severity: Math.random() > 0.7 ? 'critical' : 'warning'
    };

    this.simulationState.errors.push(newError);
    
    // Keep only last 10 errors
    if (this.simulationState.errors.length > 10) {
      this.simulationState.errors.shift();
    }
  }

  getProcesses() {
    return this.simulationState.processes;
  }

  getMemory() {
    return this.simulationState.memory;
  }

  getErrors() {
    return this.simulationState.errors;
  }

  getResources() {
    return this.simulationState.resources;
  }

  applyUpdates(updates) {
    // Apply external updates to simulation state
    if (updates.processes) {
      this.simulationState.processes = updates.processes;
    }
    if (updates.memory) {
      Object.assign(this.simulationState.memory, updates.memory);
    }
    if (updates.system_errors) {
      this.simulationState.errors = updates.system_errors;
    }
    if (updates.resources) {
      Object.assign(this.simulationState.resources, updates.resources);
    }
  }

  // Kill a specific process
  killProcess(pid) {
    const index = this.simulationState.processes.findIndex(p => p.pid === pid);
    if (index !== -1) {
      const process = this.simulationState.processes[index];
      process.status = 'terminated';
      process.cpu_usage = 0;
      
      // Add termination error
      this.simulationState.errors.push({
        type: 'PROCESS_TERMINATED',
        message: `Process ${process.name} (PID: ${pid}) was terminated`,
        timestamp: new Date().toISOString(),
        severity: 'info'
      });
      
      return true;
    }
    return false;
  }

  // Restart a process
  restartProcess(pid) {
    const process = this.simulationState.processes.find(p => p.pid === pid);
    if (process) {
      process.status = 'running';
      process.cpu_usage = Math.random() * 50; // Random initial CPU usage
      process.last_activity = new Date().toISOString();
      return true;
    }
    return false;
  }
}

module.exports = ProcessSimulator;

