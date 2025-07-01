// Fixed Consciousness Management Module - Prevent double initialization

import { createLogger } from './logger.js';

class ConsciousnessManager {
  constructor(dependencies = {}) {
    // Dependency injection - accept dependencies instead of global access
    const { stateManager, socketClient, logger, transformer } = dependencies;

    this.stateManager = stateManager;
    this.socketClient = socketClient;
    this.logger = logger || createLogger('Consciousness');
    this.transformer = transformer;

    // Validate required dependencies
    if (!this.transformer) {
      this.logger.warn('ConsciousnessTransformer not provided - data transformation may be limited');
    }

    this.updateInterval = null;
    this.isInitializing = false; // ADDED: Prevent concurrent initialization
    // Store the handler reference for proper removal
    this._consciousnessUpdateHandler = (data) => {
      try {
        this.handleConsciousnessUpdate(data);
      } catch (error) {
        this.logger.error('Error in consciousness update handler:', error);
      }
    };
    this.init();
  }

  // Convenience getters for accessing state
  get currentCharacter() {
    return this.stateManager ? this.stateManager.getCurrentCharacter() : null;
  }

  get isMonitoring() {
    return this.stateManager ? this.stateManager.getMonitoringActive() : false;
  }

  init() {
    this.setupEventListeners();
    this.subscribeToStateChanges();
  }

  setupEventListeners() {
    // Subscribe to socket events with error handling
    if (this.socketClient) {
      this.socketClient.on('consciousness-update', this._consciousnessUpdateHandler);
    }
  }

  subscribeToStateChanges() {
    // Subscribe to state manager changes
    if (this.stateManager) {
      this.stateManager.subscribe('currentCharacter', (character) => {
        // GROUND STATE: Character change handled by getter, just log
        this.logger.info('Character set in consciousness manager:', character?.name || 'none');

        // Update consciousness preview when character changes
        if (character && character.consciousness) {
          this.updateConsciousnessPreview(character.consciousness);
        }
      });

      // GROUND STATE FIX: Remove auto-start logic from monitoringActive subscription
      this.stateManager.subscribe('monitoringActive', (active) => {
        this.logger.info('Monitoring state changed:', active);
        // Do NOT auto-start or stop real-time updates here
        // Monitoring should only be started/stopped by explicit user action
      });
    }
  }

  // User-initiated monitoring start
  userStartMonitoring() {
    if (!this.currentCharacter) {
      this.logger.warn('No character selected for monitoring');
      return false;
    }
    if (this.isMonitoring) {
      this.logger.info('Monitoring already active');
      return true;
    }

    this.logger.info('USER ACTION: Starting consciousness monitoring for', this.currentCharacter.name);

    // Update state through StateManager
    if (this.stateManager) {
      this.stateManager.set('monitoringActive', true);
    }

    // Connect and start monitoring via WebSocket
    if (this.socketClient) {
      const success = this.socketClient.startMonitoring(this.currentCharacter.id);
      // Treat ONLY an explicit `false` as failure; `undefined` is considered success
      if (success === false) {
        this.logger.error('Failed to start WebSocket monitoring');
        if (this.stateManager) {
          this.stateManager.set('monitoringActive', false);
        }
        return false;
      }
    }

    return true;
  }

  // User-initiated monitoring stop
  userStopMonitoring() {
    if (!this.isMonitoring) {
      this.logger.info('Monitoring already inactive');
      return true;
    }

    this.logger.info('USER ACTION: Stopping consciousness monitoring');

    // Update state through StateManager
    if (this.stateManager) {
      this.stateManager.set('monitoringActive', false);
    }

    this.stopRealTimeUpdates();

    if (this.socketClient && this.currentCharacter) {
      this.socketClient.stopMonitoring(this.currentCharacter.id);
    }

    return true;
  }

  // FIXED: Main entry point that prevents double initialization
 loadCharacter(character) {
  this.logger.info('ConsciousnessManager.loadCharacter called with:', character?.name || 'no character');

  // Validate character data
  if (!character || typeof character !== 'object') {
    this.logger.error('Cannot load character: character is null or undefined');
    return;
  }

  // Prevent concurrent initialization
  if (this.isInitializing) {
    this.logger.info('Character initialization already in progress, skipping duplicate');
    return;
  }

  // If same character is already loaded, don't reload
  if (this.currentCharacter && this.currentCharacter.id === character.id) {
    this.logger.info(`Character ${character.id} already loaded and initialized`);
    return;
  }

  try {
    this.isInitializing = true;

    // Load character state in state manager (this will update currentCharacter via subscription)
    if (this.stateManager) {
      // FIX: Change from loadCharacterState to loadCharacter
      this.stateManager.loadCharacter(character.id);
    }
    
    // Initialize consciousness once
    this.initializeCharacterConsciousness(character);
    
  } finally {
    this.isInitializing = false;
  }
}

