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
    
    // Don't start monitoring here - wait for user action
    console.log('Monitor initialized (inactive, waiting for user to start)');
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
    console.error('SocketClient not available for monitor');
    return;
  }

  // ENHANCED Real-time consciousness updates with extensive debugging
  window.socketClient.on('consciousness-update', (data) => {
  console.log('🧠 MONITOR: Received consciousness-update:', {
    timestamp: new Date().toISOString(),
    monitorIsActive: this.isActive,
    hasCurrentCharacter: !!this.currentCharacter,
    currentCharacterID: this.currentCharacter?.id,
    dataCharacterID: data?.characterId
  });
    

    // CRITICAL: Process consciousness updates regardless of isActive
    if (this.isActive && this.currentCharacter && data?.characterId === this.currentCharacter.id) {
    console.log('✅ MONITOR: Processing consciousness update');
    
    try {
      // The data already contains consciousness at the top level
      this.updateDisplays(data);
      this.updateDataHistory(data);
      
      console.log('✅ MONITOR: Successfully processed consciousness update');
    } catch (error) {
      console.error('❌ MONITOR: Error processing consciousness update:', error);
    }
  } else {
    console.log('⏭️ MONITOR: Skipping update (monitor not active or wrong character)');
  }
});

  // Enhanced monitoring started handler
  window.socketClient.on('monitoring-started', (data) => {
    console.log('🚀 MONITOR: monitoring-started event received:', data);
    
    if (this.currentCharacter && data?.characterId === this.currentCharacter.id) {
      console.log('✅ MONITOR: Activating for monitoring-started');
      this.isActive = true;
      this.updateButtonStates();
      
      // Process initial state if provided
      if (data.initialState) {
        console.log('📊 MONITOR: Processing initial state from monitoring-started');
        this.updateDisplays({ state: data.initialState });
      }
    }
  });

  // Keep your existing handlers...
  window.socketClient.on('system-resources', (data) => {
    console.log('📈 MONITOR: Received system resources:', data);
    if (data.resources) {
      this.updateResourceMeters(data.resources);
    }
  });

  window.socketClient.on('error-logs', (data) => {
    console.log('🚨 MONITOR: Received error logs:', data);
    if (data.errors) {
      this.updateErrorLog(data.errors);
    }
  });

  window.socketClient.on('memory-allocation', (data) => {
    console.log('🧠 MONITOR: Received memory allocation:', data);
    if (data.memoryData) {
      this.updateMemoryVisualization(data.memoryData);
    }
  });

  window.socketClient.on('error', (error) => {
    console.error('💥 MONITOR: Socket error:', error);
    if (this.showStatus) {
      this.showStatus(`Socket error: ${error.message}`, 'error');
    }
  });
}

// ALSO ADD: Enhanced startCharacterMonitoring method
startCharacterMonitoring(character) {
  if (!window.socketClient || !character) return;

  console.log('🎯 Starting character monitoring for:', character.id);

  // Ensure monitor is active
  this.isActive = true;
  this.updateButtonStates();

  // Start WebSocket monitoring
  window.socketClient.startMonitoring(character.id);

  // Request initial data with delay to ensure server is ready
  setTimeout(() => {
    console.log('📡 Requesting initial system data...');
    window.socketClient.emit('get-system-resources');
    window.socketClient.emit('get-error-logs'); 
    window.socketClient.emit('get-memory-allocation');
  }, 200);
}

