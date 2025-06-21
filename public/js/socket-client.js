// WebSocket Client for Real-time Communication
class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    this.eventHandlers = new Map();
    this.init();
  }

  init() {
    this.setupEventHandlers();
  }

  connect() {
    try {
      this.socket = io({
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      });

      this.setupSocketEvents();
      
    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
      this.handleConnectionError();
    }
  }

  setupSocketEvents() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.updateConnectionStatus(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
      this.updateConnectionStatus(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }
      
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleConnectionError();
    });

    // Consciousness monitoring events
    this.socket.on('consciousness-update', (data) => {
      this.handleConsciousnessUpdate(data);
    });

    this.socket.on('monitoring-started', (data) => {
      console.log('Monitoring started for character:', data.characterId);
      window.stateManager.startMonitoring();
    });

    this.socket.on('monitoring-stopped', (data) => {
      console.log('Monitoring stopped for character:', data.characterId);
      window.stateManager.stopMonitoring();
    });

    // Debug events
    this.socket.on('debug-result', (data) => {
      this.handleDebugResult(data);
    });

    this.socket.on('intervention-applied', (data) => {
      console.log('Player intervention applied:', data);
      this.notifyHandlers('intervention-applied', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handleSocketError(error);
    });
  }

  setupEventHandlers() {
    // Subscribe to state changes
    window.stateManager.subscribe('connectionStatus', (status) => {
      if (window.app) {
        window.app.updateConnectionStatus(status === 'connected');
      }
    });
  }

  // Connection management
  updateConnectionStatus(connected) {
    const status = connected ? 'connected' : 'disconnected';
    window.stateManager.setConnectionStatus(status);
  }

  handleConnectionError() {
    this.isConnected = false;
    this.updateConnectionStatus(false);
    this.handleReconnection();
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      if (window.app) {
        window.app.showError('Connection lost. Please refresh the page.');
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        this.connect();
      }
    }, delay);
  }

  // Event emission methods
  startMonitoring(characterId) {
    if (!this.isConnected) {
      console.warn('Cannot start monitoring: not connected');
      return;
    }

    this.socket.emit('start-monitoring', { characterId });
  }

  stopMonitoring(characterId) {
    if (!this.isConnected) {
      console.warn('Cannot stop monitoring: not connected');
      return;
    }

    this.socket.emit('stop-monitoring', { characterId });
  }

  sendDebugCommand(characterId, command, args = {}) {
    if (!this.isConnected) {
      console.warn('Cannot send debug command: not connected');
      return;
    }

    this.socket.emit('debug-command', {
      characterId,
      command,
      args
    });
  }

  sendPlayerIntervention(characterId, intervention) {
    if (!this.isConnected) {
      console.warn('Cannot send intervention: not connected');
      return;
    }

    this.socket.emit('player-intervention', {
      characterId,
      intervention
    });
  }

  // Event handling methods
  handleConsciousnessUpdate(data) {
    console.log('Consciousness update received:', data);
    
    // Update state manager
    if (data.state) {
      window.stateManager.updateConsciousnessData(data.state.consciousness);
    }
    
    // Notify registered handlers
    this.notifyHandlers('consciousness-update', data);
  }

  handleDebugResult(data) {
    console.log('Debug result received:', data);
    
    // Add to terminal if terminal is active
    if (window.terminal) {
      window.terminal.addDebugResult(data);
    }
    
    // Notify handlers
    this.notifyHandlers('debug-result', data);
  }

  handleSocketError(error) {
    console.error('Socket error:', error);
    
    if (window.app) {
      window.app.showError('Communication error occurred');
    }
  }

  // Event handler registration
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  notifyHandlers(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.updateConnectionStatus(false);
  }

  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  // Debug methods
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket ? this.socket.id : null,
      transport: this.socket ? this.socket.io.engine.transport.name : null
    };
  }
}

// Create global socket client instance
window.socketClient = new SocketClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocketClient;
}

