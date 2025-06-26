
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
    // GROUND STATE: Only initialize UI, don't auto-connect or auto-request data
    this.ui.initialize(this);
    this.socket.connect(); // Connect to shared socket client (doesn't auto-connect to server)
    
    // GROUND STATE: Don't auto-request character list
    // Characters will be requested when user action triggers it
    console.log('Monitor controller initialized - waiting for user action');
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
      return this.startMonitoring(character.id);
    }
    return Promise.resolve(false);
  }

  startMonitoring(characterId) {
    console.log('[Ground State] Monitor controller starting monitoring for:', characterId);
    this.state.setSelectedCharacter(characterId);
    
    // Handle the promise returned by socket.startMonitoring
    return this.socket.startMonitoring(characterId).then(() => {
      console.log('[Ground State] Monitor successfully started for:', characterId);
      return true;
    }).catch(error => {
      console.error('[Ground State] Failed to start monitoring:', error);
      throw error;
    });
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
