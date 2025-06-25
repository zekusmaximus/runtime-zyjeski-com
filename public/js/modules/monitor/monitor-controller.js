// public/js/modules/monitor/monitor-controller.js
import MonitorUI from './monitor-ui.js';
import stateManager from '../state-manager.js';

export class MonitorController {
  constructor() {
    this.ui = new MonitorUI();
    this.isConnected = false;
    this.pollingInterval = null;
    this.characterId = null;
    
    // Subscribe to state changes
    stateManager.subscribe('stateChanged', (state) => this.handleStateUpdate(state));
    stateManager.subscribe('characterLoaded', (character) => this.handleCharacterLoaded(character));
    
    console.log('[MONITOR CONTROLLER] Initializing monitor controller...');
    this.initialize();
  }

  async initialize() {
    console.log('[MONITOR CONTROLLER] ===== INITIALIZE START =====');
    
    // Set up refresh button
    const refreshBtn = document.getElementById('refreshMonitor');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refresh());
      console.log('[MONITOR CONTROLLER] Refresh button event listener added');
    }

    // Hide the character selector since we use the one from home page
    const characterSelect = document.getElementById('characterSelect');
    if (characterSelect) {
      characterSelect.style.display = 'none';
      console.log('[MONITOR CONTROLLER] Character selector hidden');
    }

    // Check if we already have a loaded character
    const currentState = stateManager.getState();
    const currentCharacter = stateManager.getCurrentCharacter();
    
    console.log('[MONITOR CONTROLLER] Current state exists:', !!currentState);
    console.log('[MONITOR CONTROLLER] Current character:', currentCharacter);
    
    if (currentState && currentCharacter) {
      console.log('[MONITOR CONTROLLER] Found existing character, connecting...');
      this.characterId = currentCharacter.id;
      this.isConnected = true;
      this.handleStateUpdate(currentState);
    } else if (currentCharacter && !currentState) {
      console.log('[MONITOR CONTROLLER] Found character but no state, loading state...');
      this.characterId = currentCharacter.id;
      try {
        await stateManager.loadCharacter(currentCharacter.id);
        const newState = stateManager.getState();
        if (newState) {
          this.isConnected = true;
          this.handleStateUpdate(newState);
        }
      } catch (error) {
        console.error('[MONITOR CONTROLLER] Error loading character state:', error);
        this.showDisconnectedState();
      }
    } else {
      console.log('[MONITOR CONTROLLER] No character loaded, showing disconnected state');
      this.showDisconnectedState();
    }
    
    console.log('[MONITOR CONTROLLER] ===== INITIALIZE COMPLETE =====');
  }

  handleCharacterLoaded(character) {
    console.log('[MONITOR CONTROLLER] Character loaded event received:', character.name);
    this.characterId = character.id;
    this.isConnected = true;
    
    // Update the character selector if it exists to reflect the loaded character
    const characterSelect = document.getElementById('characterSelect');
    if (characterSelect) {
      characterSelect.value = character.id;
    }
  }

  handleStateUpdate(state) {
    console.log('[MONITOR CONTROLLER] ===== STATE UPDATE START =====');
    console.log('[MONITOR CONTROLLER] State update received:', state);
    console.log('[MONITOR CONTROLLER] Current isConnected:', this.isConnected);
    console.log('[MONITOR CONTROLLER] Current characterId:', this.characterId);
    
    if (!state) {
      console.log('[MONITOR CONTROLLER] No state provided, showing disconnected state');
      this.showDisconnectedState();
      return;
    }

    console.log('[MONITOR CONTROLLER] Processing state update with data:', {
      processes: state.processes?.length || 0,
      hasMemory: !!state.consciousness?.memory,
      hasResources: !!state.consciousness?.resources,
      hasSystemResources: !!state.systemResources,
      hasErrors: !!state.system_errors
    });

    // Ensure we're marked as connected since we have data
    if (!this.isConnected) {
      console.log('[MONITOR CONTROLLER] Setting connected state to true');
      this.isConnected = true;
    }

    // Update UI with new state - use state.processes directly since it's extracted to top level
    console.log('[MONITOR CONTROLLER] Updating processes...');
    this.ui.updateProcesses(state.processes || []);
    
    // Handle memory data - check multiple possible locations
    if (state.consciousness?.memory) {
      console.log('[MONITOR CONTROLLER] Updating memory from consciousness.memory');
      this.ui.updateMemory(state.consciousness.memory);
    } else if (state.memoryMap) {
      console.log('[MONITOR CONTROLLER] Updating memory from memoryMap');
      this.ui.updateMemory(state.memoryMap);
    } else {
      // Always fetch memory data from API since it's not included in state
      console.log('[MONITOR CONTROLLER] Fetching memory data from API');
      this.fetchMemoryData();
    }
    
    // Handle resources - check multiple possible locations
    const resources = state.consciousness?.resources || state.systemResources || state.resources || {};
    console.log('[MONITOR CONTROLLER] Using resources:', resources);
    this.ui.updateResources(resources);
    
    console.log('[MONITOR CONTROLLER] Updating errors...');
    this.ui.updateErrors(state.system_errors || []);
    
    console.log('[MONITOR CONTROLLER] Setting connection status to true...');
    this.ui.setConnectionStatus(true);
    
    console.log('[MONITOR CONTROLLER] Updating timestamp...');
    this.ui.updateTimestamp(Date.now());
    
    console.log('[MONITOR CONTROLLER] ===== STATE UPDATE COMPLETE =====');
  }

  async fetchMemoryData() {
    console.log('[MONITOR CONTROLLER] ===== FETCH MEMORY DATA START =====');
    console.log('[MONITOR CONTROLLER] characterId:', this.characterId);
    
    if (!this.characterId) {
      console.log('[MONITOR CONTROLLER] No characterId, cannot fetch memory data');
      return;
    }

    try {
      const url = `/api/consciousness/${this.characterId}/memory`;
      console.log('[MONITOR CONTROLLER] Fetching memory from:', url);
      
      const response = await fetch(url);
      console.log('[MONITOR CONTROLLER] Memory fetch response:', response.status, response.statusText);
      
      if (response.ok) {
        const memoryData = await response.json();
        console.log('[MONITOR CONTROLLER] Memory data received:', memoryData);
        this.ui.updateMemory(memoryData);
        console.log('[MONITOR CONTROLLER] Memory UI updated');
      } else {
        console.error('[MONITOR CONTROLLER] Memory fetch failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[MONITOR CONTROLLER] Error fetching memory data:', error);
    }
    
    console.log('[MONITOR CONTROLLER] ===== FETCH MEMORY DATA END =====');
  }

  async fetchAllData() {
    if (!this.characterId) return;

    try {
      // Fetch all data types in parallel
      const [processesRes, memoryRes, errorsRes] = await Promise.all([
        fetch(`/api/consciousness/${this.characterId}/processes`),
        fetch(`/api/consciousness/${this.characterId}/memory`),
        fetch(`/api/consciousness/${this.characterId}/errors`)
      ]);

      if (processesRes.ok) {
        const processes = await processesRes.json();
        this.ui.updateProcesses(processes);
      }

      if (memoryRes.ok) {
        const memory = await memoryRes.json();
        this.ui.updateMemory(memory);
      }

      if (errorsRes.ok) {
        const errors = await errorsRes.json();
        this.ui.updateErrors(errors);
      }

      this.ui.updateTimestamp(Date.now());
    } catch (error) {
      console.error('[MONITOR CONTROLLER] Error fetching data:', error);
    }
  }

  connectToCharacter(character) {
    console.log('[MONITOR CONTROLLER] Connecting to character:', character.name);
    this.characterId = character.id;
    this.isConnected = true;
    
    // Update UI with character data
    if (character.consciousness) {
      this.handleStateUpdate({
        ...character,
        processes: character.consciousness.processes || character.baseProcesses || [],
        system_errors: character.consciousness.system_errors || [],
        consciousness: character.consciousness
      });
    } else {
      // Fetch fresh data if consciousness not included
      this.fetchAllData();
    }
  }

  async refresh() {
    console.log('[MONITOR CONTROLLER] Refreshing monitor data...');
    
    if (!this.isConnected || !this.characterId) {
      console.warn('[MONITOR CONTROLLER] Cannot refresh - not connected');
      return;
    }

    // Show loading state
    const refreshBtn = document.getElementById('refreshMonitor');
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing...';
    }

    try {
      // Use state manager to refresh
      await stateManager.refreshState();
      
      // Also fetch specific data that might not be in state
      await this.fetchAllData();
      
      console.log('[MONITOR CONTROLLER] Refresh completed');
    } catch (error) {
      console.error('[MONITOR CONTROLLER] Refresh error:', error);
    } finally {
      // Reset button
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh';
      }
    }
  }

  showDisconnectedState() {
    console.log('[MONITOR CONTROLLER] Showing disconnected state');
    this.isConnected = false;
    this.characterId = null;
    
    this.ui.updateProcesses([]);
    this.ui.updateMemory(null);
    this.ui.updateResources({});
    this.ui.updateErrors([]);
    this.ui.setConnectionStatus(false);
    
    console.log('[MONITOR CONTROLLER] Monitor reset to disconnected state');
  }

  startPolling(interval = 5000) {
    if (this.pollingInterval) return;
    
    console.log(`[MONITOR CONTROLLER] Starting polling every ${interval}ms`);
    this.pollingInterval = setInterval(() => {
      if (this.isConnected) {
        this.fetchAllData();
      }
    }, interval);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[MONITOR CONTROLLER] Polling stopped');
    }
  }

  destroy() {
    this.stopPolling();
    // Note: We don't unsubscribe from state manager as it's a singleton
    console.log('[MONITOR CONTROLLER] Monitor controller destroyed');
  }
}

// Export for use in monitor.js
export default MonitorController;