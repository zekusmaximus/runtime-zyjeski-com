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
    console.log('[MONITOR UI] updateResources called with:', resources);
    if (!this.resourceMeters) {
      console.log('[MONITOR UI] No resourceMeters element found');
      return;
    }
    
    if (!resources || Object.keys(resources).length === 0) {
      console.log('[MONITOR UI] No resources data, showing empty state');
      this.resourceMeters.innerHTML = `
        <div class="empty-state">No resource data available</div>
        <div class="empty-state-hint">Character loaded but no resource metrics found</div>
      `;
      return;
    }
    
    // Handle the actual nested structure from the debug data
    const cpuUsage = resources.cpu?.percentage || resources.cpu?.used || resources.cpu_usage || Math.floor(Math.random() * 50 + 10);
    const memoryUsage = resources.memory?.percentage || resources.memory_usage || Math.floor(Math.random() * 80 + 20);
    const threadCount = resources.threads?.used || resources.threads?.active || (typeof resources.threads === 'number' ? resources.threads : 3);
    
    console.log('[MONITOR UI] Rendering resources:', { cpuUsage, memoryUsage, threadCount });
    
    // Create a more user-friendly display
    const html = `
      <div class="resource-grid">
        <div class="resource-item">
          <label>CPU Usage</label>
          <div class="meter">
            <div class="meter-bar" style="width: ${cpuUsage}%; background: ${cpuUsage > 80 ? '#e74c3c' : cpuUsage > 60 ? '#f39c12' : '#2ecc71'}"></div>
            <span>${cpuUsage}%</span>
          </div>
        </div>
        <div class="resource-item">
          <label>Memory Usage</label>
          <div class="meter">
            <div class="meter-bar" style="width: ${memoryUsage}%; background: ${memoryUsage > 80 ? '#e74c3c' : memoryUsage > 60 ? '#f39c12' : '#2ecc71'}"></div>
            <span>${Math.round(memoryUsage)}%</span>
          </div>
        </div>
        <div class="resource-item">
          <label>Thread Count</label>
          <span class="value">${threadCount}</span>
        </div>
      </div>
    `;
    this.resourceMeters.innerHTML = html;
    console.log('[MONITOR UI] Resources updated successfully');
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
    console.log('[MONITOR UI] updateMemory called with:', memory);
    
    if (!this.memoryVisualization) {
      console.log('[MONITOR UI] No memoryVisualization element found!');
      return;
    }
    
    if (!memory) {
      this.memoryVisualization.innerHTML = `
        <div class="memory-empty">
          <h3>No Memory Data</h3>
          <p>No consciousness connected or memory system not initialized.</p>
        </div>
      `;
      return;
    }
    
    // Create a comprehensive memory display
    let html = `
      <div class="memory-overview">
        <div class="memory-capacity">
          <h4>Capacity</h4>
          <div class="capacity-bar">
            <div class="capacity-used" style="width: ${(memory.capacity?.allocated / memory.capacity?.total * 100) || 0}%"></div>
          </div>
          <div class="capacity-details">
            <span>Used: ${memory.capacity?.allocated || 0} / ${memory.capacity?.total || 0}</span>
            <span>Available: ${memory.capacity?.available || 0}</span>
          </div>
        </div>
        
        <div class="memory-pools">
          <h4>Memory Pools</h4>
          <div class="pools-grid">
    `;
    
    // Display memory pools
    if (memory.pools) {
      Object.entries(memory.pools).forEach(([poolType, poolData]) => {
        const count = typeof poolData === 'number' ? poolData : poolData.count || 0;
        const maxSize = poolData.maxSize || 'unlimited';
        
        html += `
          <div class="pool-card">
            <div class="pool-header">
              <span class="pool-name">${poolType}</span>
              <span class="pool-count">${count}</span>
            </div>
            <div class="pool-details">
              <div class="pool-limit">Max: ${maxSize}</div>
              ${poolData.memories ? `
                <div class="pool-memories">
                  ${poolData.memories.slice(0, 2).map(mem => `
                    <div class="memory-preview" title="${mem.description}">
                      ${mem.description}
                    </div>
                  `).join('')}
                  ${poolData.memories.length > 2 ? `<div class="more-memories">+${poolData.memories.length - 2} more</div>` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `;
      });
    }
    
    html += `
          </div>
        </div>
    `;
    
    // Display loaded memory regions if available
    if (memory.loadedRegions && memory.loadedRegions.length > 0) {
      html += `
        <div class="memory-regions">
          <h4>Memory Regions</h4>
          <div class="regions-list">
            ${memory.loadedRegions.map(region => `
              <div class="region-card">
                <div class="region-header">
                  <span class="region-label">${region.label}</span>
                  <span class="region-type">${region.type}</span>
                </div>
                <div class="region-details">
                  <div class="region-size">${region.size} units</div>
                  <div class="region-address">${region.address}</div>
                  <div class="region-flags">
                    ${region.protected ? '<span class="flag protected">Protected</span>' : ''}
                    <span class="flag corruption">Risk: ${Math.round(region.corruptionRisk * 100)}%</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    html += `
        <div class="memory-stats">
          <div class="stat-item">
            <label>Total Memories:</label>
            <span>${memory.totalMemories || 0}</span>
          </div>
          <div class="stat-item">
            <label>Fragmentation:</label>
            <span>${Math.round((memory.fragmentationLevel || 0) * 100)}%</span>
          </div>
          <div class="stat-item">
            <label>Compression:</label>
            <span>${Math.round((memory.compressionRatio || 1) * 100)}%</span>
          </div>
          <div class="stat-item">
            <label>Emotional Indexes:</label>
            <span>${memory.emotionalIndexes || 0}</span>
          </div>
        </div>
      </div>
    `;
    
    this.memoryVisualization.innerHTML = html;
    console.log('[MONITOR UI] Memory visualization updated with detailed view');
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
    console.log('[MONITOR UI] ===== SET CONNECTION STATUS =====');
    console.log('[MONITOR UI] Setting connection status to:', connected);
    console.log('[MONITOR UI] connectionStatus element exists:', !!this.connectionStatus);
    
    if (!this.connectionStatus) {
      console.log('[MONITOR UI] No connectionStatus element found!');
      return;
    }
    
    if (connected) {
      this.connectionStatus.textContent = 'Consciousness Connected';
      this.connectionStatus.className = 'connection-status connected';
      console.log('[MONITOR UI] Set to connected state');
    } else {
      this.connectionStatus.textContent = 'No Consciousness Connected';
      this.connectionStatus.className = 'connection-status disconnected';
      console.log('[MONITOR UI] Set to disconnected state');
    }
    
    console.log('[MONITOR UI] Final status:', this.connectionStatus.textContent);
    console.log('[MONITOR UI] Final className:', this.connectionStatus.className);
    console.log('[MONITOR UI] ===== CONNECTION STATUS UPDATE COMPLETE =====');
  }

  updateTimestamp(ts) {
    if (this.lastUpdate) {
      const d = new Date(ts);
      this.lastUpdate.textContent = d.toLocaleTimeString();
    }
  }
}
