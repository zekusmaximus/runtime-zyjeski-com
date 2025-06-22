// Rate Limited Socket Client - Handles excessive server updates gracefully
class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.monitoringCharacters = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = new Map();
    
    // ADDED: Rate limiting for consciousness updates
    this.updateRateLimit = {
      lastUpdate: 0,
      minInterval: 500, // Minimum 500ms between updates
      pendingUpdate: null,
      updateQueue: new Map() // Track updates per character
    };
    
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

    // UPDATED: Add rate limiting to consciousness updates
    this.socket.on('consciousness-update', (data) => {
      console.log('Consciousness update received:', data);
      
      try {
        this.handleConsciousnessUpdateWithRateLimit(data);
      } catch (error) {
        console.error('Error handling consciousness update:', error);
      }
    });

    this.socket.on('intervention-applied', (data) => {
      this.notifyHandlers('intervention-applied', data);
    });

    this.socket.on('debug-hook-triggered', (data) => {
      this.notifyHandlers('debug-hook-triggered', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.notifyHandlers('error', error);
    });
  }

  // ADDED: Rate limited consciousness update handler
  handleConsciousnessUpdateWithRateLimit(data) {
    if (!data || !data.characterId) {
      console.warn('Invalid consciousness update data');
      return;
    }

    const now = Date.now();
    const characterId = data.characterId;
    
    // Store the latest update for this character
    this.updateRateLimit.updateQueue.set(characterId, data);
    
    // Check if we should process immediately or defer
    const timeSinceLastUpdate = now - this.updateRateLimit.lastUpdate;
    
    if (timeSinceLastUpdate >= this.updateRateLimit.minInterval) {
      // Process immediately
      this.processQueuedUpdates();
    } else {
      // Schedule processing if not already scheduled
      if (!this.updateRateLimit.pendingUpdate) {
        const remainingTime = this.updateRateLimit.minInterval - timeSinceLastUpdate;
        
        this.updateRateLimit.pendingUpdate = setTimeout(() => {
          this.processQueuedUpdates();
        }, remainingTime);
      }
    }
  }

  // ADDED: Process queued updates (only the latest for each character)
  processQueuedUpdates() {
    const now = Date.now();
    
    // Clear pending update
    if (this.updateRateLimit.pendingUpdate) {
      clearTimeout(this.updateRateLimit.pendingUpdate);
      this.updateRateLimit.pendingUpdate = null;
    }
    
    // Process the latest update for each character
    for (const [characterId, data] of this.updateRateLimit.updateQueue) {
      try {
        this.handleConsciousnessUpdate(data);
      } catch (error) {
        console.error(`Error processing update for ${characterId}:`, error);
      }
    }
    
    // Clear the queue and update timestamp
    this.updateRateLimit.updateQueue.clear();
    this.updateRateLimit.lastUpdate = now;
    
    console.log(`🔄 Processed consciousness updates (rate limited)`);
  }

  // FIXED: Add robust data validation and error handling
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

      // FIXED: Ensure state object exists and has expected structure
      const stateData = this.normalizeConsciousnessState(data.state);
      
      if (!stateData) {
        console.warn('No valid state data in consciousness update');
        return;
      }

      // Update state manager safely
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
        type: data.type
      });

    } catch (error) {
      console.error('Error processing consciousness update:', error);
      
      // Add error to state manager if available
      if (window.stateManager && typeof window.stateManager.addError === 'function') {
        window.stateManager.addError({
          type: 'consciousness_update_error',
          message: `Failed to process consciousness update: ${error.message}`,
          character_id: data.characterId,
          raw_data: data
        });
      }
    }
  }

  // FIXED: Add data validation method
  validateConsciousnessData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required fields
    if (!data.characterId || typeof data.characterId !== 'string') {
      console.error('Missing or invalid characterId in consciousness data');
      return false;
    }

    if (!data.timestamp) {
      console.error('Missing timestamp in consciousness data');
      return false;
    }

    // State is optional for some update types, but if present should be an object
    if (data.state && typeof data.state !== 'object') {
      console.error('Invalid state object in consciousness data');
      return false;
    }

    return true;
  }

  // CORRECTED: Based on actual server data structure
  normalizeConsciousnessState(state) {
    if (!state || typeof state !== 'object') {
      return null;
    }

    // The server sends state directly as consciousness data (no wrapper)
    // Based on debug output: state has processes, memory, resources directly
    let consciousnessData = state;
    
    if (!consciousnessData || typeof consciousnessData !== 'object') {
      console.warn('No consciousness data found in state');
      return null;
    }

    // Validate that this looks like consciousness data
    if (!consciousnessData.processes && !consciousnessData.memory && !consciousnessData.resources) {
      console.warn('State does not contain expected consciousness properties');
      return null;
    }

    // Ensure all expected properties exist with defaults
    return {
      processes: Array.isArray(consciousnessData.processes) ? consciousnessData.processes : [],
      resources: consciousnessData.resources && typeof consciousnessData.resources === 'object' ? consciousnessData.resources : {},
      system_errors: Array.isArray(consciousnessData.system_errors) ? consciousnessData.system_errors : [],
      memory: consciousnessData.memory || null,
      threads: Array.isArray(consciousnessData.threads) ? consciousnessData.threads : []
    };
  }

  handleConnectionError(error) {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect();
      }, 1000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyHandlers('max-reconnects-reached', { error });
    }
  }

  // Event handler management
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  notifyHandlers(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Monitoring methods
  startMonitoring(characterId) {
    if (!this.isConnected) {
      console.warn('Cannot start monitoring: not connected to server');
      return false;
    }

    if (!characterId) {
      console.error('Cannot start monitoring: characterId is required');
      return false;
    }

    try {
      this.socket.emit('start-monitoring', { characterId });
      this.monitoringCharacters.add(characterId);
      console.log('Monitoring started for character:', characterId);
      return true;
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      return false;
    }
  }

  stopMonitoring(characterId) {
    if (!this.isConnected || !characterId) {
      return false;
    }

    try {
      this.socket.emit('stop-monitoring', { characterId });
      this.monitoringCharacters.delete(characterId);
      console.log('Monitoring stopped for character:', characterId);
      return true;
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
      return false;
    }
  }

  // Intervention methods
  applyIntervention(characterId, intervention) {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket.emit('apply-intervention', {
          characterId,
          intervention
        }, (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Intervention failed'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Process management
  killProcess(characterId, processId) {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket.emit('kill-process', {
          characterId,
          processId
        }, (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Failed to kill process'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  restartProcess(characterId, processId) {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket.emit('restart-process', {
          characterId,
          processId
        }, (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || 'Failed to restart process'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  getConnectionInfo() {
    return {
      connected: this.isConnected,
      monitoringCharacters: Array.from(this.monitoringCharacters),
      reconnectAttempts: this.reconnectAttempts,
      updateRateLimit: {
        lastUpdate: this.updateRateLimit.lastUpdate,
        queueSize: this.updateRateLimit.updateQueue.size,
        hasPendingUpdate: !!this.updateRateLimit.pendingUpdate
      }
    };
  }

  // ADDED: Manual rate limit control
  setUpdateRateLimit(intervalMs) {
    this.updateRateLimit.minInterval = Math.max(100, intervalMs); // Minimum 100ms
    console.log(`Update rate limit set to ${this.updateRateLimit.minInterval}ms`);
  }

  disconnect() {
    // Clear any pending updates
    if (this.updateRateLimit.pendingUpdate) {
      clearTimeout(this.updateRateLimit.pendingUpdate);
      this.updateRateLimit.pendingUpdate = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
    }
    this.isConnected = false;
    this.monitoringCharacters.clear();
    this.updateRateLimit.updateQueue.clear();
  }
}

// Create global socket client instance
window.socketClient = new SocketClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocketClient;
}