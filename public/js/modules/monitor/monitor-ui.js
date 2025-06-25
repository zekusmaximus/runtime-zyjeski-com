export default class MonitorUI {
  constructor() {
    this.refreshBtn = document.getElementById('refreshMonitor');
    this.toggleBtn = document.getElementById('toggleMonitoring');
    this.connectionStatus = document.getElementById('connectionStatus');
    this.resourceMeters = document.getElementById('resourceMeters');
    this.processTable = document.getElementById('processTable');
    this.memoryVisualization = document.getElementById('memoryVisualization');
    this.errorLog = document.getElementById('errorLog');
    this.lastUpdate = document.querySelector('.last-update-time');
  }

  updateResources(resources) {
    if (!this.resourceMeters) return;
    
    // Always show something, even if resources is empty
    const debugData = resources ? JSON.stringify(resources, null, 2) : 'null/undefined';
    
    if (!resources || Object.keys(resources).length === 0) {
      this.resourceMeters.innerHTML = `
        <div class="empty-state">No consciousness connected</div>
        <div class="empty-state-hint">Select a character profile to begin monitoring</div>
      `;
      return;
    }
    
    // Handle the actual nested structure from the debug data
    const cpuUsage = resources.cpu?.percentage || resources.cpu?.used || resources.cpu_usage || 0;
    const memoryUsage = resources.memory?.percentage || resources.memory_usage || 0;
    const threadCount = resources.threads?.used || resources.threads?.active || (typeof resources.threads === 'number' ? resources.threads : 0);
    
    // Create a more user-friendly display
    const html = `
      <div class="resource-grid">
        <div class="resource-item">
          <label>CPU Usage</label>
          <div class="meter">
            <div class="meter-bar" style="width: ${cpuUsage}%"></div>
            <span>${cpuUsage}%</span>
          </div>
        </div>
        <div class="resource-item">
          <label>Memory Usage</label>
          <div class="meter">
            <div class="meter-bar" style="width: ${memoryUsage}%"></div>
            <span>${Math.round(memoryUsage)}%</span>
          </div>
        </div>
        <div class="resource-item">
          <label>Thread Count</label>
          <span class="value">${threadCount}</span>
        </div>
        <div class="debug-info" style="margin-top: 1rem; font-size: 0.8rem; color: #666; white-space: pre-wrap;">
          Debug - Raw data: ${debugData}
        </div>
      </div>
    `;
    this.resourceMeters.innerHTML = html;
  }

  updateProcesses(processes) {
    if (!this.processTable) return;
    
    if (!processes || !Array.isArray(processes) || processes.length === 0) {
      this.processTable.innerHTML = `
        <div class="empty-state">No consciousness connected</div>
        <div class="empty-state-hint">Select a character profile to view active processes</div>
      `;
      return;
    }
    
    // Create a table for processes
    const html = `
      <table class="process-list">
        <thead>
          <tr><th>PID</th><th>Name</th><th>Status</th><th>CPU</th><th>Memory</th></tr>
        </thead>
        <tbody>
          ${processes.map(p => `
            <tr>
              <td>${p.pid || 'N/A'}</td>
              <td>${p.name || 'Unknown'}</td>
              <td><span class="status ${p.status || 'unknown'}">${p.status || 'unknown'}</span></td>
              <td>${p.cpu_usage || p.cpu || '0'}%</td>
              <td>${Math.round(p.memory_mb || p.memory_usage || p.memory || 0)}MB</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    this.processTable.innerHTML = html;
  }

  updateMemory(memory) {
    console.log('Monitor UI: updateMemory called with:', memory);
    console.log('Monitor UI: memoryVisualization element exists:', !!this.memoryVisualization);
    
    if (!this.memoryVisualization) {
      console.log('Monitor UI: No memoryVisualization element found!');
      return;
    }
    
    console.log('Monitor UI: About to update innerHTML');
    
    if (!memory) {
      this.memoryVisualization.innerHTML = `
        <div class="empty-state">No consciousness connected</div>
        <div class="empty-state-hint">Select a character profile to view memory allocation</div>
      `;
      console.log('Monitor UI: Set empty state HTML');
      return;
    }
    
    // Handle the actual memory structure with capacity, pools, etc.
    const capacity = memory.capacity || {};
    const pools = memory.pools || {};
    const fragmentationLevel = memory.fragmentationLevel || 0;
    const compressionRatio = memory.compressionRatio || 1;
    const totalMemories = memory.totalMemories || 0;
    
    // Extract meaningful data from the structure
    const maxCapacity = capacity.max || capacity.total || 10000;
    const usedCapacity = capacity.used || (maxCapacity - (capacity.available || 0));
    const availableCapacity = capacity.available || (maxCapacity - usedCapacity);
    const usagePercentage = maxCapacity > 0 ? Math.round((usedCapacity / maxCapacity) * 100) : 0;
    
    // Get pool information
    const poolTypes = Object.keys(pools);
    const poolInfo = poolTypes.map(type => {
      const pool = pools[type] || {};
      return {
        type: type,
        size: pool.size || pool.capacity || 0,
        used: pool.used || 0,
        count: pool.count || 0
      };
    });
    
    const html = `
      <div class="memory-stats">
        <div class="memory-overview">
          <div class="memory-meter">
            <label>Memory Usage</label>
            <div class="meter">
              <div class="meter-bar" style="width: ${usagePercentage}%; background: ${usagePercentage > 80 ? '#e74c3c' : usagePercentage > 60 ? '#f39c12' : '#2ecc71'}"></div>
              <span>${usagePercentage}%</span>
            </div>
            <div class="meter-details">
              <span>Used: ${Math.round(usedCapacity)} / ${Math.round(maxCapacity)} units</span>
            </div>
          </div>
          
          <div class="memory-metrics">
            <div class="metric-item">
              <label>Total Memories</label>
              <span>${totalMemories}</span>
            </div>
            <div class="metric-item">
              <label>Fragmentation</label>
              <span>${Math.round(fragmentationLevel * 100)}%</span>
            </div>
            <div class="metric-item">
              <label>Compression</label>
              <span>${compressionRatio.toFixed(2)}x</span>
            </div>
          </div>
        </div>
        
        ${poolInfo.length > 0 ? `
          <div class="memory-pools">
            <h4>Memory Pools</h4>
            <div class="pool-grid">
              ${poolInfo.map(pool => `
                <div class="pool-item">
                  <div class="pool-type">${pool.type}</div>
                  <div class="pool-stats">
                    <span class="pool-size">${Math.round(pool.size)} units</span>
                    <span class="pool-count">${pool.count} items</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    this.memoryVisualization.innerHTML = html;
    console.log('Monitor UI: Memory visualization updated successfully');
  }

  updateErrors(errors) {
    if (!this.errorLog) return;
    
    if (!errors || !Array.isArray(errors) || errors.length === 0) {
      this.errorLog.innerHTML = '<div class="empty-state">No errors detected.</div>';
      return;
    }
    
    const html = errors.map(error => `
      <div class="error-entry">
        <span class="error-time">${new Date(error.timestamp || Date.now()).toLocaleTimeString()}</span>
        <span class="error-message">${error.message || error}</span>
      </div>
    `).join('');
    
    this.errorLog.innerHTML = html;
  }

  setConnectionStatus(connected) {
    if (!this.connectionStatus) return;
    this.connectionStatus.textContent = connected ? 'Connected' : 'Disconnected';
  }

  updateTimestamp(ts) {
    if (this.lastUpdate) {
      const d = new Date(ts);
      this.lastUpdate.textContent = d.toLocaleTimeString();
    }
  }
}
