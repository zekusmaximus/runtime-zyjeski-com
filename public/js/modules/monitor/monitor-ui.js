class MonitorUI {
  constructor() {
    this.elements = {
      connectionStatus: document.getElementById('connectionStatus'),
      characterSelect: document.getElementById('characterSelect'),
      toggleMonitoring: document.getElementById('toggleMonitoring'),
      refreshMonitor: document.getElementById('refreshMonitor'),
      resourceMeters: document.getElementById('resourceMeters'),
      processTable: document.getElementById('processTable'),
      memoryVisualization: document.getElementById('memoryVisualization'),
      errorLog: document.getElementById('errorLog'),
      clearErrors: document.getElementById('clearErrors'),
      lastUpdateTime: document.querySelector('.last-update-time'),
      processCount: document.getElementById('processCount'),
      errorCount: document.getElementById('errorCount'),
      memoryUsage: document.getElementById('memoryUsage'),
    };
  }

  initialize(controller) {
    this.controller = controller;
    this.elements.toggleMonitoring.addEventListener('click', () => {
      const characterId = this.elements.characterSelect.value;
      if (characterId) {
        if (this.controller.state.isMonitoring) {
          this.controller.stopMonitoring();
        } else {
          this.controller.startMonitoring(characterId);
        }
      }
    });

    this.elements.refreshMonitor.addEventListener('click', () => this.controller.refreshData());
    this.elements.clearErrors.addEventListener('click', () => this.controller.clearErrors());
    this.elements.characterSelect.addEventListener('change', () => {
        this.elements.toggleMonitoring.disabled = !this.elements.characterSelect.value;
    });
  }

  setSelectedCharacter(characterId) {
    this.elements.characterSelect.value = characterId;
    this.elements.toggleMonitoring.disabled = !characterId;
  }

  updateAll(data) {
    if (!data) return;
    this.updateResourceMeters(data.systemResources);
    this.updateProcessTable(data.processes);
    this.updateMemoryVisualization(data.memoryMap);
    this.updateErrorLog(data.system_errors);
    this.updateFooter(data);
    this.elements.lastUpdateTime.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }

  updateConnectionStatus(status) {
    this.elements.connectionStatus.textContent = status;
    this.elements.connectionStatus.className = `connection-status ${status}`;
  }

  setMonitoringButtonState(isMonitoring) {
    if (isMonitoring) {
      this.elements.toggleMonitoring.innerHTML = `<span class="btn-icon">⏹</span> <span class="btn-text">Stop Monitoring</span>`;
      this.elements.refreshMonitor.disabled = false;
    } else {
      this.elements.toggleMonitoring.innerHTML = `<span class="btn-icon">▶</span> <span class="btn-text">Start Monitoring</span>`;
      this.elements.refreshMonitor.disabled = true;
    }
  }

  updateResourceMeters(resources) {
    if (!resources) {
        this.elements.resourceMeters.innerHTML = '<div class="empty-state">No resource data available.</div>';
        return;
    }

    let html = '';
    const template = document.getElementById('resourceMeterTemplate');

    const cpuMeter = template.content.cloneNode(true);
    cpuMeter.querySelector('.meter-name').textContent = 'CPU';
    cpuMeter.querySelector('.meter-value').textContent = `${(resources.cpu.currentLoad * 100).toFixed(1)}%`;
    cpuMeter.querySelector('.meter-fill').style.width = `${resources.cpu.currentLoad * 100}%`;
    html += cpuMeter.firstElementChild.outerHTML;

    const memoryMeter = template.content.cloneNode(true);
    memoryMeter.querySelector('.meter-name').textContent = 'Memory';
    memoryMeter.querySelector('.meter-value').textContent = `${(resources.memory.used / resources.memory.total * 100).toFixed(1)}%`;
    memoryMeter.querySelector('.meter-fill').style.width = `${(resources.memory.used / resources.memory.total * 100)}%`;
    html += memoryMeter.firstElementChild.outerHTML;

    this.elements.resourceMeters.innerHTML = html;
  }

  updateProcessTable(processes) {
    if (!processes || processes.length === 0) {
        this.elements.processTable.innerHTML = '<div class="empty-state">No processes running.</div>';
        return;
    }

    let html = '<table class="process-list"><tr><th>PID</th><th>Name</th><th>Status</th><th>CPU</th><th>Memory</th><th>Actions</th></tr>';
    const template = document.getElementById('processRowTemplate');

    for (const process of processes) {
        const row = template.content.cloneNode(true);
        row.querySelector('.process-pid').textContent = process.pid;
        row.querySelector('.process-name').textContent = process.name;
        row.querySelector('.process-status').textContent = process.status;
        row.querySelector('.process-cpu').textContent = `${(process.cpuUsage * 100).toFixed(2)}%`;
        row.querySelector('.process-memory').textContent = `${(process.memoryUsage / 1024).toFixed(2)} KB`;
        html += row.firstElementChild.outerHTML;
    }

    html += '</table>';
    this.elements.processTable.innerHTML = html;
  }

  updateMemoryVisualization(memoryMap) {
    if (!memoryMap || !memoryMap.regions || memoryMap.regions.length === 0) {
        this.elements.memoryVisualization.innerHTML = '<div class="empty-state">No memory regions defined.</div>';
        return;
    }

    let html = '<div class="memory-blocks">';
    const template = document.getElementById('memoryBlockTemplate');

    for (const region of memoryMap.regions) {
        const block = template.content.cloneNode(true);
        block.querySelector('.memory-block').classList.add(region.type);
        block.querySelector('.memory-block-id').textContent = region.name;
        block.querySelector('.memory-block-size').textContent = `${region.size} KB`;
        html += block.firstElementChild.outerHTML;
    }

    html += '</div>';
    this.elements.memoryVisualization.innerHTML = html;
  }

  updateErrorLog(errors) {
    if (!errors || errors.length === 0) {
        this.elements.errorLog.innerHTML = '<div class="empty-state">No errors detected.</div>';
        return;
    }

    let html = '';
    const template = document.getElementById('errorEntryTemplate');

    for (const error of errors) {
        const entry = template.content.cloneNode(true);
        entry.querySelector('.error-timestamp').textContent = new Date(error.timestamp).toLocaleTimeString();
        entry.querySelector('.error-severity').textContent = error.severity;
        entry.querySelector('.error-description').textContent = error.description;
        entry.querySelector('.error-entry').classList.add(error.severity);
        html += entry.firstElementChild.outerHTML;
    }

    this.elements.errorLog.innerHTML = html;
  }

  clearErrorLog() {
    this.elements.errorLog.innerHTML = '<div class="empty-state">Errors cleared by user.</div>';
  }

  updateFooter(data) {
    this.elements.processCount.textContent = `${data.processes?.length || 0} processes`;
    this.elements.errorCount.textContent = `${data.system_errors?.length || 0} errors`;
    const memoryPercentage = data.systemResources ? (data.systemResources.memory.used / data.systemResources.memory.total * 100).toFixed(1) : 0;
    this.elements.memoryUsage.textContent = `${memoryPercentage}% memory`;
  }
}

export default MonitorUI;