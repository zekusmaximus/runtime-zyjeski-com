// public/js/modules/monitor/monitor-ui.js
// Fixed implementation that handles the actual data structure from the server

import { ProcessList } from '../../components/ProcessList.js';
import ResourceMeter from '../../components/ResourceMeter.js';

class MonitorUI {
  constructor() {
    this.elements = {};
    this.isInitialized = false;
    this.processList = null; // ProcessList component instance

    // ResourceMeter component instances
    this.resourceMeters = {
      cpu: null,
      memory: null,
      threads: null
    };

    // Memory allocation meter
    this.memoryMeter = null;

    // Inject CSS once for flash effects
    this.addFlashCSS();
  }

  initialize(controller) {
    if (this.isInitialized) return;

    this.controller = controller;
    this.cacheElements();
    this.setupEventListeners();
    this._initializeProcessList();
    this._initializeResourceMeters();
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
    const memoryPercentage = memory.percentage || ((memory.used || 0) / (memory.total || 10000)) * 100;
    const threads = resources.threads || { percentage: 0, used: 0, total: 32 };
    const threadCount = threads.used || threads.active || 0;

    // Create ResourceMeter instances if not already created and monitor is visible
    if (!this.resourceMeters.cpu && !this._useLegacyResourceMeters) {
      // Small delay to ensure DOM layout is complete
      setTimeout(() => {
        this._createResourceMeterInstances();
        // Re-update with current data after creation
        if (this.resourceMeters.cpu) {
          this.resourceMeters.cpu.update(cpuPercentage);
          this.resourceMeters.memory.update(memoryPercentage);
          this.resourceMeters.threads.update(threadCount);
        }
      }, 100);
      return; // Skip update this time, will update after creation
    }

    // Update ResourceMeter components if available
    if (this.resourceMeters.cpu && !this._useLegacyResourceMeters) {
      this.resourceMeters.cpu.update(cpuPercentage);
      this.resourceMeters.memory.update(memoryPercentage);
      this.resourceMeters.threads.update(threadCount);
    } else {
      // Fallback to legacy HTML implementation
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
            <div class="resource-fill" style="width: ${memoryPercentage}%"></div>
          </div>
          <div class="resource-value">${memory.used || 0} / ${memory.total || 0} MB</div>
        </div>
        <div class="resource-meter">
          <div class="resource-label">Threads</div>
          <div class="resource-bar">
            <div class="resource-fill" style="width: ${threads.percentage || 0}%"></div>
          </div>
          <div class="resource-value">${threadCount} / ${threads.total || 32}</div>
        </div>
      `;

      this.elements.resourceMeters.innerHTML = html;
    }
  }

  /**
   * Initialize ProcessList component
   * @private
   */
  _initializeProcessList() {
    if (!this.elements.processTable) {
      console.warn('ProcessList: processTable element not found, skipping initialization');
      return;
    }

    try {
      // Create ProcessList component with monitor-appropriate options
      this.processList = new ProcessList(this.elements.processTable, {
        showHealth: true,
        showWarnings: true,
        showResources: true,
        showDescription: false, // Use tooltips only
        interactive: true,
        selectable: true,
        multiSelect: false,
        virtualScroll: true,
        rowHeight: 48,
        visibleRows: 12,
        theme: 'dark',
        compactMode: false
      });

      // Set up event handlers for monitor integration
      this._setupProcessListEvents();

      console.log('ProcessList component initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ProcessList component:', error);
      // Fallback to legacy implementation
      this._useLegacyProcessTable = true;
    }
  }

  /**
   * Initialize ResourceMeter components
   * @private
   */
  _initializeResourceMeters() {
    if (!this.elements.resourceMeters) {
      console.warn('ResourceMeters: resourceMeters element not found, skipping initialization');
      return;
    }

    // Only create the HTML structure, defer ResourceMeter creation until monitor is visible
    this.elements.resourceMeters.innerHTML = `
      <div class="resource-meter-grid">
        <div class="resource-meter-item">
          <h4>Mental Processing Load</h4>
          <div id="cpu-meter-container" class="meter-container"></div>
        </div>
        <div class="resource-meter-item">
          <h4>Emotional Weight Capacity</h4>
          <div id="memory-meter-container" class="meter-container"></div>
        </div>
        <div class="resource-meter-item">
          <h4>Concurrent Thought Streams</h4>
          <div id="threads-meter-container" class="meter-container"></div>
        </div>
      </div>
    `;

    console.log('ResourceMeter containers created, meters will be initialized when monitor becomes visible');
  }

  /**
   * Create ResourceMeter instances when monitor is visible
   * @private
   */
  _createResourceMeterInstances() {
    // Check if monitor section is visible
    const monitorSection = document.getElementById('monitor');
    if (!monitorSection || !monitorSection.classList.contains('active')) {
      console.log('Monitor section not active, skipping ResourceMeter creation');
      return false;
    }

    // Check if already created
    if (this.resourceMeters.cpu && this.resourceMeters.memory && this.resourceMeters.threads) {
      return true;
    }

    try {
      // Create ResourceMeter instances
      this.resourceMeters.cpu = new ResourceMeter(document.getElementById('cpu-meter-container'), {
        type: 'circular',
        metric: 'cpu',
        size: { width: 150, height: 150 },
        labelFormat: (value, metric) => `Mental Processing: ${value.toFixed(1)}% Load`,
        thresholds: { low: 30, medium: 70, high: 90 }
      });

      this.resourceMeters.memory = new ResourceMeter(document.getElementById('memory-meter-container'), {
        type: 'circular',
        metric: 'memory',
        size: { width: 150, height: 150 },
        labelFormat: (value, metric) => `Emotional Weight: ${value.toFixed(1)}% Full`,
        thresholds: { low: 40, medium: 75, high: 90 }
      });

      this.resourceMeters.threads = new ResourceMeter(document.getElementById('threads-meter-container'), {
        type: 'circular',
        metric: 'threads',
        size: { width: 150, height: 150 },
        max: 32,
        labelFormat: (value, metric) => `Thought Streams: ${value.toFixed(0)} Active`,
        thresholds: { low: 8, medium: 20, high: 28 }
      });

      // Give initial values to ensure they render
      this.resourceMeters.cpu.update(0);
      this.resourceMeters.memory.update(0);
      this.resourceMeters.threads.update(0);

      console.log('ResourceMeter instances created successfully');
      return true;
    } catch (error) {
      console.error('Failed to create ResourceMeter instances:', error);
      // Fallback to legacy HTML implementation
      this._useLegacyResourceMeters = true;
      return false;
    }
  }

  /**
   * Set up ProcessList event handlers
   * @private
   */
  _setupProcessListEvents() {
    if (!this.processList) return;

    // Handle process clicks for debugging
    this.processList.on('process-click', (data) => {
      console.log('Process clicked for debugging:', data.process);

      // Emit event for debugger integration
      if (this.controller && this.controller.onProcessSelected) {
        this.controller.onProcessSelected(data.process);
      }

      // Global event for other components
      window.dispatchEvent(new CustomEvent('monitor:process-selected', {
        detail: { process: data.process, event: data.event }
      }));
    });

    // Handle process context menu for interventions
    this.processList.on('process-context-menu', (data) => {
      console.log('Process context menu:', data.process);

      // Emit event for intervention system
      window.dispatchEvent(new CustomEvent('monitor:process-context-menu', {
        detail: { process: data.process, event: data.event }
      }));
    });

    // Handle selection changes
    this.processList.on('selection-change', (data) => {
      console.log('Process selection changed:', data.selected);

      // Update UI state based on selection
      this._updateProcessActions(data.selected);
    });

    // Handle process hover for tooltips
    this.processList.on('process-hover', (data) => {
      // Show process description in tooltip if available
      if (data.process.description) {
        data.event.target.closest('.process-row').title = data.process.description;
      }
    });
  }

  /**
   * Update process actions based on selection
   * @private
   * @param {Array} selectedPids - Array of selected process PIDs
   */
  _updateProcessActions(selectedPids) {
    // Update action buttons or context menus based on selection
    // This can be extended for future process management features
    const hasSelection = selectedPids.length > 0;

    // Example: Enable/disable action buttons
    const actionButtons = document.querySelectorAll('.process-action-btn');
    actionButtons.forEach(btn => {
      btn.disabled = !hasSelection;
    });
  }

  updateProcessTable(processes) {
    console.log('🔄 Updating process table:', processes);

    // Use ProcessList component if available, otherwise fallback to legacy
    if (this.processList && !this._useLegacyProcessTable) {
      this._updateProcessListComponent(processes);
    } else {
      this._updateLegacyProcessTable(processes);
    }
  }

  /**
   * Update ProcessList component with transformed data
   * @private
   * @param {Array} processes - Raw process data from monitor state
   */
  _updateProcessListComponent(processes) {
    if (!this.processList) return;

    try {
      // Transform process data using ConsciousnessTransformer if available
      let transformedProcesses = processes;

      if (window.consciousnessTransformer && processes && processes.length > 0) {
        // Create consciousness data structure for transformer
        const consciousnessData = {
          timestamp: new Date().toISOString(),
          processes: processes
        };

        transformedProcesses = window.consciousnessTransformer.extractProcesses(consciousnessData);
        console.log('🔄 Transformed processes for ProcessList:', transformedProcesses);
      } else {
        // Fallback transformation for compatibility
        transformedProcesses = this._transformProcessesForProcessList(processes);
      }

      // Update ProcessList component
      this.processList.update(transformedProcesses);

    } catch (error) {
      console.error('Error updating ProcessList component:', error);
      // Fallback to legacy implementation
      this._updateLegacyProcessTable(processes);
    }
  }

  /**
   * Fallback transformation when ConsciousnessTransformer is not available
   * @private
   * @param {Array} processes - Raw process data
   * @returns {Array} Transformed process data
   */
  _transformProcessesForProcessList(processes) {
    if (!Array.isArray(processes)) return [];

    return processes.map(process => ({
      pid: process.pid || -1,
      name: process.name || 'Unknown Process',
      status: process.status || 'unknown',
      health: this._calculateProcessHealth(process),
      indicator: this._generateProcessIndicator(process),
      warnings: this._extractProcessWarnings(process),
      trend: 'stable',
      cpu: process.cpu_usage || process.cpuUsage || 0,
      memory: process.memory_mb || process.memoryUsage || 0,
      threads: process.threads || process.threadCount || 0,
      priority: process.priority || 'normal',
      lifetime: process.lifetime || 0,
      debuggable: process.debuggable !== false,
      description: process.description || `${process.name} - ${process.status}`
    }));
  }

  /**
   * Calculate process health for fallback transformation
   * @private
   * @param {Object} process - Process data
   * @returns {number} Health percentage (0-100)
   */
  _calculateProcessHealth(process) {
    const stability = process.stability || 1.0;
    const cpuUsage = process.cpu_usage || process.cpuUsage || 0;
    const memoryUsage = process.memory_mb || process.memoryUsage || 0;

    // Simple health calculation based on stability and resource usage
    let health = stability * 100;

    // Reduce health for high resource usage
    if (cpuUsage > 80) health -= 20;
    if (memoryUsage > 1000) health -= 15;

    // Status-based adjustments
    switch (process.status) {
      case 'error':
      case 'crashed':
        health = Math.min(health, 10);
        break;
      case 'blocked':
      case 'warning':
        health = Math.min(health, 50);
        break;
      case 'terminated':
        health = 0;
        break;
    }

    return Math.max(0, Math.min(100, Math.round(health)));
  }

  /**
   * Generate process indicator for fallback transformation
   * @private
   * @param {Object} process - Process data
   * @returns {Object} Indicator object with color, icon, and pulse
   */
  _generateProcessIndicator(process) {
    const status = process.status || 'unknown';

    const indicators = {
      running: { color: '#4CAF50', icon: 'activity', pulse: false },
      blocked: { color: '#FF9800', icon: 'pause', pulse: true },
      terminated: { color: '#757575', icon: 'stop', pulse: false },
      error: { color: '#F44336', icon: 'error', pulse: true },
      crashed: { color: '#F44336', icon: 'error', pulse: true },
      warning: { color: '#FFC107', icon: 'warning', pulse: true }
    };

    return indicators[status] || { color: '#757575', icon: 'activity', pulse: false };
  }

  /**
   * Extract process warnings for fallback transformation
   * @private
   * @param {Object} process - Process data
   * @returns {Array} Array of warning strings
   */
  _extractProcessWarnings(process) {
    const warnings = [];

    const cpuUsage = process.cpu_usage || process.cpuUsage || 0;
    const memoryUsage = process.memory_mb || process.memoryUsage || 0;

    if (cpuUsage > 80) warnings.push('high_cpu_usage');
    if (memoryUsage > 1000) warnings.push('high_memory_usage');
    if (process.status === 'warning') warnings.push('process_warning');
    if (process.currentIssues && process.currentIssues.length > 0) {
      warnings.push('process_issues');
    }

    return warnings;
  }

  /**
   * Legacy process table implementation (fallback)
   * @private
   * @param {Array} processes - Process data
   */
  _updateLegacyProcessTable(processes) {
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
    
    if (!this.elements.memoryVisualization) {
      console.log('🧠 Memory visualization element not found in cache, re-caching...');
      // Re-cache all elements as monitor section might have become active
      this.cacheElements();
      
      if (!this.elements.memoryVisualization) {
        console.error('❌ Memory visualization element still not found!');
        console.log('Current page URL:', window.location.href);
        const monitorSection = document.getElementById('monitor');
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

    // Create container for ResourceMeter and detailed memory blocks
    let html = '';
    let hasData = false;

    // Add ResourceMeter for overall memory allocation if we have capacity data
    if (memoryData.capacity && typeof memoryData.capacity === 'object') {
      const capacity = memoryData.capacity;
      const usedPercent = capacity.total ? ((capacity.allocated || 0) / capacity.total * 100) : 0;

      html += `
        <div class="memory-overview">
          <div class="memory-meter-container">
            <div class="memory-meter-header">
              <span class="memory-meter-stats">${capacity.allocated || 0} MB / ${capacity.total || 0} MB (${usedPercent.toFixed(1)}%)</span>
            </div>
            <div class="memory-meter" id="memoryMeter"></div>
          </div>
        </div>
      `;
      hasData = true;
    }

    // Handle the detailed memory structure from the server
    html += '<div class="memory-details">';
    
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

      html += `
        <div class="memory-section">
          <h4>Memory Pools</h4>
          <div class="memory-pools">
      `;
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
      html += `
          </div>
        </div>
      `;
    }
    
    // Show capacity info
    if (memoryData.capacity && typeof memoryData.capacity === 'object') {
      hasData = true;
      const capacity = memoryData.capacity;
      const usedPercent = capacity.total ? ((capacity.allocated || 0) / capacity.total * 100).toFixed(1) : 0;

      html += `
        <div class="memory-section">
          <h4>System Statistics</h4>
          <div class="memory-stats">
            <div class="memory-capacity">
              <div><strong>Capacity:</strong> ${capacity.total || 0} MB</div>
              <div><strong>Available:</strong> ${capacity.available || 0} MB</div>
              <div><strong>Reserved:</strong> ${capacity.reserved || 0} MB</div>
            </div>
            <div class="memory-fragmentation">
              <div><strong>Fragmentation:</strong> ${((memoryData.fragmentationLevel || 0) * 100).toFixed(1)}%</div>
              <div><strong>Total Memories:</strong> ${memoryData.totalMemories || 'Unknown'}</div>
            </div>
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

      // Create ResourceMeter for memory allocation if we have capacity data
      if (memoryData.capacity && typeof memoryData.capacity === 'object') {
        this.createMemoryResourceMeter(memoryData.capacity);
      }
    } else {
      this.elements.memoryVisualization.innerHTML = '<div class="empty-state">No memory data available.</div>';
    }
  }

