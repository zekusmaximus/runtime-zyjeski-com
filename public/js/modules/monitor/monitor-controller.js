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
        // Handle different data structures for consciousness updates
        let consciousnessData = data.state || data.consciousness || data;
        this.state.update(consciousnessData);
        this.ui.updateAll(this.state.consciousnessData);
        break;
      case 'monitoring-started':
        this.state.setMonitoringStatus(true);
        // Handle different data structures for initial state
        let initialState = data.initialState || data.state || data.consciousness || data;
        this.state.update(initialState);
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
      console.log('[Ground State] Monitor connecting to character:', character.name);
      
      // First ensure we have the character in the dropdown
      this.ui.populateCharacterList([character]);
      
      // First ensure socket is connected
      if (this.socket && this.socket.socket && !this.socket.socket.isSocketConnected()) {
        console.log('[Ground State] Connecting socket for character monitoring');
        return this.socket.socket.connect().then(() => {
          console.log('[Ground State] Socket connected, setting up monitoring');
          this.ui.setSelectedCharacter(character.id);
          this.state.setConnectionStatus('connected');
          this.ui.updateConnectionStatus(this.state.connectionStatus);
          return this.startMonitoring(character.id);
        }).catch(error => {
          console.error('[Ground State] Failed to connect socket for monitoring:', error);
          this.state.setConnectionStatus('error');
          this.ui.updateConnectionStatus(this.state.connectionStatus);
          return false;
        });
      } else {
        // Socket already connected
        console.log('[Ground State] Socket already connected, setting up monitoring');
        this.ui.setSelectedCharacter(character.id);
        this.state.setConnectionStatus('connected');
        this.ui.updateConnectionStatus(this.state.connectionStatus);
        return this.startMonitoring(character.id);
      }
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
