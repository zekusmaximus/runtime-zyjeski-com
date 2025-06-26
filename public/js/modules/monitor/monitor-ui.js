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

  populateCharacterList(characters) {
    if (!this.elements.characterSelect) {
      console.error('Character select element not found');
      return;
    }

    // Clear existing options except the default one
    this.elements.characterSelect.innerHTML = '<option value="">Select a character...</option>';

    if (!characters || characters.length === 0) {
      console.warn('No characters available');
      return;
    }

    // Populate with available characters
    characters.forEach(character => {
      const option = document.createElement('option');
      option.value = character.id;
      option.textContent = character.name || character.id;
      this.elements.characterSelect.appendChild(option);
    });

    // Enable/disable monitoring button based on selection
    this.elements.toggleMonitoring.disabled = !this.elements.characterSelect.value;
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
    if (!resources || !this.elements.resourceMeters) {
        console.warn('No resources data or element available for resource meters');
        if (this.elements.resourceMeters) {
          this.elements.resourceMeters.innerHTML = '<div class="empty-state">No resource data available.</div>';
        }
        return;
    }

    let html = '';
    const template = document.getElementById('resourceMeterTemplate');
    
    if (!template) {
        console.error('Resource meter template not found');
        this.elements.resourceMeters.innerHTML = '<div class="empty-state">Template error.</div>';
        return;
    }

    try {
      // CPU Meter
      if (resources.cpu) {
        const cpuMeter = template.content.cloneNode(true);
        cpuMeter.querySelector('.meter-name').textContent = 'CPU';
        cpuMeter.querySelector('.meter-value').textContent = `${(resources.cpu.currentLoad * 100).toFixed(1)}%`;
        cpuMeter.querySelector('.meter-fill').style.width = `${resources.cpu.currentLoad * 100}%`;
        html += cpuMeter.firstElementChild.outerHTML;
      }

      // Memory Meter  
      if (resources.memory && resources.memory.total > 0) {
        const memoryMeter = template.content.cloneNode(true);
        memoryMeter.querySelector('.meter-name').textContent = 'Memory';
        const memoryPercent = (resources.memory.used / resources.memory.total * 100).toFixed(1);
        memoryMeter.querySelector('.meter-value').textContent = `${memoryPercent}%`;
        memoryMeter.querySelector('.meter-fill').style.width = `${memoryPercent}%`;
        html += memoryMeter.firstElementChild.outerHTML;
      }

      this.elements.resourceMeters.innerHTML = html;
    } catch (error) {
      console.error('Error updating resource meters:', error);
      this.elements.resourceMeters.innerHTML = '<div class="empty-state">Error displaying resources.</div>';
    }
  }

  updateProcessTable(processes) {
    if (!processes || processes.length === 0) {
        this.elements.processTable.innerHTML = '<div class="empty-state">No processes running.</div>';
        return;
    }

    const template = document.getElementById('processRowTemplate');
    if (!template) {
        console.error('Process row template not found');
        this.elements.processTable.innerHTML = '<div class="empty-state">Template error.</div>';
        return;
    }

    try {
      let html = '<table class="process-list"><tr><th>PID</th><th>Name</th><th>Status</th><th>CPU</th><th>Memory</th><th>Actions</th></tr>';

      for (const process of processes) {
          const row = template.content.cloneNode(true);
          row.querySelector('.process-pid').textContent = process.pid || 'N/A';
          row.querySelector('.process-name').textContent = process.name || 'Unknown';
          row.querySelector('.process-status').textContent = process.status || 'unknown';
          row.querySelector('.process-cpu').textContent = `${((process.cpuUsage || 0) * 100).toFixed(2)}%`;
          row.querySelector('.process-memory').textContent = `${((process.memoryUsage || 0) / 1024).toFixed(2)} KB`;
          html += row.firstElementChild.outerHTML;
      }

      html += '</table>';
      this.elements.processTable.innerHTML = html;
    } catch (error) {
      console.error('Error updating process table:', error);
      this.elements.processTable.innerHTML = '<div class="empty-state">Error displaying processes.</div>';
    }
  }

  updateMemoryVisualization(memoryMap) {
    // Handle both old and new memory data structures
    let regions = [];
    
    if (memoryMap && memoryMap.regions && memoryMap.regions.length > 0) {
      regions = memoryMap.regions;
    } else if (memoryMap && Array.isArray(memoryMap)) {
      regions = memoryMap;
    } else if (memoryMap && memoryMap.pools) {
      // Convert pools to regions format for display
      regions = Object.entries(memoryMap.pools).map(([name, data]) => ({
        name: name,
        type: name.toLowerCase(),
        size: data.size || data.used || data.count || 0,
        address: data.address || `0x${Math.random().toString(16).substr(2, 8)}`
      }));
    }

    if (!regions || regions.length === 0) {
      this.elements.memoryVisualization.innerHTML = '<div class="empty-state">No memory regions detected.</div>';
      return;
    }

    let html = '<div class="memory-blocks">';
    const template = document.getElementById('memoryBlockTemplate');

    if (!template) {
      console.error('Memory block template not found');
      this.elements.memoryVisualization.innerHTML = '<div class="empty-state">Template error.</div>';
      return;
    }

    try {
      for (const region of regions) {
        const block = template.content.cloneNode(true);
        block.querySelector('.memory-block').classList.add(region.type || 'unknown');
        block.querySelector('.memory-block-id').textContent = region.name || region.label || 'Unknown';
        block.querySelector('.memory-block-size').textContent = `${region.size || 0} KB`;
        html += block.firstElementChild.outerHTML;
      }

      html += '</div>';
      this.elements.memoryVisualization.innerHTML = html;
    } catch (error) {
      console.error('Error updating memory visualization:', error);
      this.elements.memoryVisualization.innerHTML = '<div class="empty-state">Error displaying memory.</div>';
    }
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
    // Safely update footer elements if they exist
    if (this.elements.processCount) {
      this.elements.processCount.textContent = `${data.processes?.length || 0}`;
    }
    if (this.elements.errorCount) {
      this.elements.errorCount.textContent = `${data.system_errors?.length || 0}`;
    }
    if (this.elements.memoryUsage) {
      const memoryPercentage = data.systemResources ? (data.systemResources.memory.used / data.systemResources.memory.total * 100).toFixed(1) : 0;
      this.elements.memoryUsage.textContent = `${memoryPercentage}%`;
    }
    if (this.elements.lastUpdateTime) {
      this.elements.lastUpdateTime.textContent = new Date().toLocaleTimeString();
    }
  }
}

export default MonitorUI;