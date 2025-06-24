// Complete Monitor.js - Runtime.zyjeski.com
// Real-time consciousness monitoring interface

class Monitor {
  constructor() {
    this.isActive = false;
    this.currentCharacter = null;
    this.lastUpdateTime = null;
    this.dataHistory = {
      resources: [],
      processes: [],
      errors: []
    };
    this.maxHistoryPoints = 60;
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.setupSocketListeners();
    this.subscribeToStateChanges();
  }

  setupElements() {
    // Use more robust element selection
    this.refreshBtn = document.getElementById('refreshMonitor') || document.querySelector('[data-action="refresh"]') || document.querySelector('.refresh-btn');
    this.pauseBtn = document.getElementById('pauseMonitor') || document.querySelector('[data-action="pause"]') || document.querySelector('.pause-btn');
    this.resourceMeters = document.getElementById('resourceMeters');
    this.processTable = document.getElementById('processTable');
    this.memoryVisualization = document.getElementById('memoryVisualization');
    this.errorLog = document.getElementById('errorLog');
    
    console.log('🔍 Element setup:', {
      refreshBtn: !!this.refreshBtn,
      pauseBtn: !!this.pauseBtn,
      resourceMeters: !!this.resourceMeters,
      processTable: !!this.processTable,
      memoryVisualization: !!this.memoryVisualization,
      errorLog: !!this.errorLog
    });
    
    // Add event listeners with better error handling
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🔄 Refresh button clicked');
        this.refreshData();
      });
      console.log('✅ Refresh button listener attached');
    } else {
      console.warn('⚠️ Refresh button not found');
    }
    
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('⏯️ Pause button clicked');
        this.togglePause();
      });
      console.log('✅ Pause button listener attached');
    } else {
      console.warn('⚠️ Pause button not found');
    }
  }

  setupEventListeners() {
    // Process table interactions - this will handle the action buttons via event delegation
    if (this.processTable) {
      this.processTable.addEventListener('click', (e) => {
        // Handle process action buttons (Kill, Restart, Optimize)
        const actionButton = e.target.closest('.action-btn');
        if (actionButton) {
          // This is handled by attachProcessButtonListeners() method
          return;
        }
        
        // Handle row clicks for context menu
        const row = e.target.closest('tr');
        if (row && row.dataset.pid) {
          this.showProcessContextMenu(e, parseInt(row.dataset.pid));
        }
      });
    }

    // Memory block interactions
    if (this.memoryVisualization) {
      this.memoryVisualization.addEventListener('click', (e) => {
        const block = e.target.closest('.memory-block');
        if (block && block.dataset.address) {
          this.showMemoryBlockDetails(block.dataset.address);
        }
      });
    }
  }

  setupSocketListeners() {
    if (!window.socketClient) {
      console.warn('Socket client not available for monitor');
      return;
    }

    // Real-time consciousness updates
    window.socketClient.on('consciousness-update', (data) => {
      if (this.isActive && this.currentCharacter && data.characterId === this.currentCharacter.id) {
        this.updateDisplays(data);
        this.updateDataHistory(data);
      }
    });

    // System resources data
    window.socketClient.on('system-resources', (data) => {
      console.log('Received system resources:', data);
      if (data.resources) {
        this.updateResourceMeters(data.resources);
      }
    });

    // Error logs data
    window.socketClient.on('error-logs', (data) => {
      console.log('Received error logs:', data);
      if (data.errors) {
        this.updateErrorLog(data.errors);
      }
    });

    // Memory allocation data
    window.socketClient.on('memory-allocation', (data) => {
      console.log('Received memory allocation:', data);
      if (data.memoryData) {
        this.updateMemoryVisualization(data.memoryData);
      }
    });

    // Intervention results
    window.socketClient.on('intervention-applied', (data) => {
      this.showInterventionFeedback(data);
    });

    // Debug hooks
    window.socketClient.on('debug-hook-triggered', (data) => {
      this.showDebugAlert(data);
    });

    // Socket errors
    window.socketClient.on('error', (error) => {
      console.error('Socket error in monitor:', error);
      this.showStatus(`Socket error: ${error.message}`, 'error');
    });
  }

  subscribeToStateChanges() {
    if (!window.stateManager) return;

    window.stateManager.subscribe('currentCharacter', (character) => {
      this.currentCharacter = character;
      if (character && this.isActive) {
        this.loadCharacterData(character);
        this.startCharacterMonitoring(character);
      }
    });

    window.stateManager.subscribe('processes', (processes) => {
      if (this.isActive) {
        this.updateProcessTable(processes);
      }
    });

    window.stateManager.subscribe('resources', (resources) => {
      if (this.isActive) {
        this.updateResourceMeters(resources);
      }
    });

    window.stateManager.subscribe('errors', (errors) => {
      if (this.isActive) {
        this.updateErrorLog(errors);
      }
    });
  }

  // Monitoring control methods
  startMonitoring() {
    this.isActive = true;

    if (this.currentCharacter) {
      this.loadCharacterData(this.currentCharacter);

      // Start real-time monitoring via WebSocket
      if (window.socketClient) {
        window.socketClient.startMonitoring(this.currentCharacter.id);
        
        // Request initial data
        window.socketClient.emit('get-system-resources');
        window.socketClient.emit('get-error-logs');
        window.socketClient.emit('get-memory-allocation');
      }
    }
  }

  stopMonitoring() {
    this.isActive = false;
    
    if (this.currentCharacter && window.socketClient) {
      window.socketClient.stopMonitoring(this.currentCharacter.id);
    }
    
    this.updateButtonStates();
    this.showStatus('Monitoring paused', 'warning');
  }

  togglePause() {
    if (this.isActive) {
      this.stopMonitoring();
    } else {
      this.startMonitoring();
    }
  }

  startCharacterMonitoring(character) {
    if (!window.socketClient || !character) return;

    // Start WebSocket monitoring
    window.socketClient.startMonitoring(character.id);

    // Request initial data
    setTimeout(() => {
      window.socketClient.requestSystemResources();
      window.socketClient.requestErrorLogs();
      window.socketClient.requestMemoryAllocation();
    }, 100);
  }

  updateButtonStates() {
    if (this.pauseBtn) {
      this.pauseBtn.textContent = this.isActive ? 'Pause' : 'Resume';
      this.pauseBtn.classList.toggle('paused', !this.isActive);
    }
  }

  // Data loading and updating methods
  loadCharacterData(character) {
    if (!character) return;
    
    // Clear data history for new character
    this.dataHistory = {
      resources: [],
      processes: [],
      errors: []
    };
    
    // Extract consciousness data
    const consciousness = character.consciousness || character;
    
    // Load initial data
    if (consciousness.processes) {
      this.updateProcessTable(consciousness.processes);
    }
    if (consciousness.resources) {
      this.updateResourceMeters(consciousness.resources);
    } else if (consciousness.processes) {
      this.generateResourcesFromProcesses(consciousness.processes);
    }
    if (consciousness.memory) {
      this.updateMemoryVisualization(consciousness.memory);
    }
    if (consciousness.system_errors) {
      this.updateErrorLog(consciousness.system_errors);
    }
    
    this.showStatus(`Loaded ${character.name}'s consciousness`, 'info');
  }

  async refreshData() {
    if (!this.currentCharacter) return;
    
    this.showStatus('Refreshing data...', 'info');
    
    try {
      const response = await fetch(`/api/consciousness/${this.currentCharacter.id}/state`);
      const state = await response.json();
      
      this.updateDisplays(state);
      this.showStatus('Data refreshed', 'success');
    } catch (error) {
      console.error('Failed to refresh monitor data:', error);
      this.showStatus('Failed to refresh data', 'error');
    }
  }

  updateDisplays(data) {
    if (!data) return;
    
    // Handle different data structure formats
    let consciousness = null;
    
    if (data.state && data.state.consciousness) {
      consciousness = data.state.consciousness;
    } else if (data.consciousness) {
      consciousness = data.consciousness;
    } else if (data.processes || data.system_errors) {
      consciousness = data;
    } else {
      consciousness = data;
    }
    
    if (!consciousness) {
      console.warn('No valid consciousness data found');
      return;
    }
    
    // Update all components
    const processes = consciousness.processes || [];
    const resources = consciousness.resources;
    const memory = consciousness.memory;
    const system_errors = consciousness.system_errors || [];
    
    if (processes.length > 0) {
      this.updateProcessTable(processes);
    }
    
    if (resources) {
      this.updateResourceMeters(resources);
    } else if (processes.length > 0) {
      this.generateResourcesFromProcesses(processes);
    }
    
    if (memory) {
      this.updateMemoryVisualization(memory);
    }
    
    if (system_errors.length > 0) {
      this.updateErrorLog(system_errors);
    }
    
    // Update timestamps and visual feedback
    this.lastUpdateTime = new Date();
    this.updateStatusTime();
    this.flashUpdate();
  }

  updateDataHistory(data) {
    const timestamp = new Date();
    
    // Handle different data structure formats
    let consciousness = null;
    
    if (data.state && data.state.consciousness) {
      consciousness = data.state.consciousness;
    } else if (data.consciousness) {
      consciousness = data.consciousness;
    } else {
      consciousness = data;
    }
    
    if (!consciousness) return;
    
    // Add resource history
    if (consciousness.resources) {
      this.dataHistory.resources.push({
        timestamp,
        data: { ...consciousness.resources }
      });
    }
    
    // Add process history
    if (consciousness.processes) {
      const totalCpu = consciousness.processes.reduce((sum, p) => sum + (p.cpu_usage || 0), 0);
      const totalMemory = consciousness.processes.reduce((sum, p) => sum + (p.memory_mb || 0), 0);
      
      this.dataHistory.processes.push({
        timestamp,
        totalCpu,
        totalMemory,
        processCount: consciousness.processes.length
      });
    }
    
    // Add error history
    if (consciousness.system_errors) {
      this.dataHistory.errors.push({
        timestamp,
        errorCount: consciousness.system_errors.length,
        criticalCount: consciousness.system_errors.filter(e => e.severity === 'critical').length
      });
    }
    
    // Trim history to max points
    Object.keys(this.dataHistory).forEach(key => {
      if (this.dataHistory[key].length > this.maxHistoryPoints) {
        this.dataHistory[key] = this.dataHistory[key].slice(-this.maxHistoryPoints);
      }
    });
  }

  // Display update methods
  // Fix in public/js/monitor.js - updateResourceMeters method

