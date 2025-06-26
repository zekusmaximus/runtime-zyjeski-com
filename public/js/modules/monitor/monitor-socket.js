class MonitorSocket {
  constructor(eventHandler) {
    this.socket = null;
    this.eventHandler = eventHandler;
  }

  connect() {
    // Wait for socket client to be available
    if (this.waitForSocketClient()) {
      return;
    }
    
    // If socket client not available immediately, fall back to direct connection
    console.warn('No socket client available, falling back to direct io() connection');
    this.socket = io();
    this.setupDirectEventHandlers();
  }

  waitForSocketClient() {
    // Check if socket client is available and has the method
    if (window.socketClient && 
        typeof window.socketClient.isSocketConnected === 'function' && 
        window.socketClient.isSocketConnected()) {
      console.log('Monitor using existing socket connection');
      this.socket = window.socketClient;
      this.setupEventHandlers();
      return true;
    }
    
    // If socket client exists but not connected, wait for it
    if (window.socketClient && typeof window.socketClient.isSocketConnected === 'function') {
      console.log('Socket client exists but not connected, waiting...');
      const checkConnection = () => {
        if (window.socketClient.isSocketConnected()) {
          console.log('Socket client now connected, using shared connection');
          this.socket = window.socketClient;
          this.setupEventHandlers();
        } else {
          // If still not connected after a reasonable time, fall back
          setTimeout(() => {
            if (!this.socket) {
              console.warn('Socket client connection timeout, falling back to direct connection');
              this.socket = io();
              this.setupDirectEventHandlers();
            }
          }, 2000);
        }
      };
      
      // Listen for connection
      window.socketClient.on('connected', checkConnection);
      setTimeout(checkConnection, 100); // Check again soon
      return true;
    }
    
    return false;
  }

  setupEventHandlers() {
    // Use the shared socket client's event system
    this.socket.on('connected', () => this.eventHandler('connect'));
    this.socket.on('disconnected', () => this.eventHandler('disconnect'));
    this.socket.on('character-list', (data) => this.eventHandler('character-list', data));
    this.socket.on('consciousness-update', (data) => this.eventHandler('consciousness-update', data));
    this.socket.on('monitoring-started', (data) => this.eventHandler('monitoring-started', data));
    this.socket.on('monitoring-stopped', (data) => this.eventHandler('monitoring-stopped', data));
  }

  setupDirectEventHandlers() {
    // Direct socket.io event handlers (fallback)
    this.socket.on('connect', () => this.eventHandler('connect'));
    this.socket.on('disconnect', () => this.eventHandler('disconnect'));
    this.socket.on('character-list', (data) => this.eventHandler('character-list', data));
    this.socket.on('consciousness-update', (data) => this.eventHandler('consciousness-update', data));
    this.socket.on('monitoring-started', (data) => this.eventHandler('monitoring-started', data));
    this.socket.on('monitoring-stopped', (data) => this.eventHandler('monitoring-stopped', data));
  }

  startMonitoring(characterId) {
    if (window.socketClient) {
      window.socketClient.emitToServer('monitor:start', { characterId });
    } else {
      this.socket.emit('monitor:start', { characterId });
    }
  }

  stopMonitoring(characterId) {
    if (window.socketClient) {
      window.socketClient.emitToServer('monitor:stop', { characterId });
    } else {
      this.socket.emit('monitor:stop', { characterId });
    }
  }

  getCharacterList() {
    if (window.socketClient) {
      window.socketClient.emitToServer('monitor:get-characters');
    } else {
      this.socket.emit('monitor:get-characters');
    }
  }

  getFreshState(characterId) {
    if (window.socketClient) {
      window.socketClient.emitToServer('refresh-monitor', { characterId });
    } else {
      this.socket.emit('refresh-monitor', { characterId });
    }
  }

  clearErrors(characterId) {
    if (window.socketClient) {
      window.socketClient.emitToServer('monitor:clear-errors', { characterId });
    } else {
      this.socket.emit('monitor:clear-errors', { characterId });
    }
  }
}

export default MonitorSocket;
