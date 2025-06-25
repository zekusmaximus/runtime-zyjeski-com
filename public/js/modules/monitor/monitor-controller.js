import MonitorState from './monitor-state.js';
import MonitorUI from './monitor-ui.js';
import MonitorSocket from './monitor-socket.js';

export default class MonitorController {
  constructor() {
    this.state = new MonitorState();
    this.ui = new MonitorUI();
    this.socket = null;
    this.currentCharacter = null;
    this.monitoring = false;
  }

  init() {
    if (window.socketClient) {
      this.socket = new MonitorSocket(window.socketClient, {
        onConsciousnessUpdate: (d) => this.handleUpdate(d),
        onSystemResources: (d) => this.handleResources(d),
        onErrorLogs: (d) => this.handleErrors(d),
        onMemoryAllocation: (d) => this.handleMemory(d),
        onMonitoringStarted: () => console.log('monitoring started'),
        onMonitoringStopped: () => console.log('monitoring stopped')
      });
      this.socket.bindEvents();
    }
    this.bindUIActions();
  }

  bindUIActions() {
    if (this.ui.refreshBtn) {
      this.ui.refreshBtn.addEventListener('click', () => this.refresh());
    }
    if (this.ui.toggleBtn) {
      this.ui.toggleBtn.addEventListener('click', () => this.toggleMonitoring());
    }
    const select = document.getElementById('characterSelect');
    if (select) {
      select.addEventListener('change', (e) => {
        this.currentCharacter = e.target.value || null;
        this.ui.toggleBtn.disabled = !this.currentCharacter;
      });
    }
    const clearBtn = document.getElementById('clearErrors');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.state.update({ errors: [] });
        this.ui.updateErrors([]);
      });
    }
  }

  start() {
    if (!this.currentCharacter || !this.socket) return;
    this.socket.startMonitoring(this.currentCharacter);
    this.monitoring = true;
  }

  stop() {
    if (!this.currentCharacter || !this.socket) return;
    this.socket.stopMonitoring(this.currentCharacter);
    this.monitoring = false;
  }

  toggleMonitoring() {
    if (this.monitoring) {
      this.stop();
    } else {
      this.start();
    }
  }

  refresh() {
    this.socket?.refresh();
  }

  handleUpdate(data) {
    this.state.update(data.consciousness || data);
    this.ui.updateProcesses(this.state.processes);
    this.ui.updateResources(this.state.resources);
    this.ui.updateMemory(this.state.memory);
    this.ui.updateErrors(this.state.errors);
    if (this.state.lastUpdate) {
      this.ui.updateTimestamp(this.state.lastUpdate);
    }
  }

  handleResources(data) {
    this.state.update({ resources: data.resources });
    this.ui.updateResources(this.state.resources);
  }

  handleErrors(data) {
    this.state.update({ errors: data.errors });
    this.ui.updateErrors(this.state.errors);
  }

  handleMemory(data) {
    this.state.update({ memory: data.memoryData });
    this.ui.updateMemory(this.state.memory);
  }
}