  initializeCharacterConsciousness(character) {
    if (!character) {
      this.logger.error('Cannot initialize consciousness: character is null or undefined');
      return;
    }

    this.logger.info('Initializing consciousness for:', character.name);

    // Only fetch the latest state from the server so process data is available
    this.requestConsciousnessUpdate();

    // Do NOT auto-start monitoring here. Monitoring must be started by explicit user action only.
    // if (window.socketClient && window.socketClient.isSocketConnected()) {
    //   window.socketClient.startMonitoring(character.id);
    // }
  }

  // REFACTORED: Use ConsciousnessTransformer for process formatting
  updateConsciousnessPreview(consciousness) {
    this.logger.debug('updateConsciousnessPreview called with:', consciousness);

    // Validate input data
    if (!consciousness || typeof consciousness !== 'object') {
      this.logger.warn('Invalid consciousness data provided to updateConsciousnessPreview:', consciousness);

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
      this.logger.warn('Consciousness preview element not found');
      return;
    }

    const processList = preview.querySelector('.process-list');
    if (!processList) {
      this.logger.warn('Process list element not found in consciousness preview');
      return;
    }

    try {
      let processes = [];

      // Use transformer if available for process extraction and formatting
      if (this.transformer) {
        processes = this.transformer.extractProcesses(consciousness);
      } else {
        // Fallback to legacy process extraction
        processes = this.extractProcessesLegacy(consciousness);
      }

      this.logger.debug(`Found ${processes.length} processes to display`);

      if (processes.length === 0) {
        processList.innerHTML = '<div class="no-processes">No active processes</div>';
        return;
      }

      // Render processes using transformer-formatted data
      processList.innerHTML = processes.slice(0, 3).map(process => {
        if (this.transformer) {
          // Use transformer-formatted process data
          return this.renderTransformedProcess(process);
        } else {
          // Use legacy rendering
          return this.renderProcessLegacy(process);
        }
      }).join('');

      this.logger.debug('Successfully updated consciousness preview');
    } catch (error) {
      this.logger.error('Error updating consciousness preview:', error);
      processList.innerHTML = '<div class="process-item error">Error displaying processes - check console</div>';
    }
  }

  // Helper method to render transformer-formatted process
  renderTransformedProcess(process) {
    if (!process || typeof process !== 'object') {
      return '<div class="process-item invalid">Invalid process data</div>';
    }

    const name = process.name || 'Unknown Process';
    const statusClass = this.getStatusClass(process.status, process.health);
    const statusText = this.getStatusText(process.status);
    const usage = `CPU: ${process.cpu.toFixed(1)}% | MEM: ${process.memory.toFixed(1)}MB`;

    return `
      <div class="process-item">
        <span class="process-name">${this.escapeHtml(name)}</span>
        <span class="process-status ${statusClass}">${statusText}</span>
        <span class="process-usage">${usage}</span>
      </div>
    `;
  }

  // Helper method for legacy process extraction (fallback)
  extractProcessesLegacy(consciousness) {
    // Legacy process extraction logic
    if (Array.isArray(consciousness.processes)) {
      return consciousness.processes;
    } else if (consciousness.consciousness && Array.isArray(consciousness.consciousness.processes)) {
      return consciousness.consciousness.processes;
    } else if (consciousness.data && Array.isArray(consciousness.data.processes)) {
      return consciousness.data.processes;
    } else if (consciousness.state && Array.isArray(consciousness.state.processes)) {
      return consciousness.state.processes;
    }
    return [];
  }

  // Helper method for legacy process rendering (fallback)
  renderProcessLegacy(process) {
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
  }

  // Helper methods for status formatting
  getStatusClass(status, health) {
    if (status === 'error' || status === 'crashed') return 'error';
    if (status === 'warning' || (health && health < 50)) return 'warning';
    return 'running';
  }

