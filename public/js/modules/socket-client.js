// public/js/modules/socket-client.js
import logger from '/js/logger.js';

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    console.log('Socket client initialized');
  }

  async connect() {
    if (this.connected) {
      logger.debug('Socket already connected');
      return this.socket;
    }

    try {
      // Socket.io is loaded globally via script tag in HTML
      if (!window.io) {
        throw new Error('Socket.io not loaded');
      }

      this.socket = io({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts
      });

      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          logger.info('Connected to server');
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          logger.error('Connection error:', error);
          reject(error);
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);
      });
    } catch (error) {
      logger.error('Failed to connect:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      logger.warn('Disconnected:', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('error', (error) => {
      logger.error('Socket error:', error);
      this.emit('error', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.connected = true;
      logger.info('Reconnected after', attemptNumber, 'attempts');
      this.emit('reconnected', attemptNumber);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnectAttempts = attemptNumber;
      logger.debug('Reconnection attempt', attemptNumber);
    });

    // Forward consciousness-related events
    this.socket.on('consciousness-update', (data) => {
      this.emit('consciousness-update', data);
    });

    this.socket.on('debug-result', (data) => {
      this.emit('debug-result', data);
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
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  send(event, data) {
    if (!this.connected || !this.socket) {
      logger.warn('Cannot send - not connected');
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  startMonitoring(characterId) {
    return this.send('start-monitoring', { characterId });
  }

  stopMonitoring(characterId) {
    return this.send('stop-monitoring', { characterId });
  }

  executeDebugCommand(characterId, command, args = {}) {
    return this.send('debug-command', { characterId, command, args });
  }

  applyIntervention(characterId, intervention) {
    return this.send('player-intervention', { characterId, intervention });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      logger.info('Disconnected from server');
    }
  }
}

// Create singleton instance
const socketClient = new SocketClient();

// Auto-connect when module loads
socketClient.connect().catch(err => {
  logger.error('Initial connection failed:', err);
});

// Make available globally
window.socketClient = socketClient;

export default socketClient;