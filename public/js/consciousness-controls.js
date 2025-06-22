// Enhanced Consciousness Control Panel - Fixed responsive design and minimized start state
class ConsciousnessControls {
  constructor() {
    this.currentCharacter = null;
    this.autoUpdatesEnabled = false;
    this.lastUpdateTime = null;
    this.updateCount = 0;
    this.isMinimized = true; // Start minimized
    
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
    controlPanel.className = 'consciousness-controls-panel minimized';
    
    controlPanel.innerHTML = `
      <div class="controls-header">
        <h3>Consciousness Controls</h3>
        <button id="controls-toggle" class="toggle-btn" title="Toggle controls panel">+</button>
      </div>
      
      <div class="controls-content" id="controls-content">
        <div class="control-group">
          <div class="control-label">Character Status</div>
          <div class="status-info">
            <span id="current-character">No character selected</span>
            <span id="update-count" class="update-counter">Updates: 0</span>
          </div>
        </div>

        <div class="control-group">
          <div class="control-label">Update Controls</div>
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
          <label class="control-label" for="auto-updates-toggle">
            <input type="checkbox" id="auto-updates-toggle" disabled>
            Enable Auto-Updates (3s interval)
          </label>
          <div class="auto-update-info">
            <span id="auto-update-status">Disabled</span>
            <span id="last-update-time">Never</span>
          </div>
        </div>

        <div class="control-group debug-section">
          <div class="control-label">Debug Commands</div>
          <div class="button-group">
            <button id="debug-ps-btn" class="control-btn debug" disabled>ps</button>
            <button id="debug-top-btn" class="control-btn debug" disabled>top</button>
            <button id="debug-monitor-btn" class="control-btn debug" disabled>monitor</button>
          </div>
        </div>

        <div class="control-group intervention-section">
          <div class="control-label">Quick Interventions</div>
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
          <div class="control-label">Connection Status</div>
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
        width: 280px;
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
        transition: all 0.3s ease;
      }

      /* Minimized state */
      .consciousness-controls-panel.minimized {
        width: 180px;
      }

      .consciousness-controls-panel.minimized .controls-content {
        display: none;
      }

      .controls-header {
        background: #2d2d30;
        padding: 8px 12px;
        border-bottom: 1px solid #3c3c3c;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 8px 8px 0 0;
        cursor: pointer;
      }

      .controls-header h3 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: #ffffff;
      }

      .toggle-btn {
        background: none;
        border: none;
        color: #cccccc;
        font-size: 14px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: all 0.2s;
        min-width: 20px;
        text-align: center;
      }

      .toggle-btn:hover {
        background: #3c3c3c;
        color: #ffffff;
      }

      .controls-content {
        padding: 12px;
        transition: all 0.3s ease;
      }

      .control-group {
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #2d2d30;
      }

      .control-group:last-child {
        border-bottom: none;
        margin-bottom: 0;
      }

      .control-label {
        display: block;
        font-weight: 600;
        margin-bottom: 6px;
        color: #ffffff;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .control-label input[type="checkbox"] {
        margin-right: 6px;
      }

      .status-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #252526;
        padding: 6px 8px;
        border-radius: 4px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 10px;
      }

      .update-counter {
        color: #4fc3f7;
        font-weight: 600;
      }

      .button-group {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .control-btn {
        padding: 6px 8px;
        border: 1px solid #3c3c3c;
        border-radius: 4px;
        background: #37373d;
        color: #cccccc;
        cursor: pointer;
        font-size: 10px;
        font-weight: 500;
        transition: all 0.2s;
        min-width: 60px;
        text-align: center;
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
        min-width: 40px;
      }

      .control-btn.intervention {
        background: #2d4a2d;
        border-color: #4a7c59;
        color: #a8e6a3;
        font-size: 9px;
      }

      .control-btn.intervention:hover:not(:disabled) {
        background: #3d5a3d;
      }

      .auto-update-info {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        color: #999999;
        margin-top: 4px;
      }

      .status-indicators {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .status-indicator {
        font-size: 10px;
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

      /* Mobile responsive design */
      @media (max-width: 768px) {
        .consciousness-controls-panel {
          top: 10px;
          right: 10px;
          width: 160px;
          font-size: 11px;
        }
        
        .consciousness-controls-panel.minimized {
          width: 140px;
        }
        
        .controls-header {
          padding: 6px 8px;
        }
        
        .controls-header h3 {
          font-size: 11px;
        }
        
        .controls-content {
          padding: 8px;
        }
        
        .control-btn {
          padding: 4px 6px;
          font-size: 9px;
          min-width: 45px;
        }
        
        .control-btn.intervention {
          font-size: 8px;
        }
        
        .button-group {
          gap: 4px;
        }
        
        .status-info {
          padding: 4px 6px;
          font-size: 9px;
        }
      }

      /* Extra small screens */
      @media (max-width: 480px) {
        .consciousness-controls-panel {
          width: 140px;
          top: 60px; /* Move below typical mobile nav */
        }
        
        .consciousness-controls-panel.minimized {
          width: 120px;
        }
        
        .controls-header h3 {
          font-size: 10px;
        }
        
        .control-btn {
          min-width: 35px;
          font-size: 8px;
          padding: 3px 4px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  togglePanel() {
    const panel = document.getElementById('consciousness-controls');
    const toggleBtn = document.getElementById('controls-toggle');
    
    this.isMinimized = !this.isMinimized;
    
    if (this.isMinimized) {
      panel.classList.add('minimized');
      toggleBtn.textContent = '+';
      toggleBtn.title = 'Expand controls panel';
    } else {
      panel.classList.remove('minimized');
      toggleBtn.textContent = '−';
      toggleBtn.title = 'Minimize controls panel';
    }
  }

  bindEvents() {
    // Toggle panel - click header or button
    const header = document.querySelector('.controls-header');
    header.addEventListener('click', () => {
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
      this.executeIntervention('optimize_grief');
    });

    document.getElementById('cleanup-memory-btn').addEventListener('click', () => {
      this.executeIntervention('cleanup_memory');
    });
  }

  triggerManualUpdate() {
    if (!this.currentCharacter) return;
    
    try {
      if (window.socketClient) {
        window.socketClient.requestConsciousnessUpdate(this.currentCharacter.id);
        this.updateCount++;
        this.lastUpdateTime = new Date();
        this.updateDisplay();
      }
    } catch (error) {
      console.error('Failed to trigger manual update:', error);
    }
  }

  refreshState() {
    if (!this.currentCharacter) return;
    
    try {
      if (window.socketClient) {
        window.socketClient.requestFullStateRefresh(this.currentCharacter.id);
        this.updateDisplay();
      }
    } catch (error) {
      console.error('Failed to refresh state:', error);
    }
  }

  toggleAutoUpdates(enabled) {
    this.autoUpdatesEnabled = enabled;
    
    if (enabled && this.currentCharacter) {
      this.startAutoUpdates();
    } else {
      this.stopAutoUpdates();
    }
    
    this.updateDisplay();
  }

  executeDebugCommand(command) {
    if (!this.currentCharacter) return;
    
    try {
      if (window.terminal) {
        window.terminal.executeCommand(command);
      }
    } catch (error) {
      console.error('Failed to execute debug command:', error);
    }
  }

  executeIntervention(type) {
    if (!this.currentCharacter) return;
    
    try {
      if (window.socketClient) {
        window.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
          type: type,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to execute intervention:', error);
    }
  }

  startAutoUpdates() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
    }
    
    this.autoUpdateInterval = setInterval(() => {
      this.triggerManualUpdate();
    }, 3000);
  }

  stopAutoUpdates() {
    if (this.autoUpdateInterval) {
      clearInterval(this.autoUpdateInterval);
      this.autoUpdateInterval = null;
    }
  }

  setCurrentCharacter(character) {
    this.currentCharacter = character;
    this.updateDisplay();
  }

  updateConnectionStatus() {
    const socketStatus = document.getElementById('socket-status');
    const monitoringStatus = document.getElementById('monitoring-status');
    
    if (socketStatus && window.socketClient) {
      const isConnected = window.socketClient.isSocketConnected();
      socketStatus.textContent = isConnected ? '🟢 Connected' : '⚫ Disconnected';
      socketStatus.classList.toggle('connected', isConnected);
    }
    
    if (monitoringStatus && window.monitor) {
      const isMonitoring = window.monitor.isMonitoring;
      monitoringStatus.textContent = isMonitoring ? '🔵 Monitoring' : '⚫ Not monitoring';
      monitoringStatus.classList.toggle('monitoring', isMonitoring);
    }
  }

  updateDisplay() {
    // Update character name
    const characterElement = document.getElementById('current-character');
    if (characterElement) {
      characterElement.textContent = this.currentCharacter ? 
        this.currentCharacter.name || this.currentCharacter.id : 
        'No character selected';
    }
    
    // Update count
    const countElement = document.getElementById('update-count');
    if (countElement) {
      countElement.textContent = `Updates: ${this.updateCount}`;
    }
    
    // Update auto-update status
    const statusElement = document.getElementById('auto-update-status');
    const timeElement = document.getElementById('last-update-time');
    
    if (statusElement) {
      statusElement.textContent = this.autoUpdatesEnabled ? 'Enabled' : 'Disabled';
    }
    
    if (timeElement && this.lastUpdateTime) {
      timeElement.textContent = this.lastUpdateTime.toLocaleTimeString();
    }
    
    // Update button states
    const hasCharacter = !this.currentCharacter;
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