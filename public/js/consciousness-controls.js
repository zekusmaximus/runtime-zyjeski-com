// Consciousness Control Panel - User controls for consciousness updates
class ConsciousnessControls {
  constructor() {
    this.currentCharacter = null;
    this.autoUpdatesEnabled = false;
    this.lastUpdateTime = null;
    this.updateCount = 0;
    
    this.init();
  }

  init() {
    this.createControlPanel();
    this.bindEvents();
    this.updateDisplay();
  }

  createControlPanel() {
    // Check if control panel already exists
    if (document.getElementById('consciousness-controls')) {
      return;
    }

    const controlPanel = document.createElement('div');
    controlPanel.id = 'consciousness-controls';
    controlPanel.className = 'consciousness-controls-panel';
    
    controlPanel.innerHTML = `
      <div class="controls-header">
        <h3>Consciousness Controls</h3>
        <button id="controls-toggle" class="toggle-btn" title="Toggle controls panel">−</button>
      </div>
      
      <div class="controls-content" id="controls-content">
        <div class="control-group">
          <label class="control-label">Character Status</label>
          <div class="status-info">
            <span id="current-character">No character selected</span>
            <span id="update-count" class="update-counter">Updates: 0</span>
          </div>
        </div>

        <div class="control-group">
          <label class="control-label">Update Controls</label>
          <div class="button-group">
            <button id="manual-update-btn" class="control-btn primary" disabled>
              🔄 Manual Update
            </button>
            <button id="refresh-state-btn" class="control-btn secondary" disabled>
              ⟲ Refresh State
            </button>
          </div>
        </div>

        <div class="control-group">
          <label class="control-label">
            <input type="checkbox" id="auto-updates-toggle" disabled>
            Enable Auto-Updates (3s interval)
          </label>
          <div class="auto-update-info">
            <span id="auto-update-status">Disabled</span>
            <span id="last-update-time">Never</span>
          </div>
        </div>

        <div class="control-group debug-section">
          <label class="control-label">Debug Commands</label>
          <div class="button-group">
            <button id="debug-ps-btn" class="control-btn debug" disabled>ps</button>
            <button id="debug-top-btn" class="control-btn debug" disabled>top</button>
            <button id="debug-monitor-btn" class="control-btn debug" disabled>monitor</button>
          </div>
        </div>

        <div class="control-group intervention-section">
          <label class="control-label">Quick Interventions</label>
          <div class="button-group">
            <button id="optimize-grief-btn" class="control-btn intervention" disabled>
              Optimize Grief Manager
            </button>
            <button id="cleanup-memory-btn" class="control-btn intervention" disabled>
              Cleanup Memory
            </button>
          </div>
        </div>

        <div class="control-group status-section">
          <label class="control-label">Connection Status</label>
          <div class="status-indicators">
            <span id="socket-status" class="status-indicator">⚫ Disconnected</span>
            <span id="monitoring-status" class="status-indicator">⚫ Not monitoring</span>
          </div>
        </div>
      </div>
    `;

    // Add CSS styles
    this.addStyles();
    
    // Insert into page
    document.body.appendChild(controlPanel);
  }

