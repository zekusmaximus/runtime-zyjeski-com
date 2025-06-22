// Event-Driven Socket Client - Only updates on meaningful user interactions
class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.monitoringCharacters = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = new Map();
    
    // REMOVED: Rate limiting (no longer needed)
    // ADDED: Auto-update control
    this.autoUpdatesEnabled = false;
    this.lastUserInteraction = Date.now();
    
    this.init();
  }

  init() {
    this.connect();
  }

  connect() {
    try {
      this.socket = io({
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: false
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyHandlers('connected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
      this.notifyHandlers('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleConnectionError(error);
    });

    // UPDATED: Simplified consciousness update handling
    this.socket.on('consciousness-update', (data) => {
      console.log('Consciousness update received:', data);
      this.handleConsciousnessUpdate(data);
    });

    this.socket.on('debug-result', (data) => {
      console.log('Debug command result:', data);
      this.notifyHandlers('debug-result', data);
    });

    this.socket.on('debug-command-broadcast', (data) => {
      console.log('Debug command broadcast:', data);
      this.notifyHandlers('debug-command-broadcast', data);
    });

    this.socket.on('intervention-applied', (data) => {
      console.log('Intervention applied:', data);
      this.notifyHandlers('intervention-applied', data);
    });

    this.socket.on('debug-hook-triggered', (data) => {
      console.log('Debug hook triggered:', data);
      this.notifyHandlers('debug-hook-triggered', data);
    });

    this.socket.on('monitoring-started', (data) => {
      console.log('Monitoring started:', data);
      this.monitoringCharacters.add(data.characterId);
      this.notifyHandlers('monitoring-started', data);
    });

    this.socket.on('monitoring-stopped', (data) => {
      console.log('Monitoring stopped:', data);
      this.monitoringCharacters.delete(data.characterId);
      this.notifyHandlers('monitoring-stopped', data);
    });

    // ADDED: Auto-update toggle response
    this.socket.on('auto-updates-toggled', (data) => {
      console.log('Auto-updates toggled:', data);
      this.autoUpdatesEnabled = data.enabled;
      this.notifyHandlers('auto-updates-toggled', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.notifyHandlers('error', error);
    });
  }

  // SIMPLIFIED: Direct consciousness update handling
  handleConsciousnessUpdate(data) {
    if (!data) {
      console.warn('Received empty consciousness update');
      return;
    }

    // Validate data structure
    if (!this.validateConsciousnessData(data)) {
      console.error('Invalid consciousness data received:', data);
      return;
    }

    try {
      // Check if we're monitoring this character
      if (!this.monitoringCharacters.has(data.characterId)) {
        console.log(`Ignoring update for non-monitored character: ${data.characterId}`);
        return;
      }

      // Normalize state data
      const stateData = this.normalizeConsciousnessState(data.state);
      
      if (!stateData) {
        console.warn('No valid state data in consciousness update');
        return;
      }

      // Update state manager
      if (window.stateManager && typeof window.stateManager.updateConsciousnessData === 'function') {
        window.stateManager.updateConsciousnessData(stateData);
      } else {
        console.error('StateManager not available or updateConsciousnessData method missing');
        return;
      }

      // Notify other components
      this.notifyHandlers('consciousness-update', {
        characterId: data.characterId,
        state: stateData,
        timestamp: data.timestamp,
        type: data.type,
        reason: data.reason
      });

      console.log(`✅ Consciousness update processed: ${data.type} (${data.reason || 'unknown'})`);

    } catch (error) {
      console.error('Error processing consciousness update:', error);
      
      // Add error to state manager if available
      if (window.stateManager && typeof window.stateManager.addError === 'function') {
        window.stateManager.addError({
          type: 'SOCKET_UPDATE_ERROR',
          message: `Failed to process consciousness update: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Validate consciousness data structure
  validateConsciousnessData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.characterId || typeof data.characterId !== 'string') return false;
    if (!data.state || typeof data.state !== 'object') return false;
    if (!data.timestamp) return false;
    
    return true;
  }

  // Normalize consciousness state to ensure consistent structure
  normalizeConsciousnessState(state) {
    if (!state || typeof state !== 'object') return null;
    
    return {
      processes: Array.isArray(state.processes) ? state.processes : [],
      memory: state.memory && typeof state.memory === 'object' ? state.memory : {},
      threads: Array.isArray(state.threads) ? state.threads : [],
      system_errors: Array.isArray(state.system_errors) ? state.system_errors : [],
      resources: state.resources && typeof state.resources === 'object' ? state.resources : {},
      debug_hooks: Array.isArray(state.debug_hooks) ? state.debug_hooks : [],
      timestamp: state.timestamp || new Date().toISOString()
    };
  }

  // UPDATED: User interaction tracking
  recordUserInteraction(action) {
    this.lastUserInteraction = Date.now();
    console.log(`User interaction recorded: ${action}`);
  }

  // Character monitoring
  startMonitoring(characterId) {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`Starting monitoring for character: ${characterId}`);
    this.recordUserInteraction('start-monitoring');
    
    this.socket.emit('start-monitoring', { characterId });
    return true;
  }

  stopMonitoring(characterId) {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`Stopping monitoring for character: ${characterId}`);
    this.recordUserInteraction('stop-monitoring');
    
    this.socket.emit('stop-monitoring', { characterId });
    return true;
  }

  // UPDATED: Debug commands trigger consciousness updates
  executeDebugCommand(characterId, command, args = {}) {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`Executing debug command: ${command} for ${characterId}`);
    this.recordUserInteraction(`debug-command-${command}`);
    
    this.socket.emit('debug-command', {
      characterId,
      command,
      args
    });
    
    return true;
  }

  // UPDATED: Player interventions trigger consciousness updates
  applyPlayerIntervention(characterId, intervention) {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`Applying player intervention for ${characterId}:`, intervention.type);
    this.recordUserInteraction(`intervention-${intervention.type}`);
    
    this.socket.emit('player-intervention', {
      characterId,
      intervention
    });
    
    return true;
  }

  // ADDED: Manual update request
  requestUpdate(characterId, reason = 'user-request') {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`Requesting manual update for ${characterId}: ${reason}`);
    this.recordUserInteraction('manual-update-request');
    
    this.socket.emit('request-update', {
      characterId,
      reason
    });
    
    return true;
  }

  // ADDED: Toggle auto-updates
  toggleAutoUpdates(characterId, enabled) {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`${enabled ? 'Enabling' : 'Disabling'} auto-updates for ${characterId}`);
    this.recordUserInteraction('toggle-auto-updates');
    
    this.socket.emit('toggle-auto-updates', {
      characterId,
      enabled
    });
    
    return true;
  }

  // Connection management
  handleConnectionError(error) {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, 1000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyHandlers('max-reconnect-attempts-reached', { error });
    }
  }

  // Event handler management
  addHandler(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(callback);
  }

  removeHandler(event, callback) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(callback);
    }
  }

  notifyHandlers(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getMonitoringStatus() {
    return {
      connected: this.isConnected,
      monitoring: Array.from(this.monitoringCharacters),
      autoUpdatesEnabled: this.autoUpdatesEnabled,
      lastUserInteraction: this.lastUserInteraction
    };
  }

  // Cleanup
  destroy() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.eventHandlers.clear();
    this.monitoringCharacters.clear();
    this.isConnected = false;
  }
}

// Initialize global socket client
window.socketClient = new SocketClient();