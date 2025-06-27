// public/js/modules/monitor/monitor-ui.js
// Fixed implementation that handles the actual data structure from the server

class MonitorUI {
  constructor() {
    this.elements = {};
    this.isInitialized = false;
    // Inject CSS once for flash effects
    this.addFlashCSS();
  }

  initialize(controller) {
    if (this.isInitialized) return;
    
    this.controller = controller;
    this.cacheElements();
    this.setupEventListeners();
    this.isInitialized = true;
    
    console.log('Monitor UI initialized');
  }

  cacheElements() {
    // Main containers
    this.elements.connectionStatus = document.querySelector('.connection-status');
    this.elements.monitorContainer = document.querySelector('.monitor-container');
    
    // Resource displays
    this.elements.resourceMeters = document.getElementById('resourceMeters');
    this.elements.processTable = document.getElementById('processTable');
    this.elements.memoryVisualization = document.getElementById('memoryVisualization');
    this.elements.errorLog = document.getElementById('errorLog');
    
    // Controls
    this.elements.characterSelect = document.getElementById('characterSelect');
    this.elements.startBtn = document.getElementById('startMonitoring');
    this.elements.stopBtn = document.getElementById('stopMonitoring');
    this.elements.refreshBtn = document.getElementById('refreshMonitor');
    this.elements.clearErrorsBtn = document.getElementById('clearErrors');
    
    // Footer stats
    this.elements.processCount = document.querySelector('#processCount');
    this.elements.errorCount = document.querySelector('#errorCount');
    this.elements.memoryUsage = document.querySelector('#memoryUsage');
    this.elements.lastUpdateTime = document.querySelector('.last-update-time');
  }

  setupEventListeners() {
    if (this.elements.characterSelect) {
      this.elements.characterSelect.addEventListener('change', (e) => {
        this.controller.connectToCharacter({ id: e.target.value, name: e.target.options[e.target.selectedIndex].text });
      });
    }
    
    if (this.elements.startBtn) {
      this.elements.startBtn.addEventListener('click', () => {
        const characterId = this.elements.characterSelect?.value;
        if (characterId) {
          this.controller.startMonitoring(characterId);
        }
      });
    }
    
    if (this.elements.stopBtn) {
      this.elements.stopBtn.addEventListener('click', () => {
        this.controller.stopMonitoring();
      });
    }
    
    if (this.elements.refreshBtn) {
      this.elements.refreshBtn.addEventListener('click', () => {
        this.controller.refreshData();
      });
    }
    
    if (this.elements.clearErrorsBtn) {
      this.elements.clearErrorsBtn.addEventListener('click', () => {
        this.controller.clearErrors();
      });
    }
  }

  updateConnectionStatus(status) {
    if (this.elements.connectionStatus) {
      this.elements.connectionStatus.textContent = status;
      this.elements.connectionStatus.className = `connection-status ${status}`;
    }
  }

  populateCharacterList(characters) {
    if (!this.elements.characterSelect) return;
    
    this.elements.characterSelect.innerHTML = '<option value="">Select a character</option>';
    characters.forEach(char => {
      const option = document.createElement('option');
      option.value = char.id;
      option.textContent = char.name;
      this.elements.characterSelect.appendChild(option);
    });
  }

  setSelectedCharacter(characterId) {
    if (this.elements.characterSelect) {
      this.elements.characterSelect.value = characterId;
    }
  }

  setMonitoringButtonState(isMonitoring) {
    if (this.elements.startBtn) {
      this.elements.startBtn.disabled = isMonitoring;
    }
    if (this.elements.stopBtn) {
      this.elements.stopBtn.disabled = !isMonitoring;
    }
  }

  updateAll(data) {
    console.log('📊 Monitor UI updating all displays with:', data);
    // Visual flash to highlight updates
    this.addFlash('update');
    
    if (!data) {
      console.warn('No data provided to updateAll');
      return;
    }
    
    // Update each component
    if (data.systemResources) {
      this.updateResourceMeters(data.systemResources);
    }
    
    if (data.processes) {
      this.updateProcessTable(data.processes);
    }
    
    if (data.memoryData || data.memory) {
      this.updateMemoryVisualization(data.memoryData || data.memory);
    }
    
    if (data.system_errors) {
      this.updateErrorLog(data.system_errors);
    }
    
    // Update footer
    this.updateFooter(data);
  }

