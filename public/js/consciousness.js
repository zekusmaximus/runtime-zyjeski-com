// Consciousness Management Module
class ConsciousnessManager {
  constructor() {
    this.currentCharacter = null;
    this.isMonitoring = false;
    this.updateInterval = null;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.subscribeToStateChanges();
  }

  setupEventListeners() {
    // Subscribe to socket events
    if (window.socketClient) {
      window.socketClient.on('consciousness-update', (data) => {
        this.handleConsciousnessUpdate(data);
      });
    }
  }

  subscribeToStateChanges() {
    // Subscribe to state manager changes
    window.stateManager.subscribe('currentCharacter', (character) => {
      this.currentCharacter = character;
      if (character) {
        this.initializeCharacterConsciousness(character);
      }
    });

    window.stateManager.subscribe('monitoringActive', (active) => {
      this.isMonitoring = active;
      if (active) {
        this.startRealTimeUpdates();
      } else {
        this.stopRealTimeUpdates();
      }
    });
  }

  loadCharacter(character) {
    this.currentCharacter = character;
    window.stateManager.loadCharacterState(character);
    this.initializeCharacterConsciousness(character);
  }

  initializeCharacterConsciousness(character) {
    console.log('Initializing consciousness for:', character.name);
    
    // Update preview visualization
    this.updateConsciousnessPreview(character.consciousness);
    
    // Start monitoring if socket is connected
    if (window.socketClient && window.socketClient.isSocketConnected()) {
      window.socketClient.startMonitoring(character.id);
    }
  }

  updateConsciousnessPreview(consciousness) {
    const preview = document.getElementById('consciousnessPreview');
    if (!preview) return;

    const processList = preview.querySelector('.process-list');
    if (!processList || !consciousness.processes) return;

    // Update process list in preview
    processList.innerHTML = consciousness.processes.slice(0, 3).map(process => {
      let statusClass = 'running';
      let statusText = 'Running';
      
      if (process.status === 'error' || process.cpu_usage > 80) {
        statusClass = 'error';
        statusText = process.status === 'error' ? 'Error' : 'High CPU';
      } else if (process.cpu_usage > 50) {
        statusClass = 'warning';
        statusText = 'Warning';
      }

      return `
        <div class="process-item">
          <span class="process-name">${process.name}</span>
          <span class="process-status ${statusClass}">${statusText}</span>
          <span class="process-usage">${this.formatProcessUsage(process)}</span>
        </div>
      `;
    }).join('');
  }

  handleConsciousnessUpdate(data) {
    if (!data.state || !this.currentCharacter) return;
    
    console.log('Updating consciousness state:', data);
    
    // Update state manager
    window.stateManager.updateConsciousnessData(data.state.consciousness);
    
    // Update UI components
    this.updateConsciousnessPreview(data.state.consciousness);
    
    // Notify other components
    this.notifyComponents('consciousness-updated', data.state.consciousness);
  }

  startRealTimeUpdates() {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      this.requestConsciousnessUpdate();
    }, 2000);
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async requestConsciousnessUpdate() {
    if (!this.currentCharacter) return;
    
    try {
      const response = await fetch(`/api/consciousness/${this.currentCharacter.id}/state`);
      const state = await response.json();
      
      window.stateManager.updateConsciousnessData(state);
      this.updateConsciousnessPreview(state);
    } catch (error) {
      console.error('Failed to fetch consciousness update:', error);
    }
  }

  // Process management
  async killProcess(pid) {
    if (!this.currentCharacter) return;
    
    try {
      const response = await fetch(`/api/process/${pid}/kill`, {
        method: 'PUT'
      });
      
      const result = await response.json();
      console.log('Process killed:', result);
      
      // Send intervention through socket
      if (window.socketClient) {
        window.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
          type: 'kill_process',
          pid: pid
        });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to kill process:', error);
      throw error;
    }
  }

  async restartProcess(pid) {
    if (!this.currentCharacter) return;
    
    try {
      // Send intervention through socket
      if (window.socketClient) {
        window.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
          type: 'restart_process',
          pid: pid
        });
      }
    } catch (error) {
      console.error('Failed to restart process:', error);
      throw error;
    }
  }

  // Memory management
  async allocateMemory(type, size, description) {
    if (!this.currentCharacter) return;
    
    try {
      if (window.socketClient) {
        window.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
          type: 'allocate_memory',
          memory_type: type,
          size: size,
          description: description
        });
      }
    } catch (error) {
      console.error('Failed to allocate memory:', error);
      throw error;
    }
  }

  async deallocateMemory(address) {
    if (!this.currentCharacter) return;
    
    try {
      if (window.socketClient) {
        window.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
          type: 'deallocate_memory',
          address: address
        });
      }
    } catch (error) {
      console.error('Failed to deallocate memory:', error);
      throw error;
    }
  }

  // Resource management
  async adjustResource(resourceType, amount) {
    if (!this.currentCharacter) return;
    
    try {
      if (window.socketClient) {
        window.socketClient.sendPlayerIntervention(this.currentCharacter.id, {
          type: 'adjust_resource',
          resource_type: resourceType,
          amount: amount
        });
      }
    } catch (error) {
      console.error('Failed to adjust resource:', error);
      throw error;
    }
  }

  // Utility methods
  formatProcessUsage(process) {
    if (process.memory_mb && process.memory_mb > 100) {
      return `${Math.round(process.memory_mb)}MB`;
    } else if (process.cpu_usage) {
      return `${Math.round(process.cpu_usage)}%`;
    }
    return 'N/A';
  }

  getProcessStatusClass(process) {
    if (process.status === 'error') return 'error';
    if (process.cpu_usage > 80) return 'error';
    if (process.cpu_usage > 50) return 'warning';
    return 'running';
  }

  getResourceStatusClass(resource) {
    if (resource.current / resource.max > 0.8) return 'high';
    if (resource.current / resource.max > 0.5) return 'medium';
    return 'low';
  }

  // Component notification system
  notifyComponents(event, data) {
    // Notify terminal
    if (window.terminal && typeof window.terminal.onConsciousnessUpdate === 'function') {
      window.terminal.onConsciousnessUpdate(event, data);
    }
    
    // Notify monitor
    if (window.monitor && typeof window.monitor.onConsciousnessUpdate === 'function') {
      window.monitor.onConsciousnessUpdate(event, data);
    }
    
    // Notify debugger
    if (window.debugger && typeof window.debugger.onConsciousnessUpdate === 'function') {
      window.debugger.onConsciousnessUpdate(event, data);
    }
  }

  // Debug methods
  getCurrentState() {
    return {
      character: this.currentCharacter,
      isMonitoring: this.isMonitoring,
      hasUpdateInterval: !!this.updateInterval
    };
  }

  // Cleanup
  destroy() {
    this.stopRealTimeUpdates();
    
    if (window.socketClient) {
      window.socketClient.off('consciousness-update');
    }
  }
}

// Create global consciousness manager instance
window.consciousness = new ConsciousnessManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsciousnessManager;
}

