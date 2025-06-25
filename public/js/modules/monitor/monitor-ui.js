export default class MonitorUI {
  constructor() {
    this.refreshBtn = document.getElementById('refreshMonitor');
    this.toggleBtn = document.getElementById('toggleMonitoring');
    this.connectionStatus = document.getElementById('connectionStatus');
    this.resourceMeters = document.getElementById('resourceMeters');
    this.processTable = document.getElementById('processTable');
    this.memoryVisualization = document.getElementById('memoryVisualization');
    this.errorLog = document.getElementById('errorLog');
    this.lastUpdate = document.querySelector('.last-update-time');
  }

  updateResources(resources) {
    if (!this.resourceMeters) return;
    this.resourceMeters.textContent = JSON.stringify(resources, null, 2);
  }

  updateProcesses(processes) {
    if (!this.processTable) return;
    this.processTable.textContent = JSON.stringify(processes, null, 2);
  }

  updateMemory(memory) {
    if (!this.memoryVisualization) return;
    this.memoryVisualization.textContent = JSON.stringify(memory, null, 2);
  }

  updateErrors(errors) {
    if (!this.errorLog) return;
    this.errorLog.textContent = JSON.stringify(errors, null, 2);
  }

  setConnectionStatus(connected) {
    if (!this.connectionStatus) return;
    this.connectionStatus.textContent = connected ? 'Connected' : 'Disconnected';
  }

  updateTimestamp(ts) {
    if (this.lastUpdate) {
      const d = new Date(ts);
      this.lastUpdate.textContent = d.toLocaleTimeString();
    }
  }
}