  updateResourceMeters(resources) {
    console.log('💻 Updating resource meters:', resources);
    
    if (!this.elements.resourceMeters || !resources) return;
    
    // Handle both formats: direct resources or nested in data
    const cpu = resources.cpu || { percentage: 0, used: 0, total: 100 };
    const memory = resources.memory || { percentage: 0, used: 0, total: 10000 };
    const threads = resources.threads || { percentage: 0, used: 0, total: 32 };
    
    const html = `
      <div class="resource-meter">
        <div class="resource-label">CPU Usage</div>
        <div class="resource-bar">
          <div class="resource-fill" style="width: ${cpu.percentage || 0}%"></div>
        </div>
        <div class="resource-value">${cpu.percentage || 0}%</div>
      </div>
      <div class="resource-meter">
        <div class="resource-label">Memory</div>
        <div class="resource-bar">
          <div class="resource-fill" style="width: ${memory.percentage || 0}%"></div>
        </div>
        <div class="resource-value">${memory.used || 0} / ${memory.total || 0} MB</div>
      </div>
      <div class="resource-meter">
        <div class="resource-label">Threads</div>
        <div class="resource-bar">
          <div class="resource-fill" style="width: ${threads.percentage || 0}%"></div>
        </div>
        <div class="resource-value">${threads.used || 0} / ${threads.total || 0}</div>
      </div>
    `;
    
    this.elements.resourceMeters.innerHTML = html;
  }

