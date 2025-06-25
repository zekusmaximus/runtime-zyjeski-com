// Fixed Socket Client for Runtime.zyjeski.com
// Prevents infinite user interaction logging loop

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.lastUserInteraction = 0;
    
    // CRITICAL FIX: Track which events are from user vs system
    this.systemEvents = new Set([
      'consciousness-update',
      'monitoring-started', 
      'monitoring-stopped',
      'debug-result',
      'intervention-applied',
      'system-resources',
      'error-logs',
      'memory-allocation',
      'refresh-monitor',
      'connect',
      'disconnect',
      'error'
    ]);
    
    this.initialize();
  }

  initialize() {
    try {
      this.socket = io({
        transports: ['websocket', 'polling'],
        reconnection: false, // We'll handle this manually
        timeout: 5000
      });
      
      this.setupSocketEventListeners();
      console.log('Socket client initialized');
    } catch (error) {
      console.error('Failed to initialize socket client:', error);
    }
  }

  setupSocketEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason });
      
      // Only auto-reconnect for certain reasons
      if (reason === 'io server disconnect') {
        return;
      }
      
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleReconnection();
    });

    // Consciousness monitoring events - FIXED: No user interaction logging for system events
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

  // FIXED: Internal emit that doesn't trigger user interaction logging
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

  // FIXED: User interaction tracking only for actual user actions
  recordUserInteraction(action) {
    // Rate limit user interaction logging
    const now = Date.now();
    if (now - this.lastUserInteraction < 100) {
      return; // Skip if less than 100ms since last logged interaction
    }
    
    this.lastUserInteraction = now;
    console.log(`User interaction: ${action}`);
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

  refreshMonitor() {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    this.recordUserInteraction('refresh-monitor');
    this.socket.emit('refresh-monitor');
    return true;
  }

  // FIXED: Send events to server without logging every system request as user interaction
  emitToServer(event, data) {
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`📤 SOCKET CLIENT: Emitting '${event}' to server`, data);

    // Only log as user interaction if it's truly a user-initiated action
    if (!this.systemEvents.has(event) && !event.startsWith('get-')) {
      this.recordUserInteraction(`emit-${event}`);
    }
    
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

  // Validate consciousness data structure
  validateConsciousnessData(data) {
    // DEBUG: Log what we're receiving
    console.log('🔍 SOCKET: validateConsciousnessData received:', {
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : 'null',
      hasState: !!data?.state,
      hasResources: !!data?.resources,
      hasConsciousness: !!data?.consciousness,
      consciousnessKeys: data?.consciousness ? Object.keys(data.consciousness) : 'no consciousness'
    });

    if (!data || typeof data !== 'object') {
      return { processes: [], memory: {}, resources: {}, system_errors: [], threads: [] };
    }

    const state = data.state || data;
    
    const result = {
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

    // DEBUG: Log what we're returning
    console.log('🔍 SOCKET: validateConsciousnessData returning:', {
      hasConsciousness: !!result.consciousness,
      consciousnessResources: result.consciousness?.resources ? Object.keys(result.consciousness.resources) : 'no resources',
      processCount: result.consciousness?.processes?.length || 0
    });

    return result;
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  // Enhanced debugging info
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      socketId: this.getSocketId(),
      reconnectAttempts: this.reconnectAttempts,
      lastUserInteraction: this.lastUserInteraction,
      connected: this.socket?.connected,
      transport: this.socket?.io?.engine?.transport?.name
    };
  }
}

// Export for module usage
export default SocketClient;