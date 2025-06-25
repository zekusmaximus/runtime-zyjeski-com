export default class MonitorSocket {
  constructor(socketClient, handlers = {}) {
    this.client = socketClient;
    this.handlers = handlers;
    this.bound = false;
  }

  bindEvents() {
    if (!this.client || this.bound) return;
    this.bound = true;
    const on = (e, h) => this.client.on(e, h);
    if (this.handlers.onConsciousnessUpdate) {
      on('consciousness-update', this.handlers.onConsciousnessUpdate);
    }
    if (this.handlers.onMonitoringStarted) {
      on('monitoring-started', this.handlers.onMonitoringStarted);
    }
    if (this.handlers.onMonitoringStopped) {
      on('monitoring-stopped', this.handlers.onMonitoringStopped);
    }
    if (this.handlers.onSystemResources) {
      on('system-resources', this.handlers.onSystemResources);
    }
    if (this.handlers.onErrorLogs) {
      on('error-logs', this.handlers.onErrorLogs);
    }
    if (this.handlers.onMemoryAllocation) {
      on('memory-allocation', this.handlers.onMemoryAllocation);
    }
  }

  startMonitoring(id) {
    this.client?.startMonitoring(id);
  }

  stopMonitoring(id) {
    this.client?.stopMonitoring(id);
  }

  refresh() {
    this.client?.emitToServer('refresh-monitor');
  }
}