updateResourceMeters(resources) {
  const metersElement = document.getElementById('resourceMeters');
  if (!metersElement) return;

  console.log('updateResourceMeters received:', resources);

  if (!resources) {
    metersElement.innerHTML = '<div class="empty-state">No resource data available</div>';
    return;
  }

  let html = '';
  
  // Handle different resource data structures
  let cpuData = null;
  let memoryData = null;
  let threadsData = null;
  
  // Check for nested resources structure
  if (resources.cpu !== undefined || resources.memory !== undefined || resources.threads !== undefined) {
      cpuData = resources.cpu;
      memoryData = resources.memory;
      threadsData = resources.threads;
  }
  // Check for direct values from ProcessManager
  else if (resources.totalCpuUsage !== undefined || resources.totalMemoryUsage !== undefined) {
      cpuData = { 
          used: resources.totalCpuUsage, 
          total: 100, 
          percentage: resources.totalCpuUsage 
      };
      memoryData = { 
          used: resources.totalMemoryUsage,
          total: resources.memoryCapacity?.total || 10000,
          percentage: resources.memoryPercentage || (resources.totalMemoryUsage / (resources.memoryCapacity?.total || 10000)) * 100
      };
      threadsData = { 
          used: resources.totalThreads, 
          total: resources.maxThreads || 20,
          percentage: ((resources.totalThreads || 0) / (resources.maxThreads || 20)) * 100
      };
  }
  
  // CPU Usage
  if (cpuData) {
      const cpuPercent = Math.min(100, Math.max(0, cpuData.percentage || cpuData.used || 0));
      const cpuSeverity = cpuPercent > 80 ? 'critical' : cpuPercent > 60 ? 'warning' : 'normal';
      
      html += `
          <div class="resource-meter">
              <div class="meter-label">CPU USAGE</div>
              <div class="meter-bar">
                  <div class="meter-fill ${cpuSeverity}" style="width: ${cpuPercent}%"></div>
              </div>
              <div class="meter-value">${cpuPercent.toFixed(1)}%</div>
          </div>
      `;
  }
  
  // Memory Usage
  if (memoryData) {
      const memPercent = Math.min(100, Math.max(0, memoryData.percentage || 0));
      const memSeverity = memPercent > 80 ? 'critical' : memPercent > 60 ? 'warning' : 'normal';
      const usedMB = memoryData.used || 0;
      const totalMB = memoryData.total || 1;
      
      html += `
          <div class="resource-meter">
              <div class="meter-label">MEMORY USAGE</div>
              <div class="meter-bar">
                  <div class="meter-fill ${memSeverity}" style="width: ${memPercent}%"></div>
              </div>
              <div class="meter-value">${usedMB.toFixed(0)}MB / ${totalMB}MB</div>
          </div>
      `;
  }
  
  // Thread Usage
  if (threadsData) {
      const threadPercent = Math.min(100, Math.max(0, threadsData.percentage || 0));
      const threadSeverity = threadPercent > 80 ? 'critical' : threadPercent > 60 ? 'warning' : 'normal';
      const usedThreads = threadsData.used || 0;
      const totalThreads = threadsData.total || 1;
      
      html += `
          <div class="resource-meter">
              <div class="meter-label">THREADS</div>
              <div class="meter-bar">
                  <div class="meter-fill ${threadSeverity}" style="width: ${threadPercent}%"></div>
              </div>
              <div class="meter-value">${usedThreads}/${totalThreads}</div>
          </div>
      `;
  }
  
  if (!html && resources) {
      html = '<div class="empty-state">Resource data format not recognized</div>';
      console.warn('Unrecognized resource data structure:', resources);
  }

  metersElement.innerHTML = html;
}
generateResourcesFromProcesses(processes) {
  if (!processes || !Array.isArray(processes)) return;
  
  const totalCpu = processes.reduce((sum, p) => sum + (p.cpu_usage || p.cpuUsage || 0), 0);
  const totalMemory = processes.reduce((sum, p) => sum + (p.memory_mb || p.memoryUsage || 0), 0);
  const totalThreads = processes.reduce((sum, p) => sum + (p.thread_count || p.threadCount || 1), 0);
  
  const syntheticResources = {
      totalCpuUsage: totalCpu,
      totalMemoryUsage: totalMemory,
      totalThreads: totalThreads,
      memoryCapacity: {
          total: 10000,
          used: totalMemory,
          available: 10000 - totalMemory
      },
      maxThreads: 20
  };
  
  this.updateResourceMeters(syntheticResources);
}
  updateErrorLog(errors) {
    if (!this.errorLog) {
      console.warn('Missing errorLog element');
      return;
    }
    
    if (!errors || !Array.isArray(errors)) {
      this.errorLog.innerHTML = '<div class="empty-state">No errors logged</div>';
      return;
    }
    
    if (errors.length === 0) {
      this.errorLog.innerHTML = '<div class="empty-state">No errors - system running smoothly</div>';
      return;
    }
    
    // Sort errors by timestamp (newest first)
    const sortedErrors = errors.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    
    const errorHtml = sortedErrors.map(error => {
      const severity = error.severity || 'low';
      const timestamp = error.timestamp ? new Date(error.timestamp).toLocaleTimeString() : 'Unknown';
      const source = error.source || 'System';
      const description = error.description || error.message || 'Unknown error';
      
      return `
        <div class="error-entry ${severity}" data-error-id="${error.id || Date.now()}">
          <div class="error-header">
            <span class="error-severity ${severity}">${severity.toUpperCase()}</span>
            <span class="error-source">${source}</span>
            <span class="error-timestamp">${timestamp}</span>
          </div>
          <div class="error-description">${description}</div>
          ${error.type ? `<div class="error-type">Type: ${error.type}</div>` : ''}
        </div>
      `;
    }).join('');
    
    this.errorLog.innerHTML = errorHtml;
  }

  updateMemoryVisualization(memory) {
    if (!this.memoryVisualization) {
      console.warn('Missing memoryVisualization element');
      return;
    }
    
    if (!memory) {
      this.memoryVisualization.innerHTML = '<div class="empty-state">No memory data available</div>';
      return;
    }
    
    this.memoryVisualization.innerHTML = '';
    
    // Handle structured memory format
    if (memory.capacity && memory.pools) {
      this.updateStructuredMemoryVisualization(memory);
      return;
    }
    
    // Handle legacy memory format (address-block pairs)
    const memoryEntries = Object.entries(memory);
    if (memoryEntries.length === 0) {
      this.memoryVisualization.innerHTML = '<div class="empty-state">Memory allocation empty</div>';
      return;
    }
    
    const totalSize = memoryEntries.reduce((sum, [_, block]) => {
      return sum + (block && typeof block.size === 'number' ? block.size : 1);
    }, 0);
    
    let memoryHtml = '<div class="memory-overview">';
    memoryHtml += `<div class="memory-stats">Total Allocated: ${memoryEntries.length} blocks, ${totalSize}MB</div>`;
    memoryHtml += '</div>';
    
    memoryHtml += '<div class="memory-blocks">';
    memoryEntries.forEach(([address, block]) => {
      if (!block) return;
      
      const size = block.size || 1;
      const type = block.type || 'unknown';
      const status = block.status || 'active';
      const widthPercent = totalSize > 0 ? (size / totalSize) * 100 : 1;
      
      memoryHtml += `
        <div class="memory-block ${type} ${status}" 
             data-address="${address}"
             style="width: ${Math.max(widthPercent, 2)}%"
             title="${type}: ${size}MB at ${address}">
          <div class="block-label">${type}</div>
          <div class="block-size">${size}MB</div>
        </div>
      `;
    });
    memoryHtml += '</div>';
    
    this.memoryVisualization.innerHTML = memoryHtml;
  }

  updateStructuredMemoryVisualization(memory) {
    const capacity = memory.capacity || {};
    const pools = memory.pools || {};
    
    let html = `
      <div class="memory-capacity">
        <h4>Memory Capacity</h4>
        <div class="capacity-bar">
          <div class="capacity-fill" style="width: ${capacity.utilizationPercentage || 0}%"></div>
        </div>
        <div class="capacity-stats">
          <span>Used: ${capacity.allocated || 0}MB</span>
          <span>Available: ${capacity.available || 0}MB</span>
          <span>Total: ${capacity.total || 0}MB</span>
        </div>
      </div>
    `;
    
    if (Object.keys(pools).length > 0) {
      html += '<div class="memory-pools"><h4>Memory Pools</h4>';
      
      Object.entries(pools).forEach(([poolName, poolData]) => {
        const usage = poolData.allocated || 0;
        const total = poolData.capacity || 100;
        const percentage = total > 0 ? (usage / total) * 100 : 0;
        
        html += `
          <div class="memory-pool" data-pool="${poolName}">
            <div class="pool-label">${this.formatPoolName(poolName)}</div>
            <div class="pool-bar">
              <div class="pool-fill" data-pool="${poolName}" style="width: ${percentage}%"></div>
            </div>
            <div class="pool-stats">${usage}/${total} (${percentage.toFixed(1)}%)</div>
          </div>
        `;
      });
      
      html += '</div>';
    }
    
    this.memoryVisualization.innerHTML = html;
  }

  updateProcessTable(processes) {
    if (!this.processTable) {
      console.warn('Missing processTable element');
      return;
    }
    
    if (!processes || !Array.isArray(processes)) {
      this.processTable.innerHTML = '<div class="empty-state">No process data available</div>';
      return;
    }
    
    if (processes.length === 0) {
      this.processTable.innerHTML = '<div class="empty-state">No active processes</div>';
      return;
    }
    
    const tableHtml = `
      <table class="process-list">
        <thead>
          <tr>
            <th>PID</th>
            <th>Name</th>
            <th>Priority</th>
            <th>Status</th>
            <th>CPU %</th>
            <th>Memory</th>
            <th>Last Activity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${processes.map(process => {
            const trend = this.calculateProcessTrend(process.pid);
            return `
              <tr data-pid="${process.pid}" class="process-row ${process.status}">
                <td class="pid">${process.pid}</td>
                <td class="name">
                  ${process.name}
                  ${process.issues && process.issues.length > 0 ? 
                    '<span class="error-indicator">⚠</span>' : ''}
                </td>
                <td class="priority">${process.priority || 'normal'}</td>
                <td><span class="status ${process.status}">${process.status}</span></td>
                <td class="cpu-usage ${this.getCpuStatusClass(process.cpu_usage)}">
                  ${(process.cpu_usage || 0).toFixed(1)}%
                  ${trend ? `<span class="trend ${trend.direction}">${trend.icon}</span>` : ''}
                </td>
                <td class="memory-usage">${Math.round(process.memory_mb || 0)}MB</td>
                <td class="last-activity">${process.last_activity ? new Date(process.last_activity).toLocaleTimeString() : 'N/A'}</td>
                <td class="actions">
                  <button class="action-btn kill-btn" data-action="kill" data-pid="${process.pid}" 
                          ${process.status === 'terminated' ? 'disabled' : ''}>Kill</button>
                  <button class="action-btn restart-btn" data-action="restart" data-pid="${process.pid}"
                          ${process.status === 'running' ? 'disabled' : ''}>Restart</button>
                  <button class="action-btn optimize-btn" data-action="optimize" data-pid="${process.pid}">Optimize</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    this.processTable.innerHTML = tableHtml;
    
    // FIXED: Add event listeners to dynamically created buttons
    this.attachProcessButtonListeners();
  }

  // NEW: Method to attach event listeners to process action buttons
  attachProcessButtonListeners() {
    if (!this.processTable) return;
    
    // Use event delegation for better performance and reliability
    this.processTable.addEventListener('click', (e) => {
      const button = e.target.closest('.action-btn');
      if (!button) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const action = button.dataset.action;
      const pid = button.dataset.pid;
      
      if (!action || !pid) {
        console.warn('Missing action or PID on button');
        return;
      }
      
      console.log(`🔧 Process action: ${action} on PID ${pid}`);
      
      // Disable button temporarily
      button.disabled = true;
      button.textContent = 'Working...';
      
      // Execute the action
      switch (action) {
        case 'kill':
          this.killProcess(pid).finally(() => {
            button.disabled = false;
            button.textContent = 'Kill';
          });
          break;
        case 'restart':
          this.restartProcess(pid).finally(() => {
            button.disabled = false;
            button.textContent = 'Restart';
          });
          break;
        case 'optimize':
          this.optimizeProcess(pid).finally(() => {
            button.disabled = false;
            button.textContent = 'Optimize';
          });
          break;
        default:
          console.warn('Unknown action:', action);
          button.disabled = false;
      }
    });
    
    console.log('✅ Process button listeners attached');
  }

  // Process action methods
  async killProcess(pid) {
    if (!this.currentCharacter) return;
    
    try {
      const response = await fetch(`/api/debug/${this.currentCharacter.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'kill',
          args: [pid]
        })
      });
      
      const result = await response.json();
      this.showStatus(`Process ${pid} killed: ${result.message}`, 'info');
    } catch (error) {
      this.showStatus(`Failed to kill process ${pid}`, 'error');
    }
  }

  async restartProcess(pid) {
    if (!this.currentCharacter) return;
    
    try {
      const response = await fetch(`/api/debug/${this.currentCharacter.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'restart',
          args: [pid]
        })
      });
      
      const result = await response.json();
      this.showStatus(`Process ${pid} restarted: ${result.message}`, 'info');
    } catch (error) {
      this.showStatus(`Failed to restart process ${pid}`, 'error');
    }
  }

  async optimizeProcess(pid) {
    if (!this.currentCharacter) return;
    
    try {
      const response = await fetch(`/api/debug/${this.currentCharacter.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'optimize',
          args: [pid]
        })
      });
      
      const result = await response.json();
      this.showStatus(`Process ${pid} optimized: ${result.message}`, 'info');
    } catch (error) {
      this.showStatus(`Failed to optimize process ${pid}`, 'error');
    }
  }

  // Helper and utility methods
  formatResourceName(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatPoolName(name) {
    return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  getResourceStatusClass(percentage) {
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'moderate';
    return 'normal';
  }

  getCpuStatusClass(cpuUsage) {
    if (cpuUsage >= 80) return 'critical';
    if (cpuUsage >= 60) return 'warning';
    if (cpuUsage >= 40) return 'moderate';
    return 'normal';
  }

  calculateResourceTrend(resourceName) {
    const history = this.dataHistory.resources.slice(-3);
    if (history.length < 2) return null;
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    if (!latest.data[resourceName] || !previous.data[resourceName]) return null;
    
    const latestValue = latest.data[resourceName].current || 0;
    const previousValue = previous.data[resourceName].current || 0;
    
    if (latestValue > previousValue) {
      return { direction: 'up', icon: '↗' };
    } else if (latestValue < previousValue) {
      return { direction: 'down', icon: '↘' };
    }
    return { direction: 'stable', icon: '→' };
  }

  calculateProcessTrend(pid) {
    const history = this.dataHistory.processes.slice(-3);
    if (history.length < 2) return null;
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    if (latest.totalCpu > previous.totalCpu) {
      return { direction: 'up', icon: '↗' };
    } else if (latest.totalCpu < previous.totalCpu) {
      return { direction: 'down', icon: '↘' };
    }
    return { direction: 'stable', icon: '→' };
  }

  generateResourcesFromProcesses(processes) {
    if (!processes || !Array.isArray(processes)) return;
    
    const totalCpu = processes.reduce((sum, p) => sum + (p.cpu_usage || 0), 0);
    const totalMemory = processes.reduce((sum, p) => sum + (p.memory_mb || 0), 0);
    const totalThreads = processes.reduce((sum, p) => sum + (p.thread_count || p.threadCount || 1), 0);
    
    
    const generatedResources = {
      attention: {
        current: Math.min(totalCpu, 100),
        max: 100,
        status: totalCpu > 80 ? 'critical' : 'normal'
      },
      memory: {
        current: totalMemory,
        max: 1024,
        status: totalMemory > 800 ? 'warning' : 'normal'
      },
      processing: {
        current: processes.filter(p => p.status === 'running').length,
        max: 10,
        status: 'normal'
      }
    };
    
    const syntheticResources = {
      totalCpuUsage: totalCpu,
      totalMemoryUsage: totalMemory,
      totalThreads: totalThreads,
      memoryCapacity: {
          total: 10000,
          used: totalMemory,
          available: 10000 - totalMemory
      },
      maxThreads: 20
    };
    
    this.updateResourceMeters(syntheticResources);
}

  // UI feedback methods
  showStatus(message, type = 'info') {
    let statusElement = document.querySelector('.monitor-status');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.className = 'monitor-status';
      const container = document.querySelector('.monitor-container');
      if (container) {
        container.appendChild(statusElement);
      }
    }
    
    statusElement.className = `monitor-status ${type}`;
    statusElement.textContent = message;
    
    setTimeout(() => {
      if (statusElement.textContent === message) {
        statusElement.textContent = '';
        statusElement.className = 'monitor-status';
      }
    }, 3000);
  }

  updateStatusTime() {
    if (this.lastUpdateTime) {
      let timeElement = document.querySelector('.last-update-time');
      if (!timeElement) {
        timeElement = document.createElement('div');
        timeElement.className = 'last-update-time';
        const footer = document.querySelector('.monitor-footer');
        if (footer) {
          footer.appendChild(timeElement);
        }
      }
      timeElement.textContent = `Last updated: ${this.lastUpdateTime.toLocaleTimeString()}`;
    }
  }

  flashUpdate(type = 'general') {
    const container = document.querySelector('.monitor-container');
    if (container) {
      container.classList.add(`flash-${type}`);
      setTimeout(() => {
        container.classList.remove(`flash-${type}`);
      }, 300);
    }
  }

  showInterventionFeedback(data) {
    if (data.characterId !== this.currentCharacter?.id) return;
    
    if (data.success) {
      this.showStatus(`${data.intervention.type} completed successfully`, 'success');
      
      if (data.result && data.result.message) {
        this.showStatus(data.result.message, 'info');
      }
    } else {
      this.showStatus(`Failed: ${data.error}`, 'error');
    }
  }

  showDebugAlert(data) {
    if (data.characterId !== this.currentCharacter?.id) return;
    
    this.showStatus(`Debug hook triggered: ${data.hook.name}`, 'warning');
  }

  showResourceDetails(resourceName) {
    console.log(`Showing details for resource: ${resourceName}`);
    // Implement resource detail modal/popup here
  }

  showProcessContextMenu(event, pid) {
    console.log(`Context menu for process: ${pid}`);
    // Implement process context menu here
  }

  showMemoryBlockDetails(address) {
    console.log(`Showing details for memory block: ${address}`);
    // Implement memory block detail modal/popup here
  }
}

// Initialize monitor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM ready, initializing monitor...');
  
  // Wait a bit for other scripts to load
  setTimeout(() => {
    // Clear any existing monitor instance first
    if (window.monitor) {
      console.log('🗑️ Clearing existing monitor instance');
      delete window.monitor;
    }
    
    try {
      window.monitor = new Monitor();
      console.log('✅ Monitor initialized successfully');
      console.log('📋 Monitor methods:', Object.getOwnPropertyNames(Monitor.prototype));
      
      // Auto-start monitoring if character is already selected
      if (window.stateManager && window.stateManager.getCurrentCharacter()) {
        console.log('🎯 Auto-starting monitoring for existing character');
        window.monitor.startMonitoring();
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize monitor:', error);
      
      // Fallback: create basic monitor functionality
      window.monitor = {
        isActive: false,
        refreshData: function() {
          console.log('📡 Fallback refresh data');
          if (window.socketClient && window.socketClient.isConnected) {
            window.socketClient.requestSystemResources();
            window.socketClient.requestErrorLogs();
            window.socketClient.requestMemoryAllocation();
          }
        },
        togglePause: function() {
          this.isActive = !this.isActive;
          console.log('⏯️ Fallback toggle pause:', this.isActive ? 'resumed' : 'paused');
        },
        startMonitoring: function() {
          this.isActive = true;
          console.log('▶️ Fallback start monitoring');
          this.refreshData();
        }
      };
      
      // Manually attach button listeners as fallback
      const refreshBtn = document.getElementById('refreshMonitor');
      const pauseBtn = document.getElementById('pauseMonitor');
      
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => window.monitor.refreshData());
        console.log('✅ Fallback refresh button attached');
      }
      
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => window.monitor.togglePause());
        console.log('✅ Fallback pause button attached');
      }
    }
  }, 500);
});

// Also initialize if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    if (!window.monitor) {
      console.log('🚀 Late initialization of monitor...');
      
      try {
        window.monitor = new Monitor();
      } catch (error) {
        console.error('❌ Late initialization failed:', error);
      }
    }
  }, 100);
}

// Manual button fix function for console use
window.fixMonitorButtons = function() {
  console.log('🔧 Manual button fix...');
  
  const refreshBtn = document.getElementById('refreshMonitor');
  const pauseBtn = document.getElementById('pauseMonitor');
  
  if (refreshBtn) {
    refreshBtn.onclick = function() {
      console.log('🔄 Manual refresh triggered');
      if (window.monitor && window.monitor.refreshData) {
        window.monitor.refreshData();
      } else if (window.socketClient) {
        window.socketClient.requestSystemResources();
        window.socketClient.requestErrorLogs();
        window.socketClient.requestMemoryAllocation();
      }
    };
    console.log('✅ Refresh button manually fixed');
  }
  
  if (pauseBtn) {
    pauseBtn.onclick = function() {
      console.log('⏯️ Manual pause triggered');
      if (window.monitor && window.monitor.togglePause) {
        window.monitor.togglePause();
      }
    };
    console.log('✅ Pause button manually fixed');
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Monitor;
}