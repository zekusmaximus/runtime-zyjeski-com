class MonitorSocket {
  constructor(eventHandler) {
    this.socket = null;
    this.eventHandler = eventHandler;
    this.isUsingSharedSocket = false;
  }

  connect() {
    // GROUND STATE COMPLIANCE: Only use the shared socket client
    if (!window.socketClient) {
      console.error('GROUND STATE VIOLATION: No socket client available - cannot create direct connection');
      throw new Error('Socket client must be available for Ground State compliance');
    }
    
    console.log('Monitor using shared Ground State compliant socket');
    this.socket = window.socketClient;
    this.isUsingSharedSocket = true;
    this.setupEventHandlers();
    return true;
  }

  setupEventHandlers() {
    // GROUND STATE: Use the shared socket client's event system
    this.socket.on('connected', () => this.eventHandler('connect'));
    this.socket.on('disconnected', () => this.eventHandler('disconnect'));
    this.socket.on('character-list', (data) => this.eventHandler('character-list', data));
    this.socket.on('consciousness-update', (data) => this.eventHandler('consciousness-update', data));
    this.socket.on('monitoring-started', (data) => this.eventHandler('monitoring-started', data));
    this.socket.on('monitoring-stopped', (data) => this.eventHandler('monitoring-stopped', data));
  }

  startMonitoring(characterId) {
    // GROUND STATE: Always use shared socket client and ensure connection
    if (!this.socket) {
      throw new Error('Socket not initialized - call connect() first');
    }
    
    // Ensure socket is connected before starting monitoring
    if (!this.socket.isSocketConnected()) {
      console.log('[Ground State] Connecting socket for monitoring request');
      
      // Connect first, then start monitoring
      return this.socket.connect().then(() => {
        console.log('[Ground State] Socket connected, starting monitoring');
        this.socket.emitToServer('monitor:start', { characterId });
        return true;
      }).catch(error => {
        console.error('[Ground State] Failed to connect for monitoring:', error);
        throw error;
      });
    } else {
      console.log('[Ground State] Socket already connected, starting monitoring');
      this.socket.emitToServer('monitor:start', { characterId });
      return Promise.resolve(true);
    }
  }

  stopMonitoring(characterId) {
    // GROUND STATE: Always use shared socket client
    if (!this.socket) {
      throw new Error('Socket not initialized - call connect() first');
    }
    this.socket.emitToServer('monitor:stop', { characterId });
  }

  getCharacterList() {
    // GROUND STATE: Always use shared socket client
    if (!this.socket) {
      throw new Error('Socket not initialized - call connect() first');
    }
    this.socket.emitToServer('monitor:get-characters');
  }

  getFreshState(characterId) {
    // GROUND STATE: Always use shared socket client
    if (!this.socket) {
      throw new Error('Socket not initialized - call connect() first');
    }
    this.socket.emitToServer('refresh-monitor', { characterId });
  }

  clearErrors(characterId) {
    // GROUND STATE: Always use shared socket client
    if (!this.socket) {
      throw new Error('Socket not initialized - call connect() first');
    }
    this.socket.emitToServer('monitor:clear-errors', { characterId });
  }
}

export default MonitorSocket;
