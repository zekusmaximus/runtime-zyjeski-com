
import MonitorSocket from './monitor-socket.js';
import MonitorUI from './monitor-ui.js';
import MonitorState from './monitor-state.js';

class MonitorController {
  constructor() {
    this.state = new MonitorState();
    this.ui = new MonitorUI();
    this.socket = new MonitorSocket(this.handleSocketEvent.bind(this));

    this.initialize();
  }

  initialize() {
    this.ui.initialize(this);
    this.socket.connect();
    this.socket.getCharacterList();
  }

  handleSocketEvent(eventType, data) {
    switch (eventType) {
      case 'connect':
        this.state.setConnectionStatus('connected');
        this.ui.updateConnectionStatus(this.state.connectionStatus);
        break;
      case 'character-list':
        this.ui.populateCharacterList(data);
        break;
      case 'disconnect':
        this.state.setConnectionStatus('disconnected');
        this.ui.updateConnectionStatus(this.state.connectionStatus);
        break;
      case 'consciousness-update':
        this.state.update(data.state);
        this.ui.updateAll(this.state.consciousnessData);
        break;
      case 'monitoring-started':
        this.state.setMonitoringStatus(true);
        this.state.update(data.initialState);
        this.ui.updateAll(this.state.consciousnessData);
        this.ui.setMonitoringButtonState(true);
        break;
      case 'monitoring-stopped':
        this.state.setMonitoringStatus(false);
        this.ui.setMonitoringButtonState(false);
        break;
    }
  }

  connectToCharacter(character) {
    if (character && character.id) {
      this.ui.setSelectedCharacter(character.id);
      this.startMonitoring(character.id);
    }
  }

  startMonitoring(characterId) {
    this.state.setSelectedCharacter(characterId);
    this.socket.startMonitoring(characterId);
  }

  stopMonitoring() {
    this.socket.stopMonitoring(this.state.selectedCharacter);
  }

  refreshData() {
    if (this.state.isMonitoring) {
      this.socket.getFreshState(this.state.selectedCharacter);
    }
  }
  
  clearErrors() {
    this.ui.clearErrorLog();
    if (this.state.isMonitoring) {
        this.socket.clearErrors(this.state.selectedCharacter);
    }
  }
}

export default MonitorController;
