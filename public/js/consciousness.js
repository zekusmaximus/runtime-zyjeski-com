// Fixed Consciousness Management Module - Prevent double initialization
class ConsciousnessManager {
  constructor() {
    this.currentCharacter = null;
    this.isMonitoring = false;
    this.updateInterval = null;
    this.isInitializing = false; // ADDED: Prevent concurrent initialization
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.subscribeToStateChanges();
  }

  setupEventListeners() {
    // Subscribe to socket events with error handling
    if (window.socketClient) {
      window.socketClient.on('consciousness-update', (data) => {
        try {
          this.handleConsciousnessUpdate(data);
        } catch (error) {
          console.error('Error in consciousness update handler:', error);
        }
      });
    }
  }

  subscribeToStateChanges() {
    // Subscribe to state manager changes
    if (window.stateManager) {
      window.stateManager.subscribe('currentCharacter', (character) => {
        // FIXED: Only set current character, don't initialize here
        // App.js will handle the initialization through loadCharacter()
        this.currentCharacter = character;
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
    
    // Update preview visualization with safe data
    const consciousness = character.consciousness || {};
    this.updateConsciousnessPreview(consciousness);
    
    // Start monitoring if socket is connected
    if (window.socketClient && window.socketClient.isSocketConnected()) {
      window.socketClient.startMonitoring(character.id);
    }
  }

  // FIXED: Add comprehensive data validation to updateConsciousnessPreview
  updateConsciousnessPreview(consciousness) {
    // Validate input data
    if (!consciousness || typeof consciousness !== 'object') {
      console.warn('Invalid consciousness data provided to updateConsciousnessPreview:', consciousness);
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
    }

    // FIXED: Ensure processes exists and is an array
    const processes = consciousness.processes;
    if (!Array.isArray(processes)) {
      console.warn('Consciousness processes is not an array:', processes);
      processList.innerHTML = '<div class="no-processes">No processes available</div>';
      return;
    }

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

        const name = process.name || 'Unknown Process';
        let statusClass = 'running';
        let statusText = 'Running';
        
        if (process.status === 'error' || (process.cpu_usage && process.cpu_usage > 80)) {
          statusClass = 'error';
          statusText = process.status === 'error' ? 'Error' : 'High CPU';
        } else if (process.cpu_usage && process.cpu_usage > 50) {
          statusClass = 'warning';
          statusText = 'Warning';
        }

        const usage = this.formatProcessUsage(process);

        return `
          <div class="process-item">
            <span class="process-name">${this.escapeHtml(name)}</span>
            <span class="process-status ${statusClass}">${statusText}</span>
            <span class="process-usage">${usage}</span>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error updating consciousness preview:', error);
      processList.innerHTML = '<div class="process-item error">Error displaying processes</div>';
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
      window.socketClient.off('consciousness-update', this.handleConsciousnessUpdate);
    }

    this.currentCharacter = null;
    this.isMonitoring = false;
    this.isInitializing = false;
  }
}

// Create global consciousness manager instance
window.consciousness = new ConsciousnessManager();