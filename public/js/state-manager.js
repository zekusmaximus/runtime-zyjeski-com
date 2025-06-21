// Global State Manager
class StateManager {
  constructor() {
    this.state = {
      currentCharacter: null,
      consciousnessState: null,
      debuggingSession: null,
      monitoringActive: false,
      connectionStatus: 'disconnected',
      terminalHistory: [],
      breakpoints: [],
      callStack: [],
      variables: {},
      errors: [],
      processes: [],
      resources: {}
    };
    
    this.listeners = new Map();
    this.init();
  }

  init() {
    // Initialize state from localStorage if available
    this.loadPersistedState();
    
    // Set up periodic state persistence
    setInterval(() => {
      this.persistState();
    }, 5000);
  }

  // State getters
  getCurrentCharacter() {
    return this.state.currentCharacter;
  }

  getConsciousnessState() {
    return this.state.consciousnessState;
  }

  getDebuggingSession() {
    return this.state.debuggingSession;
  }

  isMonitoringActive() {
    return this.state.monitoringActive;
  }

  getConnectionStatus() {
    return this.state.connectionStatus;
  }

  getTerminalHistory() {
    return this.state.terminalHistory;
  }

  getBreakpoints() {
    return this.state.breakpoints;
  }

  getCallStack() {
    return this.state.callStack;
  }

  getVariables() {
    return this.state.variables;
  }

  getErrors() {
    return this.state.errors;
  }

  getProcesses() {
    return this.state.processes;
  }

  getResources() {
    return this.state.resources;
  }

  // State setters
  setCurrentCharacter(character) {
    this.updateState('currentCharacter', character);
  }

  setConsciousnessState(state) {
    this.updateState('consciousnessState', state);
  }

  setDebuggingSession(session) {
    this.updateState('debuggingSession', session);
  }

  setMonitoringActive(active) {
    this.updateState('monitoringActive', active);
  }

  setConnectionStatus(status) {
    this.updateState('connectionStatus', status);
  }

  addTerminalEntry(entry) {
    const history = [...this.state.terminalHistory, entry];
    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    this.updateState('terminalHistory', history);
  }

  clearTerminalHistory() {
    this.updateState('terminalHistory', []);
  }

  addBreakpoint(breakpoint) {
    const breakpoints = [...this.state.breakpoints, breakpoint];
    this.updateState('breakpoints', breakpoints);
  }

  removeBreakpoint(id) {
    const breakpoints = this.state.breakpoints.filter(bp => bp.id !== id);
    this.updateState('breakpoints', breakpoints);
  }

  toggleBreakpoint(id) {
    const breakpoints = this.state.breakpoints.map(bp => 
      bp.id === id ? { ...bp, enabled: !bp.enabled } : bp
    );
    this.updateState('breakpoints', breakpoints);
  }

  setCallStack(callStack) {
    this.updateState('callStack', callStack);
  }

  setVariables(variables) {
    this.updateState('variables', variables);
  }

  addError(error) {
    const errors = [error, ...this.state.errors];
    // Keep only last 100 errors
    if (errors.length > 100) {
      errors.splice(100);
    }
    this.updateState('errors', errors);
  }

  clearErrors() {
    this.updateState('errors', []);
  }

  setProcesses(processes) {
    this.updateState('processes', processes);
  }

  setResources(resources) {
    this.updateState('resources', resources);
  }

  // Generic state update method
  updateState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // Notify listeners
    this.notifyListeners(key, value, oldValue);
  }

  // Event system
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(callback);
      }
    };
  }

  notifyListeners(key, newValue, oldValue) {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error('Error in state listener:', error);
        }
      });
    }
  }

  // Persistence
  persistState() {
    try {
      const persistableState = {
        currentCharacter: this.state.currentCharacter,
        terminalHistory: this.state.terminalHistory.slice(-100), // Only persist last 100 entries
        breakpoints: this.state.breakpoints,
        errors: this.state.errors.slice(-50) // Only persist last 50 errors
      };
      
      localStorage.setItem('runtime-zyjeski-state', JSON.stringify(persistableState));
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }

  loadPersistedState() {
    try {
      const persistedState = localStorage.getItem('runtime-zyjeski-state');
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        
        // Restore persisted state
        Object.keys(parsed).forEach(key => {
          if (this.state.hasOwnProperty(key)) {
            this.state[key] = parsed[key];
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }

  // Utility methods
  reset() {
    this.state = {
      currentCharacter: null,
      consciousnessState: null,
      debuggingSession: null,
      monitoringActive: false,
      connectionStatus: 'disconnected',
      terminalHistory: [],
      breakpoints: [],
      callStack: [],
      variables: {},
      errors: [],
      processes: [],
      resources: {}
    };
    
    // Clear persisted state
    localStorage.removeItem('runtime-zyjeski-state');
    
    // Notify all listeners of reset
    this.listeners.forEach((callbacks, key) => {
      callbacks.forEach(callback => {
        try {
          callback(this.state[key], null);
        } catch (error) {
          console.error('Error in reset listener:', error);
        }
      });
    });
  }

  // Debug methods
  getFullState() {
    return { ...this.state };
  }

  logState() {
    console.log('Current State:', this.getFullState());
  }

  // Character-specific state management
  loadCharacterState(character) {
    this.setCurrentCharacter(character);
    this.setConsciousnessState(character.consciousness);
    this.setProcesses(character.consciousness.processes || []);
    this.setResources(character.consciousness.resources || {});
    this.setErrors(character.consciousness.system_errors || []);
  }

  updateConsciousnessData(data) {
    if (data.processes) {
      this.setProcesses(data.processes);
    }
    if (data.resources) {
      this.setResources(data.resources);
    }
    if (data.system_errors) {
      this.setErrors(data.system_errors);
    }
    if (data.memory) {
      // Update consciousness state with new memory data
      const currentState = this.getConsciousnessState();
      if (currentState) {
        this.setConsciousnessState({
          ...currentState,
          memory: data.memory
        });
      }
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
}

// Create global state manager instance
window.stateManager = new StateManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateManager;
}

