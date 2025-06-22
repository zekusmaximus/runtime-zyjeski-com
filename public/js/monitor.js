// Enhanced Real-time Monitor Interface
class Monitor {
  constructor() {
    this.isActive = false;
    this.updateInterval = null;
    this.currentCharacter = null;
    this.charts = {};
    this.lastUpdateTime = null;
    this.dataHistory = {
      resources: [],
      processes: [],
      errors: []
    };
    this.maxHistoryPoints = 60; // 1 minute of data at 1 second intervals
    
    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.subscribeToStateChanges();
    this.setupSocketListeners();
  }

  setupElements() {
    this.refreshBtn = document.getElementById('refreshMonitor');
    this.pauseBtn = document.getElementById('pauseMonitor');
    this.resourceMeters = document.getElementById('resourceMeters');
    this.processTable = document.getElementById('processTable');
    this.memoryVisualization = document.getElementById('memoryVisualization');
    this.errorLog = document.getElementById('errorLog');
    
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => this.refreshData());
    }
    
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this.togglePause());
    }
  }

  setupEventListeners() {
    // Make process table interactive
    if (this.processTable) {
      this.processTable.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.pid) {
          this.showProcessContextMenu(e, parseInt(row.dataset.pid));
        }
      });
    }

    // Make memory blocks interactive
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
    if (!window.socketClient) return;

    // Listen for real-time consciousness updates
    window.socketClient.on('consciousness-update', (data) => {
      if (this.isActive && this.currentCharacter && data.characterId === this.currentCharacter.id) {
        this.updateDisplays(data);
        this.updateDataHistory(data);
      }
    });

    // Listen for intervention results
    window.socketClient.on('intervention-applied', (data) => {
      this.showInterventionFeedback(data);
    });

    // Listen for debug hooks
    window.socketClient.on('debug-hook-triggered', (data) => {
      this.showDebugAlert(data);
    });
  }

  subscribeToStateChanges() {
    window.stateManager.subscribe('currentCharacter', (character) => {
      this.currentCharacter = character;
      if (character && this.isActive) {
        this.loadCharacterData(character);
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

  startMonitoring() {
    this.isActive = true;
    
    if (this.currentCharacter) {
      this.loadCharacterData(this.currentCharacter);
      
      // Start real-time monitoring via WebSocket
      window.socketClient.startMonitoring(this.currentCharacter.id);
    }
    
    // Update button states
    if (this.pauseBtn) {
      this.pauseBtn.textContent = 'Pause';
      this.pauseBtn.classList.remove('paused');
    }
    
    this.showStatus('Monitoring started', 'success');
  }

  stopMonitoring() {
    this.isActive = false;
    
    if (this.currentCharacter) {
      window.socketClient.stopMonitoring(this.currentCharacter.id);
    }
    
    // Update button states
    if (this.pauseBtn) {
      this.pauseBtn.textContent = 'Resume';
      this.pauseBtn.classList.add('paused');
    }
    
    this.showStatus('Monitoring paused', 'warning');
  }

  togglePause() {
    if (this.isActive) {
      this.stopMonitoring();
    } else {
      this.startMonitoring();
    }
  }

  loadCharacterData(character) {
    if (!character.consciousness) return;
    
    // Clear data history for new character
    this.dataHistory = {
      resources: [],
      processes: [],
      errors: []
    };
    
    // Initial data load
    this.updateResourceMeters(character.consciousness.resources);
    this.updateProcessTable(character.consciousness.processes);
    this.updateMemoryVisualization(character.consciousness.memory);
    this.updateErrorLog(character.consciousness.system_errors);
    
    this.showStatus(`Loaded ${character.name}'s consciousness`, 'info');
  }

  async refreshData() {
    if (!this.currentCharacter) return;
    
    this.showStatus('Refreshing data...', 'info');
    
    try {
      const response = await fetch(`/api/consciousness/${this.currentCharacter.id}/state`);
      const state = await response.json();
      
      this.updateDisplays({ state: state, type: 'manual-refresh' });
      this.showStatus('Data refreshed', 'success');
    } catch (error) {
      console.error('Failed to refresh monitor data:', error);
      this.showStatus('Failed to refresh data', 'error');
    }
  }

  updateDisplays(data) {
    if (!data.state || !data.state.consciousness) return;
    
    const consciousness = data.state.consciousness;
    
    // Update all components
    if (consciousness.resources) {
      this.updateResourceMeters(consciousness.resources);
    }
    if (consciousness.processes) {
      this.updateProcessTable(consciousness.processes);
    }
    if (consciousness.memory) {
      this.updateMemoryVisualization(consciousness.memory);
    }
    if (consciousness.system_errors) {
      this.updateErrorLog(consciousness.system_errors);
    }
    
    // Update last update time
    this.lastUpdateTime = new Date();
    this.updateStatusTime();
    
    // Add visual feedback for updates
    this.flashUpdate();
  }

  updateDataHistory(data) {
    const timestamp = new Date();
    
    // Add resource history
    if (data.state.consciousness.resources) {
      this.dataHistory.resources.push({
        timestamp,
        data: { ...data.state.consciousness.resources }
      });
    }
    
    // Add process history
    if (data.state.consciousness.processes) {
      const totalCpu = data.state.consciousness.processes.reduce((sum, p) => sum + (p.cpu_usage || 0), 0);
      const totalMemory = data.state.consciousness.processes.reduce((sum, p) => sum + (p.memory_mb || 0), 0);
      
      this.dataHistory.processes.push({
        timestamp,
        totalCpu,
        totalMemory,
        processCount: data.state.consciousness.processes.length
      });
    }
    
    // Add error history
    if (data.state.consciousness.system_errors) {
      this.dataHistory.errors.push({
        timestamp,
        errorCount: data.state.consciousness.system_errors.length,
        criticalCount: data.state.consciousness.system_errors.filter(e => e.severity === 'critical').length
      });
    }
    
    // Trim history to max points
    Object.keys(this.dataHistory).forEach(key => {
      if (this.dataHistory[key].length > this.maxHistoryPoints) {
        this.dataHistory[key] = this.dataHistory[key].slice(-this.maxHistoryPoints);
      }
    });
  }

  updateResourceMeters(resources) {
    if (!this.resourceMeters || !resources) return;
    
    this.resourceMeters.innerHTML = '';
    
    Object.entries(resources).forEach(([resourceName, resource]) => {
      if (resource.current !== undefined && resource.max !== undefined) {
        const percentage = (resource.current / resource.max) * 100;
        const statusClass = this.getResourceStatusClass(percentage);
        const trend = this.calculateResourceTrend(resourceName);
        
        const meterHtml = `
          <div class="resource-meter" data-resource="${resourceName}">
            <div class="meter-label">
              <span class="meter-name">
                ${this.formatResourceName(resourceName)}
                ${trend ? `<span class="trend ${trend.direction}">${trend.icon}</span>` : ''}
              </span>
              <span class="meter-value">${resource.current.toFixed(1)}/${resource.max.toFixed(1)}</span>
            </div>
            <div class="meter-bar" onclick="window.monitor.showResourceDetails('${resourceName}')">
              <div class="meter-fill ${statusClass}" style="width: ${percentage}%">
                <div class="meter-animation"></div>
              </div>
            </div>
            <div class="meter-percentage">${percentage.toFixed(1)}%</div>
            ${resource.allocation ? this.createAllocationBreakdown(resource.allocation) : ''}
          </div>
        `;
        
        this.resourceMeters.insertAdjacentHTML('beforeend', meterHtml);
      }
    });
  }

  createAllocationBreakdown(allocation) {
    const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
    if (total === 0) return '';
    
    const breakdownHtml = Object.entries(allocation)
      .sort(([,a], [,b]) => b - a)
      .map(([name, value]) => {
        const percentage = (value / total) * 100;
        return `
          <div class="allocation-item">
            <span class="allocation-name">${name.replace(/_/g, ' ')}</span>
            <span class="allocation-value">${value.toFixed(1)}%</span>
            <div class="allocation-bar">
              <div class="allocation-fill" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('');
    
    return `<div class="allocation-breakdown">${breakdownHtml}</div>`;
  }

  updateProcessTable(processes) {
    if (!this.processTable || !processes) return;
    
    // Sort processes by CPU usage
    const sortedProcesses = [...processes].sort((a, b) => (b.cpu_usage || 0) - (a.cpu_usage || 0));
    
    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>PID</th>
            <th>Name</th>
            <th>Status</th>
            <th>CPU%</th>
            <th>Memory</th>
            <th>Last Activity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${sortedProcesses.map(process => {
            const trend = this.calculateProcessTrend(process.pid);
            return `
              <tr data-pid="${process.pid}" class="process-row ${process.status}">
                <td class="pid">${process.pid}</td>
                <td class="process-name">
                  ${process.name}
                  ${process.error_message ? '<span class="error-indicator">⚠</span>' : ''}
                </td>
                <td><span class="status ${process.status}">${process.status}</span></td>
                <td class="cpu-usage ${this.getCpuStatusClass(process.cpu_usage)}">
                  ${(process.cpu_usage || 0).toFixed(1)}%
                  ${trend ? `<span class="trend ${trend.direction}">${trend.icon}</span>` : ''}
                </td>
                <td class="memory-usage">${Math.round(process.memory_mb || 0)}MB</td>
                <td class="last-activity">${process.last_activity ? new Date(process.last_activity).toLocaleTimeString() : 'N/A'}</td>
                <td class="actions">
                  <button class="action-btn kill-btn" onclick="window.monitor.killProcess(${process.pid})" 
                          ${process.status === 'terminated' ? 'disabled' : ''}>Kill</button>
                  <button class="action-btn restart-btn" onclick="window.monitor.restartProcess(${process.pid})"
                          ${process.status === 'running' ? 'disabled' : ''}>Restart</button>
                  <button class="action-btn optimize-btn" onclick="window.monitor.optimizeProcess(${process.pid})">Optimize</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    
    this.processTable.innerHTML = tableHtml;
  }

  updateMemoryVisualization(memory) {
    if (!this.memoryVisualization || !memory) return;
    
    // Clear existing visualization
    this.memoryVisualization.innerHTML = '';
    
    // Calculate total memory usage
    const memoryEntries = Object.entries(memory);
    const totalSize = memoryEntries.reduce((sum, [_, block]) => sum + block.size, 0);
    
    if (totalSize === 0) {
      this.memoryVisualization.innerHTML = '<div class="no-memory">No memory allocated</div>';
      return;
    }
    
    // Create memory blocks with improved layout
    const memoryContainer = document.createElement('div');
    memoryContainer.className = 'memory-blocks-container';
    
    let currentOffset = 0;
    const maxBlocksPerRow = 8;
    
    memoryEntries
      .sort(([,a], [,b]) => b.size - a.size) // Sort by size, largest first
      .forEach(([address, block], index) => {
        const percentage = (block.size / totalSize) * 100;
        const minSize = 30;
        const maxSize = 120;
        const blockSize = Math.max(minSize, Math.min(maxSize, percentage * 3));
        
        const row = Math.floor(index / maxBlocksPerRow);
        const col = index % maxBlocksPerRow;
        
        const blockElement = document.createElement('div');
        blockElement.className = `memory-block ${block.type} ${block.protected ? 'protected' : ''} ${block.fragmented ? 'fragmented' : ''}`;
        blockElement.dataset.address = address;
        blockElement.style.cssText = `
          left: ${col * 15}%;
          top: ${row * 40}px;
          width: ${blockSize}px;
          height: ${blockSize}px;
          z-index: ${100 - index};
        `;
        
        // Add content to block
        const blockContent = document.createElement('div');
        blockContent.className = 'memory-block-content';
        blockContent.innerHTML = `
          <div class="memory-address">${address.slice(-4)}</div>
          <div class="memory-type">${block.type.charAt(0).toUpperCase()}</div>
          <div class="memory-size">${this.formatBytes(block.size)}</div>
        `;
        blockElement.appendChild(blockContent);
        
        // Add hover tooltip
        blockElement.title = `${address}\n${block.description}\nType: ${block.type}\nSize: ${this.formatBytes(block.size)}\nAccess Count: ${block.access_count}`;
        
        memoryContainer.appendChild(blockElement);
      });
    
    this.memoryVisualization.appendChild(memoryContainer);
    
    // Add memory statistics
    const statsElement = document.createElement('div');
    statsElement.className = 'memory-stats';
    
    const byType = {};
    memoryEntries.forEach(([_, block]) => {
      byType[block.type] = (byType[block.type] || 0) + block.size;
    });
    
    statsElement.innerHTML = `
      <div class="memory-total">Total: ${this.formatBytes(totalSize)}</div>
      <div class="memory-breakdown">
        ${Object.entries(byType).map(([type, size]) => `
          <div class="breakdown-item ${type}">
            <span class="type-name">${type}</span>
            <span class="type-size">${this.formatBytes(size)}</span>
            <span class="type-percentage">${((size / totalSize) * 100).toFixed(1)}%</span>
          </div>
        `).join('')}
      </div>
    `;
    
    this.memoryVisualization.appendChild(statsElement);
  }

  updateErrorLog(errors) {
    if (!this.errorLog || !errors) return;
    
    // Sort errors by timestamp (newest first)
    const sortedErrors = [...errors].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    this.errorLog.innerHTML = sortedErrors.slice(0, 15).map((error, index) => {
      const timeAgo = this.getTimeAgo(error.timestamp);
      const isNew = new Date() - new Date(error.timestamp) < 5000; // Less than 5 seconds old
      
      return `
        <div class="error-item ${error.severity} ${isNew ? 'new-error' : ''}" data-error-id="${index}">
          <div class="error-header">
            <span class="error-type">${error.type}</span>
            <span class="error-timestamp" title="${new Date(error.timestamp).toLocaleString()}">${timeAgo}</span>
          </div>
          <div class="error-message">${error.message}</div>
          ${error.related_process ? `<div class="error-process">Process: ${error.related_process}</div>` : ''}
          ${error.recovery_suggestion ? `
            <div class="error-suggestion">
              <strong>Suggestion:</strong> ${error.recovery_suggestion}
            </div>
          ` : ''}
          <div class="error-actions">
            <button class="error-action-btn" onclick="window.monitor.dismissError(${index})">Dismiss</button>
            ${error.related_process ? `<button class="error-action-btn" onclick="window.monitor.inspectProcess(${error.related_process})">Inspect Process</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    // Auto-scroll to newest errors
    if (this.errorLog.children.length > 0) {
      this.errorLog.scrollTop = 0;
    }
  }

  // Interactive methods
  async killProcess(pid) {
    if (!this.currentCharacter) return;
    
    const confirmed = confirm(`Are you sure you want to terminate process ${pid}?`);
    if (!confirmed) return;
    
    try {
      this.showStatus(`Terminating process ${pid}...`, 'warning');
      
      window.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
        type: 'kill_process',
        pid: pid
      });
      
    } catch (error) {
      console.error('Failed to kill process:', error);
      this.showStatus('Failed to terminate process', 'error');
    }
  }

  async restartProcess(pid) {
    if (!this.currentCharacter) return;
    
    try {
      this.showStatus(`Restarting process ${pid}...`, 'info');
      
      window.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
        type: 'restart_process',
        pid: pid
      });
      
    } catch (error) {
      console.error('Failed to restart process:', error);
      this.showStatus('Failed to restart process', 'error');
    }
  }

  async optimizeProcess(pid) {
    if (!this.currentCharacter) return;
    
    // Show optimization dialog
    const result = this.showOptimizationDialog(pid);
    if (!result) return;
    
    try {
      this.showStatus(`Optimizing process ${pid}...`, 'info');
      
      window.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
        type: 'optimize_process',
        pid: pid,
        parameters: result
      });
      
    } catch (error) {
      console.error('Failed to optimize process:', error);
      this.showStatus('Failed to optimize process', 'error');
    }
  }

  showOptimizationDialog(pid) {
    const memoryLimit = prompt('Enter memory limit (MB):', '500');
    const cpuLimit = prompt('Enter CPU limit (%):', '50');
    
    if (memoryLimit === null || cpuLimit === null) return null;
    
    return {
      memory_limit: parseInt(memoryLimit) || undefined,
      cpu_limit: parseInt(cpuLimit) || undefined
    };
  }

  showResourceDetails(resourceName) {
    if (!this.currentCharacter) return;
    
    const resource = this.currentCharacter.consciousness.resources[resourceName];
    if (!resource) return;
    
    const history = this.dataHistory.resources.slice(-20); // Last 20 data points
    
    alert(`${this.formatResourceName(resourceName)} Details:\n\nCurrent: ${resource.current.toFixed(1)}\nMaximum: ${resource.max.toFixed(1)}\nUtilization: ${((resource.current / resource.max) * 100).toFixed(1)}%\n\n${resource.allocation ? 'Allocation:\n' + Object.entries(resource.allocation).map(([k, v]) => `${k}: ${v.toFixed(1)}%`).join('\n') : ''}`);
  }

  showMemoryBlockDetails(address) {
    if (!this.currentCharacter) return;
    
    const block = this.currentCharacter.consciousness.memory[address];
    if (!block) return;
    
    alert(`Memory Block Details:\n\nAddress: ${address}\nType: ${block.type}\nSize: ${this.formatBytes(block.size)}\nDescription: ${block.description}\nAccess Count: ${block.access_count}\nLast Accessed: ${new Date(block.last_accessed).toLocaleString()}\nProtected: ${block.protected ? 'Yes' : 'No'}\nFragmented: ${block.fragmented ? 'Yes' : 'No'}`);
  }

  inspectProcess(pid) {
    // Navigate to debugger with this process focused
    if (window.app) {
      window.app.navigateToSection('debugger');
      // Could add specific process focusing here
    }
  }

  dismissError(errorIndex) {
    const errorElement = this.errorLog.querySelector(`[data-error-id="${errorIndex}"]`);
    if (errorElement) {
      errorElement.style.opacity = '0.5';
      errorElement.style.pointerEvents = 'none';
    }
  }

  // UI feedback methods
  showInterventionFeedback(data) {
    const message = `Intervention applied: ${data.intervention.type}`;
    this.showStatus(message, 'success');
    
    // Add visual feedback
    this.flashUpdate('intervention');
  }

  showDebugAlert(data) {
    const alertElement = document.createElement('div');
    alertElement.className = 'debug-alert';
    alertElement.innerHTML = `
      <div class="alert-content">
        <strong>Debug Hook Triggered:</strong> ${data.hook.name}
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.appendChild(alertElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alertElement.parentElement) {
        alertElement.remove();
      }
    }, 5000);
  }

  showStatus(message, type = 'info') {
    // Create or update status indicator
    let statusElement = document.querySelector('.monitor-status');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.className = 'monitor-status';
      const header = document.querySelector('.monitor-header');
      if (header) {
        header.appendChild(statusElement);
      }
    }
    
    statusElement.className = `monitor-status ${type}`;
    statusElement.textContent = message;
    
    // Auto-clear after 3 seconds
    setTimeout(() => {
      if (statusElement.textContent === message) {
        statusElement.textContent = '';
        statusElement.className = 'monitor-status';
      }
    }, 3000);
  }

  flashUpdate(type = 'general') {
    const element = document.querySelector('.monitor-container');
    if (element) {
      element.classList.add(`flash-${type}`);
      setTimeout(() => {
        element.classList.remove(`flash-${type}`);
      }, 200);
    }
  }

  updateStatusTime() {
    let timeElement = document.querySelector('.monitor-last-update');
    if (!timeElement) {
      timeElement = document.createElement('div');
      timeElement.className = 'monitor-last-update';
      const header = document.querySelector('.monitor-header');
      if (header) {
        header.appendChild(timeElement);
      }
    }
    
    if (this.lastUpdateTime) {
      timeElement.textContent = `Last update: ${this.lastUpdateTime.toLocaleTimeString()}`;
    }
  }

  // Utility methods
  formatResourceName(name) {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getResourceStatusClass(percentage) {
    if (percentage > 85) return 'critical';
    if (percentage > 70) return 'high';
    if (percentage > 40) return 'medium';
    return 'low';
  }

  getCpuStatusClass(usage) {
    if (usage > 80) return 'cpu-critical';
    if (usage > 60) return 'cpu-high';
    if (usage > 30) return 'cpu-medium';
    return 'cpu-low';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return past.toLocaleDateString();
  }

  calculateResourceTrend(resourceName) {
    const history = this.dataHistory.resources.slice(-5); // Last 5 data points
    if (history.length < 2) return null;
    
    const values = history.map(h => h.data[resourceName]?.current || 0);
    const trend = values[values.length - 1] - values[0];
    
    if (Math.abs(trend) < 0.1) return null;
    
    return {
      direction: trend > 0 ? 'up' : 'down',
      icon: trend > 0 ? '↗' : '↘'
    };
  }

  calculateProcessTrend(pid) {
    const history = this.dataHistory.processes.slice(-5);
    if (history.length < 2) return null;
    
    // This is simplified - in a real implementation, we'd track individual processes
    const avgCpu = history.reduce((sum, h) => sum + h.totalCpu, 0) / history.length;
    const currentCpu = history[history.length - 1].totalCpu;
    const trend = currentCpu - avgCpu;
    
    if (Math.abs(trend) < 5) return null;
    
    return {
      direction: trend > 0 ? 'up' : 'down',
      icon: trend > 0 ? '↗' : '↘'
    };
  }

  onConsciousnessUpdate(event, data) {
    if (event === 'consciousness-updated' && this.isActive) {
      this.updateDisplays({ state: { consciousness: data } });
    }
  }
}

// Create global monitor instance
window.monitor = new Monitor();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Monitor;
}