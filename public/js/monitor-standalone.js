// Standalone Monitor for System Resources
class StandaloneMonitor {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isMonitoring = false;
    this.currentCharacter = null;
    this.updateInterval = null;
    
    this.init();
  }

  init() {
    // Initialize socket connection
    this.socket = io();
    
    // Setup UI elements
    this.setupElements();
    
    // Setup socket listeners
    this.setupSocketListeners();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  setupElements() {
    console.log('Setting up UI elements...');
    
    // Connection status
    this.connectionStatus = document.getElementById('connectionStatus');
    console.log('Connection status element:', this.connectionStatus);
    
    // Resource elements
    this.cpuBar = document.getElementById('cpuBar');
    this.cpuValue = document.getElementById('cpuValue');
    this.memoryBar = document.getElementById('memoryBar');
    this.memoryValue = document.getElementById('memoryValue');
    this.threadsBar = document.getElementById('threadsBar');
    this.threadsValue = document.getElementById('threadsValue');
    
    // Process list
    this.processList = document.getElementById('processList');
    
    // Memory pools
    this.shortTermBar = document.getElementById('shortTermBar');
    this.shortTermValue = document.getElementById('shortTermValue');
    this.longTermBar = document.getElementById('longTermBar');
    this.longTermValue = document.getElementById('longTermValue');
    this.proceduralBar = document.getElementById('proceduralBar');
    this.proceduralValue = document.getElementById('proceduralValue');
    this.traumaticBar = document.getElementById('traumaticBar');
    this.traumaticValue = document.getElementById('traumaticValue');
    
    // Memory stats
    this.totalMemories = document.getElementById('totalMemories');
    this.fragmentation = document.getElementById('fragmentation');
    
    // Error log
    this.errorLog = document.getElementById('errorLog');
    
    // Controls
    this.characterSelect = document.getElementById('characterSelect');
    this.startBtn = document.getElementById('startMonitoring');
    this.stopBtn = document.getElementById('stopMonitoring');
    
    console.log('Control elements:', {
      characterSelect: this.characterSelect,
      startBtn: this.startBtn,
      stopBtn: this.stopBtn
    });
    
    // Initialize button states
    this.updateButtonStates();
  }

  setupSocketListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;
      this.updateConnectionStatus(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
      this.updateConnectionStatus(false);
    });

    // Monitoring events
    this.socket.on('monitoring-started', (data) => {
      console.log('Monitoring started:', data);
      this.isMonitoring = true;
      this.updateButtonStates();
      this.startDataPolling();
    });

    this.socket.on('monitoring-stopped', (data) => {
      console.log('Monitoring stopped:', data);
      this.isMonitoring = false;
      this.updateButtonStates();
      this.stopDataPolling();
    });

    // Data events
    this.socket.on('system-resources', (data) => {
      console.log('System resources:', data);
      this.updateResourceDisplay(data.resources);
    });

    this.socket.on('error-logs', (data) => {
      console.log('Error logs:', data);
      this.updateErrorDisplay(data.errors);
    });

    this.socket.on('memory-allocation', (data) => {
      console.log('Memory allocation:', data);
      this.updateMemoryDisplay(data.memoryData);
    });

    // Consciousness updates
    this.socket.on('consciousness-update', (data) => {
      console.log('Consciousness update:', data);
      this.handleConsciousnessUpdate(data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.showError(error.message || 'Connection error');
    });
  }

  setupEventListeners() {
    // Character selection - listen for both change and input events
    const handleSelectionChange = () => {
      const hasSelection = this.characterSelect.value !== '';
      this.startBtn.disabled = !hasSelection || this.isMonitoring;
      this.stopBtn.disabled = !this.isMonitoring;
    };
    
    this.characterSelect.addEventListener('change', handleSelectionChange);
    this.characterSelect.addEventListener('input', handleSelectionChange);
    
    // Also check periodically for changes (fallback)
    setInterval(() => {
      if (this.characterSelect.value !== this.lastKnownValue) {
        this.lastKnownValue = this.characterSelect.value;
        handleSelectionChange();
      }
    }, 500);
    
    this.lastKnownValue = this.characterSelect.value;

    // Start monitoring
    this.startBtn.addEventListener('click', () => {
      this.startMonitoring();
    });

    // Stop monitoring
    this.stopBtn.addEventListener('click', () => {
      this.stopMonitoring();
    });
    
    // Set Alexander Kane as default
    this.characterSelect.value = 'alexander-kane';
    handleSelectionChange();
  }

  startMonitoring() {
    const characterId = this.characterSelect.value;
    if (!characterId) return;

    this.currentCharacter = characterId;
    this.socket.emit('start-monitoring', { characterId });
  }

  stopMonitoring() {
    if (!this.currentCharacter) return;

    this.socket.emit('stop-monitoring', { characterId: this.currentCharacter });
    this.currentCharacter = null;
  }

  startDataPolling() {
    // Request data immediately
    this.requestAllData();
    
    // Then poll every 2 seconds
    this.updateInterval = setInterval(() => {
      this.requestAllData();
    }, 2000);
  }

  stopDataPolling() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  requestAllData() {
    if (!this.isMonitoring) return;
    
    this.socket.emit('get-system-resources');
    this.socket.emit('get-error-logs');
    this.socket.emit('get-memory-allocation');
  }

  updateConnectionStatus(connected) {
    if (connected) {
      this.connectionStatus.classList.add('connected');
      this.connectionStatus.querySelector('.status-text').textContent = 'Connected';
    } else {
      this.connectionStatus.classList.remove('connected');
      this.connectionStatus.querySelector('.status-text').textContent = 'Disconnected';
    }
  }

  updateButtonStates() {
    this.startBtn.disabled = this.isMonitoring || !this.characterSelect.value;
    this.stopBtn.disabled = !this.isMonitoring;
  }

  updateResourceDisplay(resources) {
    if (!resources) return;

    // CPU Usage
    if (resources.cpu !== undefined) {
      const cpuPercent = Math.min(100, Math.max(0, resources.cpu));
      this.cpuBar.style.width = cpuPercent + '%';
      this.cpuValue.textContent = cpuPercent.toFixed(1) + '%';
    }

    // FIXED: Memory Usage - Use proper capacity calculation
    if (resources.memory) {
      // Use the new memory capacity structure if available
      if (resources.memory.total && resources.memory.used !== undefined) {
        const memPercent = (resources.memory.used / resources.memory.total) * 100;
        this.memoryBar.style.width = memPercent + '%';
        this.memoryValue.textContent = `${resources.memory.used.toFixed(0)}MB / ${resources.memory.total}MB`;
      } else {
        // Fallback for legacy format
        const memUsed = resources.memory.used || 0;
        const memTotal = resources.memory.total || 1;
        const memPercent = (memUsed / memTotal) * 100;
        this.memoryBar.style.width = memPercent + '%';
        this.memoryValue.textContent = memUsed.toFixed(0) + ' MB';
      }
    }

    // Thread Count
    if (resources.threads) {
      const threadCount = resources.threads.active || 0;
      const maxThreads = resources.threads.max || 10;
      const threadPercent = (threadCount / maxThreads) * 100;
      this.threadsBar.style.width = threadPercent + '%';
      this.threadsValue.textContent = threadCount;
    }

    // Process List
    if (resources.processes && Array.isArray(resources.processes)) {
      this.updateProcessList(resources.processes);
    }
}

  updateProcessList(processes) {
    if (!processes || processes.length === 0) {
      this.processList.innerHTML = '<div class="empty-state">No processes running</div>';
      return;
    }

    const processHtml = processes.map(process => `
      <div class="process-item">
        <span class="process-pid">${process.pid}</span>
        <span class="process-name">${process.name}</span>
        <span class="process-state ${process.state}">${process.state}</span>
        <span class="process-cpu">${(process.cpu || 0).toFixed(1)}%</span>
      </div>
    `).join('');

    this.processList.innerHTML = processHtml;
  }

  updateMemoryDisplay(memoryData) {
    if (!memoryData) return;

    // Memory pools
    if (memoryData.pools) {
      this.updateMemoryPool('shortTerm', memoryData.pools.shortTerm || 0);
      this.updateMemoryPool('longTerm', memoryData.pools.longTerm || 0);
      this.updateMemoryPool('procedural', memoryData.pools.procedural || 0);
      this.updateMemoryPool('traumatic', memoryData.pools.traumatic || 0);
    }

    // Memory stats
    if (memoryData.totalMemories !== undefined) {
      this.totalMemories.textContent = memoryData.totalMemories;
    }
    if (memoryData.fragmentationLevel !== undefined) {
      this.fragmentation.textContent = (memoryData.fragmentationLevel * 100).toFixed(1) + '%';
    }
  }

  updateMemoryPool(poolName, value) {
    const bar = this[poolName + 'Bar'];
    const valueEl = this[poolName + 'Value'];
    
    if (bar && valueEl) {
      const maxValue = 2000; // Default max for memory pools
      const percent = Math.min(100, (value / maxValue) * 100);
      bar.style.width = percent + '%';
      valueEl.textContent = value;
    }
  }

  updateErrorDisplay(errors) {
    if (!errors || errors.length === 0) {
      this.errorLog.innerHTML = '<div class="empty-state">No errors detected</div>';
      return;
    }

    const errorHtml = errors.slice(0, 10).map(error => `
      <div class="error-item ${error.severity}">
        <div class="error-header">
          <span class="error-type">${error.type}</span>
          <span class="error-time">${new Date(error.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="error-message">${error.description}</div>
        <div class="error-source">Source: ${error.source}</div>
      </div>
    `).join('');

    this.errorLog.innerHTML = errorHtml;
  }

  handleConsciousnessUpdate(data) {
    if (!data.state) return;

    const state = data.state;
    
    // Extract and update resources
    if (state.consciousness && state.consciousness.resources) {
      this.updateResourceDisplay({
        cpu: { usage: state.consciousness.resources.cpu?.current || 0 },
        memory: {
          used: state.consciousness.resources.memory?.current || 0,
          total: state.consciousness.resources.memory?.max || 2048
        },
        threads: {
          active: state.consciousness.resources.threads?.current || 0,
          max: state.consciousness.resources.threads?.max || 10
        },
        processes: state.consciousness.processes || []
      });
    }

    // Update memory if available
    if (state.consciousness && state.consciousness.memory) {
      this.updateMemoryDisplay(state.consciousness.memory);
    }

    // Update errors if available
    if (state.consciousness && state.consciousness.system_errors) {
      this.updateErrorDisplay(state.consciousness.system_errors);
    }
  }

  showError(message) {
    console.error('Monitor error:', message);
    // Could add a toast notification here
  }
}

// Initialize monitor when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.monitor = new StandaloneMonitor();
});
