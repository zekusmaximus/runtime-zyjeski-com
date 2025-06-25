// Fixed Consciousness Management Module - Prevent double initialization
class ConsciousnessManager {
  constructor() {
    this.currentCharacter = null;
    this.isMonitoring = false;
    this.updateInterval = null;
    this.isInitializing = false; // ADDED: Prevent concurrent initialization
    // Store the handler reference for proper removal
    this._consciousnessUpdateHandler = (data) => {
      try {
        this.handleConsciousnessUpdate(data);
      } catch (error) {
        console.error('Error in consciousness update handler:', error);
      }
    };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.subscribeToStateChanges();
  }

  setupEventListeners() {
    // Subscribe to socket events with error handling
    if (window.socketClient) {
      window.socketClient.on('consciousness-update', this._consciousnessUpdateHandler);
    }
  }

  subscribeToStateChanges() {
    // Subscribe to state manager changes
    if (window.stateManager) {
      window.stateManager.subscribe('currentCharacter', (character) => {
        // Only set current character, don't initialize or start monitoring here
        this.currentCharacter = character;
      });

      // Remove auto-start logic from monitoringActive subscription
      window.stateManager.subscribe('monitoringActive', (active) => {
        this.isMonitoring = active;
        // Do NOT auto-start or stop real-time updates here
        // Monitoring should only be started/stopped by explicit user action
      });
    }
  }

  // User-initiated monitoring start
  userStartMonitoring() {
    if (!this.currentCharacter) {
      console.warn('No character selected for monitoring');
      return;
    }
    if (this.isMonitoring) {
      console.log('Monitoring already active');
      return;
    }
    this.isMonitoring = true;
    if (window.stateManager) {
      window.stateManager.set('monitoringActive', true);
    }
    this.startRealTimeUpdates();
    if (window.socketClient && window.socketClient.isSocketConnected()) {
      window.socketClient.startMonitoring(this.currentCharacter.id);
    }
  }

  // User-initiated monitoring stop
  userStopMonitoring() {
    if (!this.isMonitoring) {
      console.log('Monitoring already inactive');
      return;
    }
    this.isMonitoring = false;
    if (window.stateManager) {
      window.stateManager.set('monitoringActive', false);
    }
    this.stopRealTimeUpdates();
    if (window.socketClient && window.socketClient.isSocketConnected()) {
      window.socketClient.stopMonitoring(this.currentCharacter.id);
    }
  }

  // FIXED: Main entry point that prevents double initialization
  loadCharacter(character) {
    if (!character) {
      console.error('Cannot load character: character is null or undefined');
      return;
    }

    // Prevent concurrent initialization
    if (this.isInitializing) {
      console.log('Character initialization already in progress, skipping duplicate');
      return;
    }

    // If same character is already loaded, don't reload
    if (this.currentCharacter && this.currentCharacter.id === character.id) {
      console.log(`Character ${character.id} already loaded and initialized`);
      return;
    }

    try {
      this.isInitializing = true;
      
      // Set current character
      this.currentCharacter = character;
      
      // Load character state in state manager
      if (window.stateManager) {
        window.stateManager.loadCharacterState(character);
      }
      
      // Initialize consciousness once
      this.initializeCharacterConsciousness(character);
      
    } finally {
      this.isInitializing = false;
    }
  }

  initializeCharacterConsciousness(character) {
    if (!character) {
      console.error('Cannot initialize consciousness: character is null or undefined');
      return;
    }

    console.log('Initializing consciousness for:', character.name);

    // Only fetch the latest state from the server so process data is available
    this.requestConsciousnessUpdate();

    // Do NOT auto-start monitoring here. Monitoring must be started by explicit user action only.
    // if (window.socketClient && window.socketClient.isSocketConnected()) {
    //   window.socketClient.startMonitoring(character.id);
    // }
  }