  createMemoryResourceMeter(capacity) {
    // First check if we're actually on the monitor page
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const isMonitorRoute = currentPath.includes('/monitor') || currentHash.includes('monitor');

    if (!isMonitorRoute) {
      console.log('🧠 Not on monitor page, skipping memory meter creation');
      return;
    }

    const meterContainer = document.getElementById('memoryMeter');
    if (!meterContainer) {
      console.log('🧠 Memory meter container not found - this is expected if not on monitor page');
      return;
    }

    // Check if the monitor section is visible
    const monitorSection = document.getElementById('monitor');
    const isMonitorVisible = monitorSection && (monitorSection.classList.contains('active') ||
                                               monitorSection.style.display !== 'none' ||
                                               getComputedStyle(monitorSection).display !== 'none');

    if (!isMonitorVisible) {
      console.log('🧠 Monitor section not visible, skipping memory meter creation');
      return;
    }

    // Small delay to ensure DOM layout is complete
    setTimeout(() => {
      this._createMemoryMeterInstance(capacity, 0);
    }, 100);
  }

  _createMemoryMeterInstance(capacity, retryCount = 0) {
    const meterContainer = document.getElementById('memoryMeter');
    if (!meterContainer) {
      console.warn('Memory meter container not found during delayed creation');
      return;
    }

    // Check container dimensions
    const containerRect = meterContainer.getBoundingClientRect();
    console.log('🧠 Memory meter container dimensions:', {
      width: containerRect.width,
      height: containerRect.height,
      offsetWidth: meterContainer.offsetWidth,
      offsetHeight: meterContainer.offsetHeight,
      retryCount: retryCount
    });

    if (containerRect.width === 0 || containerRect.height === 0) {
      if (retryCount >= 5) {
        console.warn('🧠 Memory meter container still has zero dimensions after 5 retries, giving up');
        return;
      }
      console.warn(`Memory meter container has zero dimensions, retrying in 200ms (attempt ${retryCount + 1}/5)`);
      setTimeout(() => this._createMemoryMeterInstance(capacity, retryCount + 1), 200);
      return;
    }

    console.log('🧠 Creating memory ResourceMeter with capacity:', capacity);

    // Clean up any existing meter
    if (this.memoryMeter) {
      console.log('🧠 Cleaning up existing memory meter');
      this.memoryMeter.destroy();
    }

    try {
      const usedPercent = capacity.total ? ((capacity.allocated || 0) / capacity.total * 100) : 0;
      console.log('🧠 Memory usage percentage:', usedPercent);

      this.memoryMeter = new ResourceMeter(meterContainer, {
        type: 'linear',
        value: usedPercent,
        max: 100,
        unit: '%',
        label: 'Memory Usage',
        size: { width: meterContainer.offsetWidth || 400, height: 40 },
        thresholds: {
          low: 60,    // Green below 60%
          medium: 80  // Yellow 60-80%, Red above 80%
        },
        colors: {
          low: '#4CAF50',     // Green
          medium: '#FF9800',  // Orange
          high: '#F44336',    // Red
          background: '#2a2a2a',
          text: '#ffffff',
          track: '#404040'
        },
        animate: true,
        showValue: false,  // Don't show value text since we have it in the header
        showLabel: false,  // Don't show label since we have it in the header
        showTooltip: true,
        tooltipFormat: (value) => `Memory: ${capacity.allocated || 0} MB / ${capacity.total || 0} MB (${value.toFixed(1)}%)`
      });

      // Update with the current value to ensure it renders
      this.memoryMeter.update(usedPercent);

      console.log('✅ Memory ResourceMeter created successfully with value:', usedPercent);
    } catch (error) {
      console.error('❌ Failed to create memory ResourceMeter:', error);
      console.error('Error details:', error.stack);

      // Calculate usedPercent for fallback
      const usedPercent = capacity.total ? ((capacity.allocated || 0) / capacity.total * 100) : 0;

      // Fallback to simple progress bar
      meterContainer.innerHTML = `
        <div class="simple-progress-bar" style="
          width: 100%;
          height: 40px;
          background: #2a2a2a;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          border: 1px solid #444;
        ">
          <div class="progress-fill" style="
            width: ${usedPercent.toFixed(1)}%;
            height: 100%;
            background: ${usedPercent > 80 ? '#F44336' : usedPercent > 60 ? '#FF9800' : '#4CAF50'};
            transition: width 0.3s ease;
            position: relative;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: white;
              font-size: 12px;
              font-weight: bold;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            ">${usedPercent.toFixed(1)}%</div>
          </div>
        </div>
      `;
      console.log('🧠 Fallback progress bar created');
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

  /**
   * Clean up MonitorUI and destroy ProcessList component
   */
  destroy() {
    if (this.processList) {
      this.processList.destroy();
      this.processList = null;
    }

    // Destroy ResourceMeter components
    if (this.resourceMeters) {
      Object.values(this.resourceMeters).forEach(meter => {
        if (meter && typeof meter.destroy === 'function') {
          meter.destroy();
        }
      });
      this.resourceMeters = {
        cpu: null,
        memory: null,
        threads: null
      };
    }

    // Destroy memory allocation meter
    if (this.memoryMeter && typeof this.memoryMeter.destroy === 'function') {
      this.memoryMeter.destroy();
      this.memoryMeter = null;
    }

    // Clear elements cache
    this.elements = {};
    this.isInitialized = false;

    console.log('MonitorUI destroyed');
  }

  // Flash CSS is now in external CSS file - no need to inject
  addFlashCSS() {
    // Flash styles are now in public/css/enhanced.css
    // This method is kept for compatibility but does nothing
    console.log('Monitor flash CSS loaded from external file');
  }
}

export default MonitorUI;