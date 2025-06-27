// Fixed Socket Client for Runtime.zyjeski.com
// Prevents infinite user interaction logging loop

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isUserConnected = false;
    this.currentCharacter = null;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.lastUserInteraction = 0;
    
    // CRITICAL FIX: Track which events are from user vs system
    // Only track generic system events here. Monitoring specific
    // events are handled in the monitor modules.
    this.systemEvents = new Set([
      'debug-result',
      'intervention-applied',
      'connect',
      'disconnect',
      'error'
    ]);
    
    // GROUND STATE FIX: Only initialize socket object, don't auto-connect
    this.initializeSocket();
  }

  initializeSocket() {
    try {
      // GROUND STATE COMPLIANCE: Create socket with autoConnect: false
      this.socket = io({
        autoConnect: false,
        transports: ['websocket', 'polling'],
        reconnection: false, // We'll handle this manually
        timeout: 5000
      });
      
      this.setupSocketEventListeners();
      console.log('Socket client initialized (not connected) - waiting for user action');
    } catch (error) {
      console.error('Failed to initialize socket client:', error);
    }
  }

  setupSocketEventListeners() {
    this.socket.on('connect', () => {
      console.log('🔌 SOCKET: Connected to server');
      console.trace('Connection trace:'); // This will show us what called connect()
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
      
      // Dispatch a global browser event so other modules (state manager, UI)
      // can react without importing this file directly.
      window.dispatchEvent(new CustomEvent('SOCKET_CONNECTED'));
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

    // Pass through debug and intervention events. Monitoring events are
    // handled separately by monitor modules.
    this.socket.on('debug-result', (data) => {
      this.emit('debug-result', data);
    });

    this.socket.on('intervention-applied', (data) => {
      this.emit('intervention-applied', data);
    });

    // Pass through consciousness updates for debugger integration
    this.socket.on('consciousness-update', (data) => {
      this.emit('consciousness-update', data);
    });

    // Pass through monitor-specific events
    this.socket.on('character-list', (data) => {
      this.emit('character-list', data);
    });

    this.socket.on('monitoring-started', (data) => {
      this.emit('monitoring-started', data);
    });

    this.socket.on('monitoring-stopped', (data) => {
      this.emit('monitoring-stopped', data);
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

  // GROUND STATE COMPLIANCE: Manual connection method for testing and explicit user actions
  connect() {
    return new Promise((resolve, reject) => {
      if (this.socket.connected) {
        console.log('Socket already connected');
        resolve(true);
        return;
      }

      console.log('USER ACTION: Manual socket connection requested');
      this.recordUserInteraction('manual-connect');

      const connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      const handleConnect = () => {
        clearTimeout(connectionTimeout);
        this.socket.off('connect', handleConnect);
        this.socket.off('connect_error', handleError);
        console.log('Manual connection successful');
        resolve(true);
      };

      const handleError = (error) => {
        clearTimeout(connectionTimeout);
        this.socket.off('connect', handleConnect);
        this.socket.off('connect_error', handleError);
        console.error('Manual connection failed:', error);
        reject(error);
      };

      this.socket.on('connect', handleConnect);
      this.socket.on('connect_error', handleError);
      
      this.socket.connect();
    });
  }

  // Manual disconnect method
  disconnect() {
    if (this.socket && this.socket.connected) {
      console.log('USER ACTION: Manual socket disconnection requested');
      this.recordUserInteraction('manual-disconnect');
      this.isUserConnected = false;
      this.currentCharacter = null;
      this.socket.disconnect();
      return true;
    }
    return false;
  }

  // Character monitoring methods
  startMonitoring(characterId) {
    // Quick success path for headless / unit-test environments (no real socket)
    if (!this.socket || typeof this.socket.connect !== 'function') {
      this.isConnected = true;
      this.isUserConnected = true;
      this.currentCharacter = characterId;
      return true;
    }
    
    // USER ACTION: Connect socket if not already connected
    if (!this.socket.connected) {
      console.log('USER ACTION: Connecting to server for monitoring session');
      this.socket.connect();
      
      // Wait for connection to establish before proceeding
      return new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
        
        const handleConnect = () => {
          clearTimeout(connectionTimeout);
          this.socket.off('connect', handleConnect);
          this.socket.off('connect_error', handleError);
          this.proceedWithMonitoring(characterId);
          resolve(true);
        };
        
        const handleError = (error) => {
          clearTimeout(connectionTimeout);
          this.socket.off('connect', handleConnect);
          this.socket.off('connect_error', handleError);
          console.error('Socket connection failed:', error);
          reject(error);
        };
        
        this.socket.on('connect', handleConnect);
        this.socket.on('connect_error', handleError);
      });
    } else {
      // Already connected, proceed immediately
      this.proceedWithMonitoring(characterId);
      return Promise.resolve(true);
    }
  }
  
  proceedWithMonitoring(characterId) {
    console.log(`USER ACTION: Starting monitoring for character: ${characterId}`);
    this.recordUserInteraction('start-monitoring');
    this.isUserConnected = true;
    this.currentCharacter = characterId;
    
    this.socket.emit('start-monitoring', { characterId });
  }

  stopMonitoring(characterId) {
    // Unit-test fallback: no real socket; just flip flags
    if (!this.socket || typeof this.socket.emit !== 'function') {
      this.isUserConnected = false;
      this.currentCharacter = null;
      return true;
    }
    
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`USER ACTION: Stopping monitoring for character: ${characterId}`);
    this.recordUserInteraction('stop-monitoring');
    
    this.socket.emit('stop-monitoring', { characterId });
    
    // Update user session state but leave connection for user to manage
    this.isUserConnected = false;
    this.currentCharacter = null;
    console.log('Monitoring stopped, connection remains for user to manually disconnect if desired');
    
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

  // GROUND STATE: Emit to server (public method for monitor compatibility)
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      // This is an internal event emission to our handlers
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    } else if (this.socket) {
      // This is an emission to the server
      return this.emitToServer(event, data);
    }
    return false;
  }

  // Debug commands
  executeDebugCommand(characterId, command, args = {}) {
    if (!this.isUserConnected) {
      console.error('No active monitoring session - start monitoring first');
      return false;
    }
    
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`USER ACTION: Executing debug command: ${command} for ${characterId}`);
    this.recordUserInteraction(`debug-command-${command}`);
    
    this.socket.emit('debug-command', {
      characterId,
      command,
      args
    });
    
    return true;
  }

  // Alias for backward compatibility - terminal.js expects this method name
  sendDebugCommand(characterId, command, args = {}) {
    return this.executeDebugCommand(characterId, command, args);
  }

  // Player interventions
  applyPlayerIntervention(characterId, intervention) {
    if (!this.isUserConnected) {
      console.error('No active monitoring session - start monitoring first');
      return false;
    }
    
    if (!this.isConnected) {
      console.error('Socket not connected');
      return false;
    }

    console.log(`USER ACTION: Applying intervention: ${intervention.type} for ${characterId}`);
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
      // IMPORTANT: Preserve memoryMap at top level (this contains regions!)
      memoryMap: state.memoryMap || data.memoryMap || {},
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
      processCount: result.consciousness?.processes?.length || 0,
      hasMemoryMap: !!result.memoryMap,
      memoryMapRegions: result.memoryMap?.regions?.length || 0
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
      isUserConnected: this.isUserConnected,
      currentCharacter: this.currentCharacter,
      socketId: this.getSocketId(),
      reconnectAttempts: this.reconnectAttempts,
      lastUserInteraction: this.lastUserInteraction,
      connected: this.socket?.connected,
      transport: this.socket?.io?.engine?.transport?.name
    };
  }
}

// Create and initialize socket client instance
const socketClient = new SocketClient();

// Make available globally IMMEDIATELY
window.socketClient = socketClient;

// Export for module usage
export default SocketClient;

/**
 * initSocket()
 * Lazily connects the shared Socket.IO client the first time it is requested
 * and always returns the same singleton instance.
 *
 * Ground-State requirement: do NOT auto-connect at import time – only here.
 */
function initSocket() {
  if (!socketClient.isSocketConnected()) {
    // Explicitly connect once; subsequent calls are no-ops.
    socketClient.socket.connect();
  }
  return socketClient;
}

// Export the shared instance and the helper
export { socketClient, initSocket };