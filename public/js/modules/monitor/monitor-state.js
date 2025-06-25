class MonitorState {
  constructor() {
    this.connectionStatus = 'disconnected'; // disconnected, connected, error
    this.isMonitoring = false;
    this.selectedCharacter = null;
    this.consciousnessData = null;
  }

  setConnectionStatus(status) {
    this.connectionStatus = status;
  }

  setMonitoringStatus(isMonitoring) {
    this.isMonitoring = isMonitoring;
  }

  setSelectedCharacter(characterId) {
    this.selectedCharacter = characterId;
  }

  update(data) {
    this.consciousnessData = data;
  }
}

export default MonitorState;