  addStyles() {
    if (document.getElementById('consciousness-controls-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'consciousness-controls-styles';
    styles.textContent = `
      .consciousness-controls-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: #1e1e1e;
        border: 1px solid #3c3c3c;
        border-radius: 8px;
        color: #cccccc;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        max-height: 90vh;
        overflow-y: auto;
      }

      .controls-header {
        background: #2d2d30;
        padding: 12px 16px;
        border-bottom: 1px solid #3c3c3c;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 8px 8px 0 0;
      }

      .controls-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #ffffff;
      }

      .toggle-btn {
        background: none;
        border: none;
        color: #cccccc;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .toggle-btn:hover {
        background: #3c3c3c;
      }

      .controls-content {
        padding: 16px;
      }

      .controls-content.collapsed {
        display: none;
      }

      .control-group {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #2d2d30;
      }

      .control-group:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .control-label {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
        color: #ffffff;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .control-label input[type="checkbox"] {
        margin-right: 8px;
      }

      .status-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #252526;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: 'Consolas', 'Monaco', monospace;
      }

      .update-counter {
        color: #4fc3f7;
        font-weight: 600;
      }

      .button-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .control-btn {
        padding: 8px 12px;
        border: 1px solid #3c3c3c;
        border-radius: 4px;
        background: #37373d;
        color: #cccccc;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s;
        min-width: 80px;
      }

      .control-btn:hover:not(:disabled) {
        background: #464647;
        border-color: #007acc;
      }

      .control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .control-btn.primary {
        background: #0e639c;
        border-color: #007acc;
        color: #ffffff;
      }

      .control-btn.primary:hover:not(:disabled) {
        background: #1177bb;
      }

      .control-btn.secondary {
        background: #5a5a5a;
        border-color: #6a6a6a;
      }

      .control-btn.debug {
        background: #4a4a4a;
        border-color: #6a6a6a;
        font-family: 'Consolas', 'Monaco', monospace;
        min-width: 60px;
      }

      .control-btn.intervention {
        background: #2d4a2d;
        border-color: #4a7c59;
        color: #a8e6a3;
      }

      .control-btn.intervention:hover:not(:disabled) {
        background: #3d5a3d;
      }

      .auto-update-info {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #999999;
        margin-top: 4px;
      }

      .status-indicators {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .status-indicator {
        font-size: 11px;
        font-family: 'Consolas', 'Monaco', monospace;
      }

      .status-indicator.connected {
        color: #4caf50;
      }

      .status-indicator.monitoring {
        color: #2196f3;
      }

      .debug-section .control-label {
        color: #ffc107;
      }

      .intervention-section .control-label {
        color: #4caf50;
      }

      .status-section .control-label {
        color: #ff9800;
      }
    `;

    document.head.appendChild(styles);
  }

  bindEvents() {
    // Toggle panel
    document.getElementById('controls-toggle').addEventListener('click', () => {
      this.togglePanel();
    });

    // Manual update
    document.getElementById('manual-update-btn').addEventListener('click', () => {
      this.triggerManualUpdate();
    });

    // Refresh state
    document.getElementById('refresh-state-btn').addEventListener('click', () => {
      this.refreshState();
    });

    // Auto-updates toggle
    document.getElementById('auto-updates-toggle').addEventListener('change', (e) => {
      this.toggleAutoUpdates(e.target.checked);
    });

    // Debug commands
    document.getElementById('debug-ps-btn').addEventListener('click', () => {
      this.executeDebugCommand('ps');
    });

    document.getElementById('debug-top-btn').addEventListener('click', () => {
      this.executeDebugCommand('top');
    });

    document.getElementById('debug-monitor-btn').addEventListener('click', () => {
      this.executeDebugCommand('monitor');
    });

    // Interventions
    document.getElementById('optimize-grief-btn').addEventListener('click', () => {
      this.applyIntervention({
        type: 'process_optimization',
        target: 'Grief_Manager.exe',
        parameters: { memory_limit: 500, cpu_limit: 50 }
      });
    });

    document.getElementById('cleanup-memory-btn').addEventListener('click', () => {
      this.applyIntervention({
        type: 'memory_cleanup',
        parameters: { threshold: 0.8 }
      });
    });

    // Listen for socket events
    if (window.socketClient) {
      window.socketClient.addHandler('connected', () => this.updateConnectionStatus());
      window.socketClient.addHandler('disconnected', () => this.updateConnectionStatus());
      window.socketClient.addHandler('monitoring-started', (data) => this.onMonitoringStarted(data));
      window.socketClient.addHandler('monitoring-stopped', (data) => this.onMonitoringStopped(data));
      window.socketClient.addHandler('consciousness-update', () => this.onConsciousnessUpdate());
      window.socketClient.addHandler('auto-updates-toggled', (data) => this.onAutoUpdatesToggled(data));
    }

    // Listen for state manager events
    if (window.stateManager) {
      window.stateManager.subscribe('currentCharacter', (character) => {
        this.onCharacterChanged(character);
      });
    }
  }

  togglePanel() {
    const content = document.getElementById('controls-content');
    const toggle = document.getElementById('controls-toggle');
    
    if (content.classList.contains('collapsed')) {
      content.classList.remove('collapsed');
      toggle.textContent = '−';
    } else {
      content.classList.add('collapsed');
      toggle.textContent = '+';
    }
  }

  triggerManualUpdate() {
    if (!this.currentCharacter || !window.socketClient) return;
    
    window.socketClient.requestUpdate(this.currentCharacter.id, 'manual-trigger');
    
    // Provide user feedback
    const btn = document.getElementById('manual-update-btn');
    const originalText = btn.textContent;
    btn.textContent = '⟳ Updating...';
    btn.disabled = true;
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 1000);
  }

  refreshState() {
    if (!this.currentCharacter || !window.socketClient) return;
    
    window.socketClient.requestUpdate(this.currentCharacter.id, 'state-refresh');
    
    // Provide user feedback
    const btn = document.getElementById('refresh-state-btn');
    const originalText = btn.textContent;
    btn.textContent = '⟳ Refreshing...';
    btn.disabled = true;
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 1000);
  }

