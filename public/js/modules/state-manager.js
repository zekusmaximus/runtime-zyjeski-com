// public/js/modules/state-manager.js
export class ConsciousnessStateManager {
  constructor() {
    this.currentCharacter = null;
    this.state = null;
    this.listeners = new Map();
    this.isLoading = false;
    this.pollingInterval = null;
    console.log('ConsciousnessStateManager initialized');
  }

  // Subscribe to state changes
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
    
    // If we already have state, immediately notify new subscriber
    if (this.state && eventType === 'stateChanged') {
      callback(this.state);
    }
  }

  // Unsubscribe from state changes
  unsubscribe(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to all listeners
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  // Load character and fetch initial state
  async loadCharacter(characterId) {
    console.log('[STATE MANAGER] Loading character:', characterId);
    
    if (this.isLoading) {
      console.log('[STATE MANAGER] Already loading a character, ignoring request');
      return;
    }

    if (this.currentCharacter?.id === characterId) {
      console.log('[STATE MANAGER] Character already loaded:', characterId);
      return;
    }

    this.isLoading = true;
    this.emit('loadingStarted', { characterId });

    try {
      // Stop any existing polling
      this.stopPolling();

      console.log('[STATE MANAGER] Fetching character data...');
      // Fetch character data
      const charResponse = await fetch(`/api/character/${characterId}`);
      if (!charResponse.ok) {
        console.error('[STATE MANAGER] Character fetch failed:', charResponse.status, charResponse.statusText);
        throw new Error('Failed to load character');
      }
      const character = await charResponse.json();
      console.log('[STATE MANAGER] Character data loaded:', character);

      console.log('[STATE MANAGER] Fetching consciousness state...');
      // Fetch initial consciousness state
      const stateResponse = await fetch(`/api/consciousness/${characterId}/state`);
      if (!stateResponse.ok) {
        console.error('[STATE MANAGER] State fetch failed:', stateResponse.status, stateResponse.statusText);
        throw new Error('Failed to load consciousness state');
      }
      const state = await stateResponse.json();
      console.log('[STATE MANAGER] Consciousness state loaded:', state);

      this.currentCharacter = character;
      this.state = state;
      
      console.log('[STATE MANAGER] Character state loaded successfully:', character.name);
      this.emit('characterLoaded', character);
      this.emit('stateChanged', state);

      // Don't start polling - we want static state until player actions
      
    } catch (error) {
      console.error('[STATE MANAGER] Error loading character:', error);
      this.emit('error', { message: 'Failed to load character', error });
    } finally {
      this.isLoading = false;
      this.emit('loadingCompleted');
    }
  }

  // Alternative method that accepts a character object (for compatibility)
  loadCharacterState(character) {
    if (!character || !character.id) {
      console.error('Invalid character object provided');
      return;
    }
    
    // Store the character object and emit events
    this.currentCharacter = character;
    if (character.consciousness) {
      this.state = {
        ...character,
        consciousness: character.consciousness,
        processes: character.consciousness.processes || [],
        system_errors: character.consciousness.system_errors || []
      };
      this.emit('characterLoaded', character);
      this.emit('stateChanged', this.state);
    } else {
      // If no consciousness data, load it
      this.loadCharacter(character.id);
    }
  }

  // Fetch latest state (for manual refresh)
  async refreshState() {
    if (!this.currentCharacter) {
      console.warn('No character loaded');
      return;
    }

    try {
      const response = await fetch(`/api/consciousness/${this.currentCharacter.id}/state`);
      if (!response.ok) throw new Error('Failed to fetch state');
      
      const newState = await response.json();
      this.state = newState;
      this.emit('stateChanged', newState);
      
      console.log('State refreshed for:', this.currentCharacter.name);
    } catch (error) {
      console.error('Error refreshing state:', error);
      this.emit('error', { message: 'Failed to refresh state', error });
    }
  }

  // Update state after player action
  async applyPlayerAction(action, parameters = {}) {
    if (!this.currentCharacter) {
      console.warn('No character loaded');
      return;
    }

    try {
      this.emit('actionStarted', { action, parameters });

      const response = await fetch(`/api/consciousness/${this.currentCharacter.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, parameters })
      });

      if (!response.ok) throw new Error('Failed to apply action');
      
      const newState = await response.json();
      this.state = newState;
      
      this.emit('actionCompleted', { action, parameters, newState });
      this.emit('stateChanged', newState);
      
      console.log('Player action applied:', action);
    } catch (error) {
      console.error('Error applying player action:', error);
      this.emit('error', { message: 'Failed to apply action', error });
    }
  }

  // Start polling for state updates (if needed for real-time features)
  startPolling(interval = 5000) {
    if (this.pollingInterval) {
      console.log('Polling already active');
      return;
    }

    console.log(`Starting state polling every ${interval}ms`);
    this.pollingInterval = setInterval(() => {
      this.refreshState();
    }, interval);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Polling stopped');
    }
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Get current character
  getCurrentCharacter() {
    return this.currentCharacter;
  }

  // Get loading status
  isLoadingCharacter() {
    return this.isLoading;
  }

  // Get specific state data
  getProcesses() {
    return this.state?.processes || [];
  }

  getMemory() {
    return this.state?.consciousness?.memory || null;
  }

  getErrors() {
    return this.state?.system_errors || [];
  }

  getResources() {
    return this.state?.consciousness?.resources || null;
  }

  // Update consciousness data from server response
  updateConsciousnessData(data) {
    if (!data) {
      console.warn('No data provided to updateConsciousnessData');
      return;
    }

    // Update the state with new consciousness data
    if (data.consciousness) {
      this.state = {
        ...this.state,
        ...data,
        consciousness: data.consciousness,
        processes: data.consciousness.processes || data.processes || [],
        system_errors: data.consciousness.system_errors || data.system_errors || [],
        memory: data.consciousness.memory || data.memory || null,
        resources: data.consciousness.resources || data.resources || {}
      };
    } else {
      // If data doesn't have consciousness wrapper, assume it IS the consciousness data
      this.state = {
        ...this.state,
        consciousness: data,
        processes: data.processes || [],
        system_errors: data.system_errors || [],
        memory: data.memory || null,
        resources: data.resources || {}
      };
    }

    // Emit state change event
    this.emit('stateChanged', this.state);
    console.log('Consciousness data updated');
  }

  // Clear current state
  clear() {
    this.stopPolling();
    this.currentCharacter = null;
    this.state = null;
    this.emit('stateCleared');
    console.log('State manager cleared');
  }
}

// Create and export singleton instance
const stateManager = new ConsciousnessStateManager();
export default stateManager;