  updateProcessTable(processes) {
    console.log('🔄 Updating process table:', processes);
    
    if (!this.elements.processTable || !processes || processes.length === 0) {
      if (this.elements.processTable) {
        this.elements.processTable.innerHTML = '<div class="empty-state">No processes running.</div>';
      }
      return;
    }

    let html = `
      <table class="process-table">
        <thead>
          <tr>
            <th>PID</th>
            <th>Name</th>
            <th>Status</th>
            <th>CPU</th>
            <th>Memory</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const process of processes) {
      const cpuPercent = process.cpu_usage || process.cpuUsage || 0;
      const memoryMB = process.memory_mb || process.memoryUsage || 0;
      
      html += `
        <tr class="process-row ${process.status}">
          <td class="process-pid">${process.pid || 'N/A'}</td>
          <td class="process-name">${process.name || 'Unknown'}</td>
          <td class="process-status">${process.status || 'unknown'}</td>
          <td class="process-cpu">${cpuPercent}%</td>
          <td class="process-memory">${memoryMB} MB</td>
        </tr>
      `;
    }

    html += '</tbody></table>';
    this.elements.processTable.innerHTML = html;
  }

  updateMemoryVisualization(memoryData) {
    console.log('🧠 Updating memory visualization:', memoryData);
    
    if (!this.elements.memoryVisualization || !memoryData) {
      if (this.elements.memoryVisualization) {
        this.elements.memoryVisualization.innerHTML = '<div class="empty-state">No memory data available.</div>';
      }
      return;
    }

    // Handle the memory structure from the server
    let html = '<div class="memory-blocks">';
    
    // Show memory pools if available
    if (memoryData.pools) {
      for (const [poolName, count] of Object.entries(memoryData.pools)) {
        html += `
          <div class="memory-block ${poolName.toLowerCase()}">
            <div class="memory-block-header">
              <span class="memory-block-id">${poolName}</span>
              <span class="memory-block-size">${count} memories</span>
            </div>
          </div>
        `;
      }
    }
    
    // Show capacity info
    if (memoryData.capacity) {
      html += `
        <div class="memory-stats">
          <div>Total: ${memoryData.capacity.total} MB</div>
          <div>Used: ${memoryData.capacity.allocated} MB</div>
          <div>Available: ${memoryData.capacity.available} MB</div>
          <div>Fragmentation: ${(memoryData.fragmentationLevel || 0) * 100}%</div>
        </div>
      `;
    }
    
    html += '</div>';
    this.elements.memoryVisualization.innerHTML = html;
  }

  updateErrorLog(errors) {
    console.log('🚨 Updating error log:', errors);
    
    if (!this.elements.errorLog) return;
    
    if (!errors || errors.length === 0) {
      this.elements.errorLog.innerHTML = '<div class="empty-state">No errors detected.</div>';
      return;
    }

    let html = '';
    for (const error of errors) {
      const timestamp = error.timestamp ? new Date(error.timestamp).toLocaleTimeString() : 'Unknown';
      html += `
        <div class="error-entry ${error.severity || 'info'}">
          <span class="error-timestamp">${timestamp}</span>
          <span class="error-severity">${error.severity || 'info'}</span>
          <span class="error-description">${error.description || error.message || 'Unknown error'}</span>
        </div>
      `;
    }

    this.elements.errorLog.innerHTML = html;
  }

  clearErrorLog() {
    if (this.elements.errorLog) {
      this.elements.errorLog.innerHTML = '<div class="empty-state">Errors cleared by user.</div>';
    }
  }

  updateFooter(data) {
    // Update process count
    if (this.elements.processCount) {
      const count = data.processes?.length || 0;
      this.elements.processCount.textContent = `${count} processes`;
    }
    
    // Update error count
    if (this.elements.errorCount) {
      const count = data.system_errors?.length || 0;
      this.elements.errorCount.textContent = `${count} errors`;
    }
    
    // Update memory usage
    if (this.elements.memoryUsage) {
      const percentage = data.systemResources?.memory?.percentage || 0;
      this.elements.memoryUsage.textContent = `${percentage.toFixed(1)}% memory`;
    }
    
    // Update last update time
    if (this.elements.lastUpdateTime) {
      this.elements.lastUpdateTime.textContent = new Date().toLocaleTimeString();
    }
  }

  // Handle specific data updates from socket events
  updateSystemResources(data) {
    console.log('💻 Received system resources update:', data);
    if (data.resources) {
      // Transform the server format to our expected format
      const res = data.resources;
      const transformed = {
        cpu: {
          percentage: res.totalCpuUsage || 0,
          used: res.totalCpuUsage || 0,
          total: 100
        },
        memory: {
          percentage: res.memoryPercentage || 0,
          used: res.memoryCapacity?.used || res.totalMemoryUsage || 0,
          total: res.memoryCapacity?.total || 8192
        },
        threads: {
          percentage: ((res.totalThreads || 0) / 32 * 100),
          used: res.totalThreads || 0,
          total: 32
        }
      };
      this.updateResourceMeters(transformed);
      
      // Also update footer stats with this data
      if (this.elements.processCount) {
        this.elements.processCount.textContent = `${res.activeProcessCount || 0} processes`;
      }
      if (this.elements.errorCount) {
        this.elements.errorCount.textContent = `${res.issueCount || 0} errors`;
      }
      if (this.elements.memoryUsage) {
        this.elements.memoryUsage.textContent = `${res.memoryPercentage?.toFixed(1) || 0}% memory`;
      }
    }
  }
  /* ------------------------------------------------------------------ */
  /* Flash effect helpers (migrated from monitor-patches.js)            */
  /* ------------------------------------------------------------------ */
  addFlash(type = 'update') {
    const container = this.elements.monitorContainer;
    if (!container) return;
    const flashClass = `flash-${type}`;
    container.classList.add(flashClass);
    setTimeout(() => container.classList.remove(flashClass), 300);
  }

  // Injects the required flash CSS once per page load
  addFlashCSS() {
    if (document.getElementById('monitor-flash-css')) return;
    const style = document.createElement('style');
    style.id = 'monitor-flash-css';
    style.textContent = `
      .monitor-container.flash-update {
        border-color: #2196f3 !important;
        box-shadow: 0 0 20px rgba(33, 150, 243, 0.3) !important;
        transition: all 0.3s ease !important;
      }
      .monitor-container.flash-intervention {
        border-color: #4caf50 !important;
        box-shadow: 0 0 20px rgba(76, 175, 80, 0.3) !important;
        transition: all 0.3s ease !important;
      }
    `;
    document.head.appendChild(style);
  }
}

export default MonitorUI;