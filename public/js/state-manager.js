// Fixed State Manager - Add missing methods and null checks
class StateManager {
  constructor() {
    this.state = {
      currentCharacter: null,
      consciousnessState: null,
      processes: [],
      resources: {},
      errors: [],
      memory: null,
      threads: [],
      debuggingSession: null,
      monitoringActive: false,
      terminalHistory: [],
      currentTerminalPath: '/',
      interventions: []
    };
    
    this.subscribers = {};
  }

  // Core state methods
  updateState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.notifySubscribers(key, value, oldValue);
  }

  subscribe(key, callback) {
    if (!this.subscribers[key]) {
      this.subscribers[key] = [];
    }
    this.subscribers[key].push(callback);
  }

  notifySubscribers(key, newValue, oldValue) {
    if (this.subscribers[key]) {
      this.subscribers[key].forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error(`Error in state subscriber for ${key}:`, error);
        }
      });
    }
  }

  // Character management
  getCurrentCharacter() {
    return this.state.currentCharacter;
  }

  setCurrentCharacter(character) {
    this.updateState('currentCharacter', character);
  }

  // Consciousness state management
  getConsciousnessState() {
    return this.state.consciousnessState;
  }

  setConsciousnessState(state) {
    this.updateState('consciousnessState', state);
  }

  // Process management
  getProcesses() {
    return this.state.processes;
  }

  setProcesses(processes) {
    this.updateState('processes', Array.isArray(processes) ? processes : []);
  }

  // Resource management
  getResources() {
    return this.state.resources;
  }

  setResources(resources) {
    this.updateState('resources', resources || {});
  }

  // ERROR MANAGEMENT - MISSING METHODS
  getErrors() {
    return this.state.errors;
  }

  setErrors(errors) {
    this.updateState('errors', Array.isArray(errors) ? errors : []);
  }

  addError(error) {
    const currentErrors = this.getErrors();
    const newErrors = [...currentErrors, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...error
    }];
    this.setErrors(newErrors);
  }

  clearErrors() {
    this.setErrors([]);
  }

  // Memory management
  getMemory() {
    return this.state.memory;
  }

  setMemory(memory) {
    this.updateState('memory', memory);
  }

  // Thread management
  getThreads() {
    return this.state.threads;
  }

  setThreads(threads) {
    this.updateState('threads', Array.isArray(threads) ? threads : []);
  }

  // Session management
  getDebuggingSession() {
    return this.state.debuggingSession;
  }

  setDebuggingSession(session) {
    this.updateState('debuggingSession', session);
  }

  // Monitoring management
  getMonitoringActive() {
    return this.state.monitoringActive;
  }

  setMonitoringActive(active) {
    this.updateState('monitoringActive', Boolean(active));
  }

  // Terminal management
  getTerminalHistory() {
    return this.state.terminalHistory;
  }

  setTerminalHistory(history) {
    this.updateState('terminalHistory', Array.isArray(history) ? history : []);
  }

  addTerminalEntry(entry) {
    const currentHistory = this.getTerminalHistory();
    this.setTerminalHistory([...currentHistory, entry]);
  }

  getCurrentTerminalPath() {
    return this.state.currentTerminalPath;
  }

  setCurrentTerminalPath(path) {
    this.updateState('currentTerminalPath', path || '/');
  }

  // Intervention management
  getInterventions() {
    return this.state.interventions;
  }

  setInterventions(interventions) {
    this.updateState('interventions', Array.isArray(interventions) ? interventions : []);
  }

  addIntervention(intervention) {
    const currentInterventions = this.getInterventions();
    this.setInterventions([...currentInterventions, intervention]);
  }

  // Character-specific state management
  loadCharacterState(character) {
    if (!character) {
      console.error('Cannot load character state: character is null or undefined');
      return;
    }

    try {
      this.setCurrentCharacter(character);
      
      // FIXED: Add null checks and default values
      const consciousness = character.consciousness || {};
      
      this.setConsciousnessState(consciousness);
      this.setProcesses(consciousness.processes || []);
      this.setResources(consciousness.resources || {});
      this.setErrors(consciousness.system_errors || []);
      this.setMemory(consciousness.memory || null);
      this.setThreads(consciousness.threads || []);
      
      console.log('Character state loaded successfully:', character.name);
    } catch (error) {
      console.error('Failed to load character state:', error);
      this.addError({
        type: 'character_load_error',
        message: `Failed to load character: ${error.message}`,
        character_id: character?.id
      });
    }
  }

  // FIXED: Add comprehensive null checks to updateConsciousnessData
  updateConsciousnessData(data) {
    if (!data) {
      console.warn('Received null/undefined consciousness data');
      return;
    }

    try {
      // Check data structure and provide defaults
      if (data.processes !== undefined) {
        this.setProcesses(data.processes);
      }
      
      if (data.resources !== undefined) {
        this.setResources(data.resources);
      }
      
      if (data.system_errors !== undefined) {
        this.setErrors(data.system_errors);
      }
      
      if (data.memory !== undefined) {
        this.setMemory(data.memory);
        
        // Update consciousness state with new memory data
        const currentState = this.getConsciousnessState();
        if (currentState) {
          this.setConsciousnessState({
            ...currentState,
            memory: data.memory
          });
        }
      }
      
      if (data.threads !== undefined) {
        this.setThreads(data.threads);
      }

    } catch (error) {
      console.error('Error updating consciousness data:', error);
      this.addError({
        type: 'consciousness_update_error',
        message: `Failed to update consciousness data: ${error.message}`,
        data_received: data
      });
    }
  }

  // Session management
  startDebuggingSession(characterId) {
    const session = {
      id: `debug_${characterId}_${Date.now()}`,
      characterId,
      startTime: new Date().toISOString(),
      status: 'active'
    };
    this.setDebuggingSession(session);
    return session;
  }

  endDebuggingSession() {
    const session = this.getDebuggingSession();
    if (session) {
      this.setDebuggingSession({
        ...session,
        endTime: new Date().toISOString(),
        status: 'ended'
      });
    }
  }

  // Monitoring management
  startMonitoring() {
    this.setMonitoringActive(true);
  }

  stopMonitoring() {
    this.setMonitoringActive(false);
  }

  // Debug helpers
  getFullState() {
    return { ...this.state };
  }

  logState() {
    console.log('Current State:', this.getFullState());
  }

  // State validation
  validateState() {
    const issues = [];
    
    if (this.state.currentCharacter && !this.state.consciousnessState) {
      issues.push('Character loaded but consciousness state missing');
    }
    
    if (!Array.isArray(this.state.processes)) {
      issues.push('Processes state is not an array');
    }
    
    if (typeof this.state.resources !== 'object') {
      issues.push('Resources state is not an object');
    }
    
    return issues;
  }

  // Generic set method for compatibility with consciousness.js
  set(key, value) {
    this.updateState(key, value);
  }
}

// Create global state manager instance
window.stateManager = new StateManager();