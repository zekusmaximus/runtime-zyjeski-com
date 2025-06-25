class MonitorSocket {
  constructor(eventHandler) {
    this.socket = null;
    this.eventHandler = eventHandler;
  }

  connect() {
    // The socket-client.js script is loaded in the HTML, so io should be globally available.
    this.socket = io();

    this.socket.on('connect', () => this.eventHandler('connect'));
    this.socket.on('disconnect', () => this.eventHandler('disconnect'));
    this.socket.on('character-list', (data) => this.eventHandler('character-list', data));
    this.socket.on('consciousness-update', (data) => this.eventHandler('consciousness-update', data));
    this.socket.on('monitoring-started', (data) => this.eventHandler('monitoring-started', data));
    this.socket.on('monitoring-stopped', (data) => this.eventHandler('monitoring-stopped', data));
  }

  startMonitoring(characterId) {
    this.socket.emit('monitor:start', { characterId });
  }

  stopMonitoring(characterId) {
    this.socket.emit('monitor:stop', { characterId });
  }

  getCharacterList() {
    this.socket.emit('monitor:get-characters');
  }

  getFreshState(characterId) {
      this.socket.emit('monitor:get-state', { characterId });
  }

  clearErrors(characterId) {
      this.socket.emit('monitor:clear-errors', { characterId });
  }
}

export default MonitorSocket;