  getStatusText(status) {
    if (!status) return 'Running';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  // REFACTORED: Use ConsciousnessTransformer for data processing
  handleConsciousnessUpdate(data) {
    this.logger.debug('[DEBUG] Received consciousness-update:', data);

    // Validate input data
    if (!data) {
      this.logger.warn('Received null/undefined consciousness update data');
      return;
    }

    if (!this.currentCharacter) {
      this.logger.warn('No current character set, ignoring consciousness update');
      return;
    }

    try {
      this.logger.debug('Updating consciousness state:', data);

      // PREVENT FEEDBACK LOOP: Set flag to indicate we're processing server data
      if (this.stateManager) {
        this.stateManager._processingServerUpdate = true;
      }

      // Use transformer for data validation and processing
      let consciousnessData;
      if (this.transformer) {
        // Validate update with transformer
        if (!this.transformer.validateUpdate(data)) {
          this.logger.warn('Invalid consciousness update data structure');
          if (this.stateManager) {
            this.stateManager._processingServerUpdate = false;
          }
          return;
        }

        // Extract consciousness data using transformer (fallback to legacy method)
        consciousnessData = this.extractConsciousnessData(data);
      } else {
        // Fallback to legacy extraction method
        consciousnessData = this.extractConsciousnessData(data);
      }

      if (!consciousnessData) {
        this.logger.warn('No valid consciousness data found in update');
        if (this.stateManager) {
          this.stateManager._processingServerUpdate = false;
        }
        return;
      }

      // Update state manager with validated data
      if (this.stateManager && typeof this.stateManager.updateConsciousnessData === 'function') {
        this.stateManager.updateConsciousnessData(consciousnessData);
      } else {
        this.logger.error('StateManager not available or updateConsciousnessData method missing');
      }

      // Update UI components with transformed data
      this.updateConsciousnessPreview(consciousnessData);

      // Notify other components
      this.notifyComponents('consciousness-updated', consciousnessData);

      // Clear the flag
      if (this.stateManager) {
        this.stateManager._processingServerUpdate = false;
      }

    } catch (error) {
      // Always clear the flag even on error to prevent permanent lock
      if (this.stateManager) {
        this.stateManager._processingServerUpdate = false;
      }
      this.logger.error('Error handling consciousness update:', error);
    }
  }

  // FIXED: Add data extraction and validation method
  extractConsciousnessData(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Handle different data structures from various sources
  let consciousness = null;

  // Direct consciousness data (from monitor updates)
  if (data.consciousness && typeof data.consciousness === 'object') {
    consciousness = data.consciousness;
  }
  // Nested state structure
  else if (data.state && data.state.consciousness) {
    consciousness = data.state.consciousness;
  }
  // State is the consciousness object
  else if (data.state && typeof data.state === 'object') {
    consciousness = data.state;
  }
  // Data itself contains consciousness properties
  else if (data.processes || data.memory || data.resources) {
    consciousness = data;
  }

  if (!consciousness) {
    return null;
  }

  // Normalize and ensure all required properties exist
  return {
    processes: Array.isArray(consciousness.processes) ? consciousness.processes : [],
    resources: consciousness.resources && typeof consciousness.resources === 'object' ? consciousness.resources : {
      cpu: { used: 0, total: 100, percentage: 0 },
      memory: { used: 0, total: 1024, available: 1024, percentage: 0 },
      threads: { used: 0, total: 16, percentage: 0 }
    },
    system_errors: Array.isArray(consciousness.system_errors) ? consciousness.system_errors : [],
    memory: consciousness.memory || {},
    threads: Array.isArray(consciousness.threads) ? consciousness.threads : []
  };
}

  startRealTimeUpdates() {
    // Auto-update loop disabled; updates occur on manual refresh
    return;
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

      if (this.stateManager) {
        this.stateManager.updateConsciousnessData(state);
      }
      
      this.updateConsciousnessPreview(state);
    } catch (error) {
      this.logger.error('Failed to fetch consciousness update:', error);
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
      this.logger.error('Failed to kill process:', error);
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
      this.logger.error('Failed to restart process:', error);
      throw error;
    }
  }

  async adjustResource(resourceType, amount) {
    if (!this.currentCharacter) {
      throw new Error('No character selected');
    }

    try {
      if (this.socketClient) {
        await this.socketClient.applyIntervention(this.currentCharacter.id, {
          type: 'adjust_resource',
          resource_type: resourceType,
          amount: amount
        });
      } else {
        throw new Error('Socket client not available');
      }
    } catch (error) {
      this.logger.error('Failed to adjust resource:', error);
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
      this.logger.error('Error notifying components:', error);
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
    if (this.socketClient) {
      this.socketClient.off('consciousness-update', this._consciousnessUpdateHandler);
    }
    this.isInitializing = false;

    // Clean up transformer
    if (this.transformer && typeof this.transformer.destroy === 'function') {
      this.transformer.destroy();
    }

    // Clear state through StateManager
    if (this.stateManager) {
      this.stateManager.setCurrentCharacter(null);
      this.stateManager.setMonitoringActive(false);
    }
  }
}

// Export ConsciousnessManager class for dependency injection
// No auto-instantiation - will be created by bootstrap with proper dependencies
export default ConsciousnessManager;