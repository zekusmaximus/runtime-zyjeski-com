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
    console.log('🔍 MonitorUI: Caching elements...');
    
    // Main containers
    this.elements.connectionStatus = document.querySelector('.connection-status');
    this.elements.monitorContainer = document.querySelector('.monitor-container');
    
    // Monitor section elements - ensure monitor section is accessible
    const monitorSection = document.getElementById('monitor');
    const wasActive = monitorSection?.classList.contains('active');
    
    // Temporarily activate monitor section if needed to cache elements properly
    if (monitorSection && !wasActive) {
      console.log('🔍 Temporarily activating monitor section for element caching...');
      monitorSection.classList.add('active');
    }
    
    // Resource displays
    this.elements.resourceMeters = document.getElementById('resourceMeters');
    this.elements.processTable = document.getElementById('processTable');
    this.elements.memoryVisualization = document.getElementById('memoryVisualization');
    this.elements.errorLog = document.getElementById('errorLog');
    
    // Restore section state
    if (monitorSection && !wasActive) {
      monitorSection.classList.remove('active');
    }
    
    // Log what was found
    console.log('🔍 Element cache results:', {
      connectionStatus: !!this.elements.connectionStatus,
      monitorContainer: !!this.elements.monitorContainer,
      resourceMeters: !!this.elements.resourceMeters,
      processTable: !!this.elements.processTable,
      memoryVisualization: !!this.elements.memoryVisualization,
      errorLog: !!this.elements.errorLog
    });
    
    // Specifically check memory visualization
    if (!this.elements.memoryVisualization) {
      console.error('❌ memoryVisualization element not found!');
      console.log('Available elements with memory in ID:', 
        Array.from(document.querySelectorAll('[id*="memory"]')).map(el => el.id)
      );
    } else {
      console.log('✅ memoryVisualization element found:', this.elements.memoryVisualization);
    }
    
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
      this.elements.characterSelect.addEventListener('change', async (e) => {
        const characterId = e.target.value;
        if (characterId) {
          console.log('[MONITOR UI] Character selected:', characterId);
          await this.controller.selectCharacter(characterId);
        }
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
    
    if (data.memoryData || data.memory || data.memoryMap) {
      this.updateMemoryVisualization(data.memoryData || data.memory || data.memoryMap);
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
    const cpu = resources.cpu || { currentLoad: 0, percentage: 0, used: 0, total: 100 };
    const cpuPercentage = cpu.percentage || (cpu.currentLoad * 100) || 0;
    const memory = resources.memory || { percentage: 0, used: 0, total: 10000 };
    const threads = resources.threads || { percentage: 0, used: 0, total: 32 };
    
    const html = `
      <div class="resource-meter">
        <div class="resource-label">CPU Usage</div>
        <div class="resource-bar">
          <div class="resource-fill" style="width: ${cpuPercentage}%"></div>
</div>
<div class="resource-value">${cpuPercentage.toFixed(1)}%</div>
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
    console.log('🧠 Memory data type:', typeof memoryData);
    console.log('🧠 Memory data keys:', memoryData ? Object.keys(memoryData) : 'none');
    
    // Ensure monitor section is active before trying to access elements
    const monitorSection = document.getElementById('monitor');
    if (monitorSection && !monitorSection.classList.contains('active')) {
      console.log('🧠 Monitor section not active, making it active...');
      monitorSection.classList.add('active');
    }
    
    if (!this.elements.memoryVisualization) {
      console.log('🧠 Memory visualization element not found in cache, re-caching...');
      // Re-cache all elements as monitor section might have become active
      this.cacheElements();
      
      if (!this.elements.memoryVisualization) {
        console.error('❌ Memory visualization element still not found!');
        console.log('Current page URL:', window.location.href);
        console.log('Monitor section active:', monitorSection?.classList.contains('active'));
        console.log('Available elements with "memory" in ID or class:');
        const memoryElements = document.querySelectorAll('[id*="memory"], [class*="memory"]');
        memoryElements.forEach(el => {
          console.log(`  - ${el.tagName} id="${el.id}" class="${el.className}"`);
        });
        return;
      }
    }

    if (!memoryData) {
      console.log('No memory data provided');
      this.elements.memoryVisualization.innerHTML = '<div class="empty-state">No consciousness connected<br><small>Select a character to view memory allocation</small></div>';
      return;
    }

    // Handle the memory structure from the server
    let html = '<div class="memory-blocks">';
    let hasData = false;
    
    // Show memory regions (detailed memory blocks)
    if (memoryData.regions && Array.isArray(memoryData.regions) && memoryData.regions.length > 0) {
      hasData = true;
      console.log('🧠 Found memory regions:', memoryData.regions.length);
      
      for (const region of memoryData.regions) {
        const fragPercent = ((region.fragmentation || 0) * 100).toFixed(1);
        const corruptPercent = ((region.corruption || 0) * 100).toFixed(1);
        
        html += `
          <div class="memory-block ${region.type || 'unknown'}">
            <div class="memory-block-header">
              <span class="memory-block-id">${region.label || region.type || 'Unknown'}</span>
              <span class="memory-block-size">${region.size || 0} MB</span>
            </div>
            <div class="memory-block-details">
              <div class="memory-address">${region.address || 'N/A'}</div>
              <div class="memory-description">${region.description || ''}</div>
              <div class="memory-stats">
                <span class="memory-frag">Frag: ${fragPercent}%</span>
                <span class="memory-corrupt">Corrupt: ${corruptPercent}%</span>
                <span class="memory-access">${region.access_pattern || 'unknown'}</span>
              </div>
            </div>
          </div>
        `;
      }
    }
    
    // Show memory pools if available
    if (memoryData.pools && typeof memoryData.pools === 'object') {
      hasData = true;
      console.log('🧠 Found memory pools:', memoryData.pools);
      
      html += '<div class="memory-pools">';
      for (const [poolName, count] of Object.entries(memoryData.pools)) {
        html += `
          <div class="memory-pool ${poolName.toLowerCase()}">
            <div class="memory-pool-header">
              <span class="memory-pool-name">${poolName}</span>
              <span class="memory-pool-count">${count} memories</span>
            </div>
          </div>
        `;
      }
      html += '</div>';
    }
    
    // Show capacity info
    if (memoryData.capacity && typeof memoryData.capacity === 'object') {
      hasData = true;
      const capacity = memoryData.capacity;
      const usedPercent = capacity.total ? ((capacity.allocated || 0) / capacity.total * 100).toFixed(1) : 0;
      
      html += `
        <div class="memory-stats">
          <div class="memory-capacity">
            <div>Total: ${capacity.total || 0} MB</div>
            <div>Used: ${capacity.allocated || 0} MB (${usedPercent}%)</div>
            <div>Available: ${capacity.available || 0} MB</div>
            <div>Reserved: ${capacity.reserved || 0} MB</div>
          </div>
          <div class="memory-fragmentation">
            <div>Fragmentation: ${((memoryData.fragmentationLevel || 0) * 100).toFixed(1)}%</div>
            <div>Total Memories: ${memoryData.totalMemories || 'Unknown'}</div>
          </div>
        </div>
      `;
    }

    // If no expected structure, try to show something useful
    if (!hasData) {
      console.log('Memory data structure not recognized, showing debug info');
      html += `
        <div class="memory-debug">
          <div>Memory Data Structure:</div>
          <pre>${JSON.stringify(memoryData, null, 2)}</pre>
        </div>
      `;
      hasData = true;
    }
    
    html += '</div>';
    
    if (hasData) {
      this.elements.memoryVisualization.innerHTML = html;
    } else {
      this.elements.memoryVisualization.innerHTML = '<div class="empty-state">No memory data available.</div>';
    }
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