  // Updated preview renderer with robust validation
  updateConsciousnessPreview(consciousness) {
    console.log('updateConsciousnessPreview called with:', consciousness);

    // Validate input data
    if (!consciousness || typeof consciousness !== 'object') {
      console.warn('Invalid consciousness data provided to updateConsciousnessPreview:', consciousness);

      // Show error message in preview
      const preview = document.getElementById('consciousnessPreview');
      if (preview) {
        const processList = preview.querySelector('.process-list');
        if (processList) {
          processList.innerHTML = '<div class="no-processes">Error: Invalid consciousness data</div>';
        }
      }
      return;
    }

    const preview = document.getElementById('consciousnessPreview');
    if (!preview) {
      console.warn('Consciousness preview element not found');
      return;
    }

    const processList = preview.querySelector('.process-list');
    if (!processList) {
      console.warn('Process list element not found in consciousness preview');
      return;
    }    // Validate consciousness data structure
    if (!consciousness || typeof consciousness !== 'object') {
      console.warn('Invalid consciousness data: not an object');
      processList.innerHTML = '<div class="no-processes">Invalid consciousness data<br><small>Check server connection</small></div>';
      return;
    }

    // Try different paths to find the processes array with improved validation
    let processes = null;

    if (Array.isArray(consciousness.processes)) {
      processes = consciousness.processes;
      console.log('Found processes in consciousness.processes');
    } else if (consciousness.consciousness && Array.isArray(consciousness.consciousness.processes)) {
      processes = consciousness.consciousness.processes;
      console.log('Found processes in consciousness.consciousness.processes');
    } else if (consciousness.data && Array.isArray(consciousness.data.processes)) {
      processes = consciousness.data.processes;
      console.log('Found processes in consciousness.data.processes');
    } else if (consciousness.state && Array.isArray(consciousness.state.processes)) {
      processes = consciousness.state.processes;
      console.log('Found processes in consciousness.state.processes');
    } else {
      // No valid processes array found
      console.warn('No valid processes array found in consciousness data:', consciousness);
      console.log('Available keys:', Object.keys(consciousness));
      
      // Try to extract from nested structures as fallback
      if (consciousness.consciousness && consciousness.consciousness.processes) {
        console.log('Found non-array processes in consciousness.consciousness.processes:', typeof consciousness.consciousness.processes);
        processes = [];
      } else {
        processList.innerHTML = '<div class="no-processes">No processes data available<br><small>Check server connection and character data</small></div>';
        return;
      }
    }

    console.log(`Found ${processes.length} processes to display`);

    if (processes.length === 0) {
      processList.innerHTML = '<div class="no-processes">No active processes</div>';
      return;
    }

    try {
      // Update process list in preview (safely)
      processList.innerHTML = processes.slice(0, 3).map(process => {
        // Validate individual process data
        if (!process || typeof process !== 'object') {
          return '<div class="process-item invalid">Invalid process data</div>';
        }

        const name = process.name || process.displayName || 'Unknown Process';
        let statusClass = 'running';
        let statusText = 'Running';

        if (process.status === 'crashed' || process.status === 'error') {
          statusClass = 'error';
          statusText = process.status === 'crashed' ? 'Crashed' : 'Error';
        } else if (process.status === 'warning' || (process.cpu_usage && process.cpu_usage > 80)) {
          statusClass = 'warning';
          statusText = 'Warning';
        } else if (process.status) {
          statusText = process.status.charAt(0).toUpperCase() + process.status.slice(1);
        }

        const cpu = process.cpu_usage || process.cpu || 0;
        const memory = process.memory_usage || process.memory_mb || process.memory || 0;
        const usage = `CPU: ${cpu.toFixed(1)}% | MEM: ${memory.toFixed(1)}MB`;

        return `
          <div class="process-item">
            <span class="process-name">${this.escapeHtml(name)}</span>
            <span class="process-status ${statusClass}">${statusText}</span>
            <span class="process-usage">${usage}</span>
          </div>
        `;
      }).join('');

      console.log('Successfully updated consciousness preview');
    } catch (error) {
      console.error('Error updating consciousness preview:', error);
      processList.innerHTML = '<div class="process-item error">Error displaying processes - check console</div>';
    }
  }

  // FIXED: Add robust data validation to handleConsciousnessUpdate
  handleConsciousnessUpdate(data) {
    // Validate input data
    if (!data) {
      console.warn('Received null/undefined consciousness update data');
      return;
    }

    if (!this.currentCharacter) {
      console.warn('No current character set, ignoring consciousness update');
      return;
    }

    try {
      console.log('Updating consciousness state:', data);
      
      // Extract and validate consciousness data
      const consciousnessData = this.extractConsciousnessData(data);
      if (!consciousnessData) {
        console.warn('No valid consciousness data found in update');
        return;
      }

      // Update state manager with validated data
      if (window.stateManager && typeof window.stateManager.updateConsciousnessData === 'function') {
        window.stateManager.updateConsciousnessData(consciousnessData);
      } else {
        console.error('StateManager not available or updateConsciousnessData method missing');
      }
      
      // Update UI components with validated data
      this.updateConsciousnessPreview(consciousnessData);
      
      // Notify other components
      this.notifyComponents('consciousness-updated', consciousnessData);

    } catch (error) {
      console.error('Error handling consciousness update:', error);
    }
  }