// ENHANCED: Add debug method to check monitor state
getDebugState() {
  return {
    isActive: this.isActive,
    currentCharacter: this.currentCharacter?.id || null,
    hasSocketClient: !!window.socketClient,
    socketConnected: window.socketClient?.isConnected || false,
    lastUpdateTime: this.lastUpdateTime,
    dataHistoryLengths: {
      resources: this.dataHistory?.resources?.length || 0,
      processes: this.dataHistory?.processes?.length || 0,
      errors: this.dataHistory?.errors?.length || 0
    }
  }
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
  console.log('🎯 MONITOR: updateDisplays called with:', {
    dataType: typeof data,
    hasState: !!data?.state,
    hasConsciousness: !!data?.consciousness,
    hasProcesses: !!(data?.processes || data?.state?.processes || data?.consciousness?.processes),
    dataKeys: Object.keys(data || {})
  });

  if (!data) {
    console.warn('❌ MONITOR: updateDisplays received null/undefined data');
    return;
  }
  
  // Handle different data structure formats
  let consciousness = null;
  
  if (data.state && data.state.consciousness) {
    consciousness = data.state.consciousness;
    console.log('📊 MONITOR: Using data.state.consciousness');
  } else if (data.consciousness) {
    consciousness = data.consciousness;
    console.log('📊 MONITOR: Using data.consciousness');
  } else if (data.processes || data.system_errors) {
    consciousness = data;
    console.log('📊 MONITOR: Using data directly as consciousness');
  } else {
    consciousness = data;
    console.log('📊 MONITOR: Using data as fallback consciousness');
  }
  
  if (!consciousness) {
    console.warn('❌ MONITOR: No valid consciousness data found in updateDisplays');
    return;
  }
  
  console.log('✅ MONITOR: Extracted consciousness data:', {
    hasProcesses: !!consciousness.processes,
    processCount: consciousness.processes?.length || 0,
    hasResources: !!consciousness.resources,
    hasMemory: !!consciousness.memory,
    hasErrors: !!consciousness.system_errors
  });
  
  // Update all components with debugging
  const processes = consciousness.processes || [];
  const resources = consciousness.resources;
  const memory = consciousness.memory;
  const system_errors = consciousness.system_errors || [];
  
  if (processes.length > 0) {
    console.log('🔄 MONITOR: Updating process table with', processes.length, 'processes');
    this.updateProcessTable(processes);
  } else {
    console.log('⚠️ MONITOR: No processes to update');
  }
  
  if (resources) {
    console.log('🔄 MONITOR: Updating resource meters');
    this.updateResourceMeters(resources);
  } else if (processes.length > 0) {
    console.log('🔄 MONITOR: Generating synthetic resources from processes');
    this.generateResourcesFromProcesses(processes);
  }
  
  if (memory) {
    console.log('🔄 MONITOR: Updating memory visualization');
    this.updateMemoryVisualization(memory);
  }
  
  if (system_errors.length > 0) {
    console.log('🔄 MONITOR: Updating error log with', system_errors.length, 'errors');
    this.updateErrorLog(system_errors);
  }
  
  // Update timestamps and visual feedback
  this.lastUpdateTime = new Date();
  this.updateStatusTime();
  this.flashUpdate();
  
  console.log('✅ MONITOR: updateDisplays completed successfully');
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
  console.log('updateResourceMeters received:', resources);
  console.trace('Call stack'); // This will show us who's calling this
  
  if (!this.resourceMeters) {
    console.warn('Resource meters element not found');
    return;
  }
  
  // Add a guard to prevent infinite recursion
  if (this._updatingResources) {
    console.warn('Already updating resources - preventing recursion');
    return;
  }
  this._updatingResources = true;

  // Handle empty or invalid resources
  if (!resources || typeof resources !== 'object' || Object.keys(resources).length === 0) {
    console.warn('Invalid or empty resources data');
    // Provide default structure
    resources = {
      cpu: { used: 0, total: 100, percentage: 0 },
      memory: { used: 0, total: 1024, available: 1024, percentage: 0 },
      threads: { used: 0, total: 16, percentage: 0 }
    };
  }

const emptyState = this.resourceMeters.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }
  
 // Build resource meters HTML
  const metersHTML = `
    <div class="resource-meter">
      <div class="meter-label">
        <span>CPU Usage</span>
        <span class="meter-value">${(resources.cpu?.percentage || 0).toFixed(1)}%</span>
      </div>
      <div class="meter-bar">
        <div class="meter-fill cpu-fill" style="width: ${resources.cpu?.percentage || 0}%"></div>
      </div>
    </div>
    
    <div class="resource-meter">
      <div class="meter-label">
        <span>Memory</span>
        <span class="meter-value">${(resources.memory?.used || 0).toFixed(0)}MB / ${(resources.memory?.total || 1024).toFixed(0)}MB</span>
      </div>
      <div class="meter-bar">
        <div class="meter-fill memory-fill" style="width: ${resources.memory?.percentage || 0}%"></div>
      </div>
    </div>
    
    <div class="resource-meter">
      <div class="meter-label">
        <span>Threads</span>
        <span class="meter-value">${resources.threads?.used || 0} / ${resources.threads?.total || 16}</span>
      </div>
      <div class="meter-bar">
        <div class="meter-fill thread-fill" style="width: ${resources.threads?.percentage || 0}%"></div>
      </div>
    </div>
  `;

  this.resourceMeters.innerHTML = metersHTML;
  console.log('✅ Resource meters updated');

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

   // metersElement.innerHTML = html;

   this._updatingResources = false;
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
// ADDED: Debug method to check monitor state
  getDebugState() {
    return {
      isActive: this.isActive,
      currentCharacter: this.currentCharacter?.id || null,
      hasSocketClient: !!window.socketClient,
      socketConnected: window.socketClient?.isConnected || false,
      lastUpdateTime: this.lastUpdateTime,
      dataHistoryLengths: {
        resources: this.dataHistory?.resources?.length || 0,
        processes: this.dataHistory?.processes?.length || 0,
        errors: this.dataHistory?.errors?.length || 0
      }
    };
  }

  // ADDED: Method to manually force activation (for debugging)
  forceActivate() {
    console.log('🔥 Forcing monitor activation...');
    this.isActive = true;
    this.updateButtonStates();
    this.showStatus('Monitor force-activated', 'info');
    
    if (this.currentCharacter) {
      this.startCharacterMonitoring(this.currentCharacter);
    }
  }

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

export default Monitor;