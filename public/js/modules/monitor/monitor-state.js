export default class MonitorState {
  constructor() {
    this.resources = {};
    this.processes = [];
    this.memory = null;
    this.errors = [];
    this.lastUpdate = null;
  }

  update(data = {}) {
    if (data.resources) this.resources = data.resources;
    if (data.processes) this.processes = data.processes;
    if (data.memory) this.memory = data.memory;
    if (data.errors) this.errors = data.errors;
    if (data.system_errors) this.errors = data.system_errors;
    if (Object.keys(data).length > 0) {
      this.lastUpdate = Date.now();
    }
  }
}
