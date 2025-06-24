// Fix in public/js/socket-client.js - Prevent multiple connections

class SocketClient {
  constructor() {
    // Prevent multiple instances
    if (window.socketClientInstance) {
      return window.socketClientInstance;
    }
    
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.lastUserInteraction = Date.now();
    this.eventHandlers = new Map();
    
    this.init();
    
    // Store instance globally
    window.socketClientInstance = this;
  }

  init() {
    // Only initialize if not already connected
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected, skipping initialization');
      return;
    }
    
    this.setupSocket();
    this.setupEventHandlers();
  }

  setupSocket() {
    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.socket = io({
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      // Prevent multiple connections
      forceNew: false,
      multiplex: true
    });
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason });
      
      // Only auto-reconnect for certain reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }
      
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnection();
    });

    // Consciousness monitoring events
    this.socket.on('monitoring-started', (data) => {
      console.log('Monitoring started for character:', data.characterId);
      this.emit('monitoring-started', data);
    });

    this.socket.on('monitoring-stopped', (data) => {
      console.log('Monitoring stopped for character:', data.characterId);
      this.emit('monitoring-stopped', data);
    });

    this.socket.on('consciousness-update', (data) => {
      this.emit('consciousness-update', this.validateConsciousnessData(data));
    });

    this.socket.on('debug-result', (data) => {
      this.emit('debug-result', data);
    });

    this.socket.on('intervention-applied', (data) => {
      this.emit('intervention-applied', data);
    });

    this.socket.on('system-resources', (data) => {
      this.emit('system-resources', data);
    });

    this.socket.on('error-logs', (data) => {
      this.emit('error-logs', data);
    });

    this.socket.on('memory-allocation', (data) => {
      this.emit('memory-allocation', data);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  // Event emitter functionality
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  emit(event, data) {
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

  // Validate consciousness data structure
  validateConsciousnessData(data) {
    if (!data || typeof data !== 'object') {
      return { processes: [], memory: {}, resources: {}, system_errors: [], threads: [] };
    }

    const state = data.state || data;
    
    return {
      characterId: data.characterId || state.characterId,
      consciousness: {
        processes: Array.isArray(state.processes) ? state.processes : [],
        memory: state.memory && typeof state.memory === 'object' ? state.memory : {},
        threads: Array.isArray(state.threads) ? state.threads : [],
        system_errors: Array.isArray(state.system_errors) ? state.system_errors : [],
        resources: state.resources && typeof state.resources === 'object' ? state.resources : {},
        debug_hooks: Array.isArray(state.debug_hooks) ? state.debug_hooks : [],
        timestamp: state.timestamp || new Date().toISOString()
      },
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  // User interaction tracking
  recordUserInteraction(action) {
    this.lastUserInteraction = Date.now();
    console.log(`User interaction recorded: ${action}`);
  }

  // Character monitoring methods
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

  // Send events to server
  emit(event, data) {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    this.recordUserInteraction(`emit-${event}`);
    this.socket.emit(event, data);
    return true;
  }

  // Debug commands
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

  // Player interventions
  applyPlayerIntervention(characterId, intervention) {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`Applying intervention: ${intervention.type} for ${characterId}`);
    this.recordUserInteraction(`intervention-${intervention.type}`);
    
    this.socket.emit('player-intervention', {
      characterId,
      intervention
    });
    
    return true;
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  // Clean disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    
    // Clear global instance
    if (window.socketClientInstance === this) {
      window.socketClientInstance = null;
    }
  }
}

// Initialize socket client as singleton
if (!window.socketClient && !window.socketClientInstance) {
  window.socketClient = new SocketClient();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (window.socketClient) {
    window.socketClient.disconnect();
  }
});

export default SocketClient;