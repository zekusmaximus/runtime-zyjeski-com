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
      interventions: [],

      // UI state properties
      isLoadingCharacter: false,
      activeSection: 'home',
      userInteracted: false,
      initializedComponents: new Set(),

      // Debugger state properties
      debuggerActive: false,
      debuggerBreakpoints: new Map(),
      debuggerExecutionState: 'stopped', // stopped, running, paused
      debuggerCurrentLine: null,
      debuggerVariables: {},
      debuggerCallStack: []
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
    const processArray = Array.isArray(processes) ? processes : [];
    console.log('[STATE MANAGER] setProcesses called with:', processArray.length, 'processes');
    if (processArray.length > 0) {
      console.log('[STATE MANAGER] Sample process:', processArray[0].name || processArray[0]);
    }
    this.updateState('processes', processArray);
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

  // Load character by ID (fetches from server)
  async loadCharacter(characterId) {
    console.log('[STATE MANAGER] Loading character:', characterId);

    if (!characterId) {
      console.error('Cannot load character: characterId is null or undefined');
      return;
    }

    try {
      this.updateState('isLoadingCharacter', true);

      // Fetch character data from server
      const response = await fetch(`/api/character/${characterId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch character: ${response.status} ${response.statusText}`);
      }

      const characterData = await response.json();
      console.log('[STATE MANAGER] Character data received:', characterData);

      // Load the character state
      this.loadCharacterState(characterData);

      return characterData;

    } catch (error) {
      console.error('[STATE MANAGER] Failed to load character:', error);
      this.updateState('isLoadingCharacter', false);
      throw error;
    }
  }

  // Character-specific state management (accepts character object)
  loadCharacterState(character) {
    if (!character) {
      console.error('Cannot load character state: character is null or undefined');
      return;
    }

    try {
      this.setCurrentCharacter(character);

      // Handle both nested consciousness structure and flat structure
      let consciousness, processes, resources, errors, memory, threads;

      if (character.consciousness) {
        // Nested structure: character.consciousness.processes
        consciousness = character.consciousness;
        processes = consciousness.processes || [];
        resources = consciousness.resources || {};
        errors = consciousness.system_errors || consciousness.errors || [];
        memory = consciousness.memory || null;
        threads = consciousness.threads || [];
      } else {
        // Flat structure: character.baseProcesses (like alexander-kane.json)
        consciousness = character; // Use the character object itself as consciousness
        processes = character.baseProcesses || character.processes || [];
        resources = character.resources || {};
        errors = character.system_errors || character.errors || [];
        memory = character.memory || null;
        threads = character.threads || [];

        // Debug logging for flat structure
        console.log('[STATE MANAGER] Flat structure detected:');
        console.log('  character.baseProcesses:', character.baseProcesses?.length || 0);
        console.log('  character.processes:', character.processes?.length || 0);
        console.log('  final processes array:', processes.length);
      }

      this.setConsciousnessState(consciousness);
      this.setProcesses(processes);
      this.setResources(resources);
      this.setErrors(errors);
      this.setMemory(memory);
      this.setThreads(threads);

      console.log('Character state loaded successfully:', character.name);
      console.log('Loaded processes:', processes.length);
      console.log('Loaded resources:', Object.keys(resources).length);
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

  // UI state management
  getIsLoadingCharacter() {
    return this.state.isLoadingCharacter;
  }

  setIsLoadingCharacter(isLoading) {
    this.updateState('isLoadingCharacter', isLoading);
  }

  getActiveSection() {
    return this.state.activeSection;
  }

  setActiveSection(section) {
    this.updateState('activeSection', section);
  }

  getUserInteracted() {
    return this.state.userInteracted;
  }

  setUserInteracted(interacted) {
    this.updateState('userInteracted', interacted);
  }

  getInitializedComponents() {
    return this.state.initializedComponents;
  }

  addInitializedComponent(componentName) {
    const components = new Set(this.state.initializedComponents);
    components.add(componentName);
    this.updateState('initializedComponents', components);
  }

  // Debugger state management
  getDebuggerActive() {
    return this.state.debuggerActive;
  }

  setDebuggerActive(active) {
    this.updateState('debuggerActive', active);
  }

  getDebuggerBreakpoints() {
    return this.state.debuggerBreakpoints;
  }

  setDebuggerBreakpoints(breakpoints) {
    this.updateState('debuggerBreakpoints', breakpoints);
  }

  addDebuggerBreakpoint(line, condition = null) {
    const breakpoints = new Map(this.state.debuggerBreakpoints);
    breakpoints.set(line, { line, condition, enabled: true });
    this.updateState('debuggerBreakpoints', breakpoints);
  }

  removeDebuggerBreakpoint(line) {
    const breakpoints = new Map(this.state.debuggerBreakpoints);
    breakpoints.delete(line);
    this.updateState('debuggerBreakpoints', breakpoints);
  }

  getDebuggerExecutionState() {
    return this.state.debuggerExecutionState;
  }

  setDebuggerExecutionState(state) {
    this.updateState('debuggerExecutionState', state);
  }

  getDebuggerCurrentLine() {
    return this.state.debuggerCurrentLine;
  }

  setDebuggerCurrentLine(line) {
    this.updateState('debuggerCurrentLine', line);
  }

  getDebuggerVariables() {
    return this.state.debuggerVariables;
  }

  setDebuggerVariables(variables) {
    this.updateState('debuggerVariables', variables);
  }

  getDebuggerCallStack() {
    return this.state.debuggerCallStack;
  }

  setDebuggerCallStack(callStack) {
    this.updateState('debuggerCallStack', callStack);
  }

  // Generic set method for compatibility with consciousness.js
  set(key, value) {
    this.updateState(key, value);
  }
}

// Create global state manager instance
window.stateManager = new StateManager();