  // FIXED: Add data extraction and validation method
  extractConsciousnessData(data) {
    if (!data || typeof data !== 'object') {
      return null;
    }

    // Try different possible data structures
    let consciousness = null;

    // Check if data.state.consciousness exists
    if (data.state && data.state.consciousness) {
      consciousness = data.state.consciousness;
    }
    // Check if data.state is the consciousness object
    else if (data.state && typeof data.state === 'object') {
      consciousness = data.state;
    }
    // Check if data itself is the consciousness object
    else if (data.processes || data.memory || data.resources) {
      consciousness = data;
    }

    if (!consciousness) {
      return null;
    }

    // Normalize the consciousness data structure
    return {
      processes: Array.isArray(consciousness.processes) ? consciousness.processes : [],
      resources: consciousness.resources && typeof consciousness.resources === 'object' ? consciousness.resources : {},
      system_errors: Array.isArray(consciousness.system_errors) ? consciousness.system_errors : [],
      memory: consciousness.memory || null,
      threads: Array.isArray(consciousness.threads) ? consciousness.threads : []
    };
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
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const state = await response.json();
      
      if (window.stateManager) {
        window.stateManager.updateConsciousnessData(state);
      }
      
      this.updateConsciousnessPreview(state);
    } catch (error) {
      console.error('Failed to fetch consciousness update:', error);
    }
  }

  // Process management
  async killProcess(pid) {
    if (!this.currentCharacter) {
      throw new Error('No character selected');
    }
    
    try {
      const response = await fetch(`/api/process/${pid}/kill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          characterId: this.currentCharacter.id,
          processId: pid
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to kill process: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to kill process:', error);
      throw error;
    }
  }

  async restartProcess(pid) {
    if (!this.currentCharacter) {
      throw new Error('No character selected');
    }
    
    try {
      const response = await fetch(`/api/process/${pid}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          characterId: this.currentCharacter.id,
          processId: pid
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to restart process: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to restart process:', error);
      throw error;
    }
  }

  async adjustResource(resourceType, amount) {
    if (!this.currentCharacter) {
      throw new Error('No character selected');
    }
    
    try {
      if (window.socketClient) {
        await window.socketClient.applyIntervention(this.currentCharacter.id, {
          type: 'adjust_resource',
          resource_type: resourceType,
          amount: amount
        });
      } else {
        throw new Error('Socket client not available');
      }
    } catch (error) {
      console.error('Failed to adjust resource:', error);
      throw error;
    }
  }

  // Utility methods
  formatProcessUsage(process) {
    if (!process || typeof process !== 'object') {
      return 'N/A';
    }

    if (process.memory_mb && typeof process.memory_mb === 'number' && process.memory_mb > 100) {
      return `${Math.round(process.memory_mb)}MB`;
    } else if (process.cpu_usage && typeof process.cpu_usage === 'number') {
      return `${Math.round(process.cpu_usage)}%`;
    }
    return 'N/A';
  }

  getProcessStatusClass(process) {
    if (!process || typeof process !== 'object') {
      return 'unknown';
    }

    if (process.status === 'error') return 'error';
    if (process.cpu_usage && process.cpu_usage > 80) return 'error';
    if (process.cpu_usage && process.cpu_usage > 50) return 'warning';
    return 'running';
  }

  getResourceStatusClass(resource) {
    if (!resource || typeof resource !== 'object' || !resource.max || !resource.current) {
      return 'unknown';
    }

    const ratio = resource.current / resource.max;
    if (ratio > 0.8) return 'high';
    if (ratio > 0.5) return 'medium';
    return 'low';
  }

  // Security: HTML escaping utility
  escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') {
      return String(unsafe || '');
    }
    
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Component notification system
  notifyComponents(event, data) {
    try {
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
    } catch (error) {
      console.error('Error notifying components:', error);
    }
  }

  // Debug methods
  getCurrentState() {
    return {
      character: this.currentCharacter,
      isMonitoring: this.isMonitoring,
      hasUpdateInterval: !!this.updateInterval,
      isInitializing: this.isInitializing
    };
  }

  // Validation helper
  validateCharacterData(character) {
    if (!character || typeof character !== 'object') {
      return false;
    }

    if (!character.id || typeof character.id !== 'string') {
      return false;
    }

    if (!character.name || typeof character.name !== 'string') {
      return false;
    }

    return true;
  }

  // Cleanup
  destroy() {
    this.stopRealTimeUpdates();
    if (window.socketClient) {
      window.socketClient.off('consciousness-update', this._consciousnessUpdateHandler);
    }
    this.currentCharacter = null;
    this.isMonitoring = false;
    this.isInitializing = false;
  }
}

// Export for testing and ESM environments
export { ConsciousnessManager };

// Remove auto-instantiation on page load
// if (typeof window !== 'undefined') {
//   window.consciousness = new ConsciousnessManager();
// }

// Instead, provide an explicit initializer for user-triggered setup
if (typeof window !== 'undefined') {
  window.initConsciousnessManager = function() {
    if (!window.consciousness) {
      window.consciousness = new ConsciousnessManager();
    }
    return window.consciousness;
  };
}
// NOTE: Monitoring will NOT start automatically. Call window.initConsciousnessManager() from a user event (e.g., character card click), then call window.consciousness.userStartMonitoring() to begin monitoring.