  toggleAutoUpdates(enabled) {
    if (!this.currentCharacter || !window.socketClient) return;
    
    window.socketClient.toggleAutoUpdates(this.currentCharacter.id, enabled);
  }

  executeDebugCommand(command) {
    if (!this.currentCharacter || !window.socketClient) return;
    
    window.socketClient.executeDebugCommand(this.currentCharacter.id, command);
  }

  applyIntervention(intervention) {
    if (!this.currentCharacter || !window.socketClient) return;
    
    window.socketClient.applyPlayerIntervention(this.currentCharacter.id, intervention);
  }

  // Event handlers
  onCharacterChanged(character) {
    this.currentCharacter = character;
    this.updateDisplay();
  }

  onMonitoringStarted(data) {
    this.updateDisplay();
  }

  onMonitoringStopped(data) {
    this.updateDisplay();
  }

  onConsciousnessUpdate() {
    this.updateCount++;
    this.lastUpdateTime = new Date();
    this.updateDisplay();
  }

  onAutoUpdatesToggled(data) {
    this.autoUpdatesEnabled = data.enabled;
    document.getElementById('auto-updates-toggle').checked = data.enabled;
    this.updateDisplay();
  }

  updateConnectionStatus() {
    const socketStatus = document.getElementById('socket-status');
    const monitoringStatus = document.getElementById('monitoring-status');
    
    if (window.socketClient?.isSocketConnected()) {
      socketStatus.textContent = '🟢 Connected';
      socketStatus.className = 'status-indicator connected';
    } else {
      socketStatus.textContent = '🔴 Disconnected';
      socketStatus.className = 'status-indicator';
    }
    
    const monitoringInfo = window.socketClient?.getMonitoringStatus();
    if (monitoringInfo?.monitoring.length > 0) {
      monitoringStatus.textContent = `🟦 Monitoring ${monitoringInfo.monitoring[0]}`;
      monitoringStatus.className = 'status-indicator monitoring';
    } else {
      monitoringStatus.textContent = '⚫ Not monitoring';
      monitoringStatus.className = 'status-indicator';
    }
  }

  updateDisplay() {
    // Update character info
    const characterSpan = document.getElementById('current-character');
    const updateCountSpan = document.getElementById('update-count');
    const autoUpdateStatus = document.getElementById('auto-update-status');
    const lastUpdateTime = document.getElementById('last-update-time');
    
    if (this.currentCharacter) {
      characterSpan.textContent = this.currentCharacter.name || this.currentCharacter.id;
    } else {
      characterSpan.textContent = 'No character selected';
    }
    
    updateCountSpan.textContent = `Updates: ${this.updateCount}`;
    
    // Update auto-update status
    if (this.autoUpdatesEnabled) {
      autoUpdateStatus.textContent = 'Enabled (3s)';
      autoUpdateStatus.style.color = '#4caf50';
    } else {
      autoUpdateStatus.textContent = 'Disabled';
      autoUpdateStatus.style.color = '#999999';
    }
    
    // Update last update time
    if (this.lastUpdateTime) {
      lastUpdateTime.textContent = this.lastUpdateTime.toLocaleTimeString();
    } else {
      lastUpdateTime.textContent = 'Never';
    }
    
    // Enable/disable controls based on connection and character
    const hasCharacter = !!this.currentCharacter;
    const isConnected = window.socketClient?.isSocketConnected();
    const controlsEnabled = hasCharacter && isConnected;
    
    document.getElementById('manual-update-btn').disabled = !controlsEnabled;
    document.getElementById('refresh-state-btn').disabled = !controlsEnabled;
    document.getElementById('auto-updates-toggle').disabled = !controlsEnabled;
    document.getElementById('debug-ps-btn').disabled = !controlsEnabled;
    document.getElementById('debug-top-btn').disabled = !controlsEnabled;
    document.getElementById('debug-monitor-btn').disabled = !controlsEnabled;
    document.getElementById('optimize-grief-btn').disabled = !controlsEnabled;
    document.getElementById('cleanup-memory-btn').disabled = !controlsEnabled;
    
    // Update connection status
    this.updateConnectionStatus();
  }
}

// Initialize consciousness controls when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.consciousnessControls = new ConsciousnessControls();
  });
} else {
  window.consciousnessControls = new ConsciousnessControls();
}