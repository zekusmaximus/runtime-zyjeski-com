// public/js/modules/monitor/monitor-controller.js
// Ground State Compliant Implementation - Uses local state, not server data

import MonitorUI from './monitor-ui.js';
import MonitorState from './monitor-state.js';
import { createLogger } from '../../logger.js';

class MonitorController {
  constructor(dependencies = {}) {
    // Dependency injection - accept dependencies instead of global access
    const { stateManager, socketClient, consciousness, logger } = dependencies;

    this.stateManager = stateManager;
    this.socketClient = socketClient;
    this.consciousness = consciousness;
    this.logger = logger || createLogger('Monitor');

    this.state = new MonitorState();
    this.ui = new MonitorUI();
    this.stateUpdateHandler = null;
  }

  initialize() {
    this.logger.info('[GROUND STATE] Monitor initializing - will use local state manager data');
    
    // Initialize UI
    this.ui.initialize(this);
    
    // Subscribe to state manager updates
    this.subscribeToStateManager();

    // Load available characters for selection
    this.loadAvailableCharacters();

    // Listen for real-time socket updates if a connection is present.
    // This keeps the UI live once monitoring starts (Task C).
    if (this.socketClient) {
      this.socketClient.on('resources-update', ({ cpu, threads, memTotal }) => {
        const payload = {
          consciousness: {
            resources: { cpu, threads, memory: memTotal },
            memory:   this.state.memory || {},
            system_errors: this.state.errors || []
          },
          processes: this.state.processes || []
        };
        this.state.update(payload);
        this.ui.updateAll(this.state.consciousnessData);
      });

      

      this.socketClient.on('memory-update', ({ allocationByProcess }) => {
        const payload = {
          consciousness: {
            memory: { pools: allocationByProcess },
            resources: this.state.resources || {},
            system_errors: this.state.errors || []
          },
          processes: this.state.processes || []
        };
        this.state.update(payload);
        this.ui.updateAll(this.state.consciousnessData);
      });

      this.socketClient.on('errors-update', ({ list }) => {
        const payload = {
          consciousness: {
            system_errors: list,
            resources: this.state.resources || {},
            memory: this.state.memory || {}
          },
          processes: this.state.processes || []
        };
        this.state.update(payload);
        this.ui.updateAll(this.state.consciousnessData);
      });
    }

    // Load current character data if available
    this.loadCurrentCharacterData();
  }

  async loadAvailableCharacters() {
    try {
      console.log('[MONITOR] Loading available characters...');
      const response = await fetch('/api/characters');
      if (!response.ok) {
        throw new Error('Failed to load characters');
      }
      
      const characters = await response.json();
      console.log('[MONITOR] Characters loaded:', characters);
      
      // Populate the character dropdown
      this.ui.populateCharacterList(characters);
      
      // If there's a character already in state manager, select it
      const currentCharacter = this.stateManager?.getCurrentCharacter();
      if (currentCharacter) {
        this.ui.setSelectedCharacter(currentCharacter.id);
        this.loadCurrentCharacterData();
      } else if (characters.length > 0) {
        // Auto-select first character if none is selected
        console.log('[MONITOR] Auto-selecting first character:', characters[0].name);
        await this.selectCharacter(characters[0].id);
      }
    } catch (error) {
      console.error('[MONITOR] Error loading characters:', error);
    }
  }

  async selectCharacter(characterId) {
    try {
      console.log('[MONITOR] Selecting character:', characterId);
      
      // Load character into state manager
      if (this.stateManager) {
        await this.stateManager.loadCharacter(characterId);
      }

      // Load consciousness data
      const stateResponse = await fetch(`/api/consciousness/${characterId}/state`);
      if (stateResponse.ok) {
        const consciousnessData = await stateResponse.json();
        console.log('[MONITOR] Consciousness data loaded:', consciousnessData);

        // Update state manager with consciousness data
        if (this.stateManager) {
          this.stateManager.updateConsciousnessData(consciousnessData);
        }
      }
      
      // Update UI
      this.ui.setSelectedCharacter(characterId);
      this.loadCurrentCharacterData();
      
    } catch (error) {
      console.error('[MONITOR] Error selecting character:', error);
    }
  }

  subscribeToStateManager() {
    if (!this.stateManager) {
      console.error('[GROUND STATE] State manager not available');
      return;
    }

    // Subscribe to state changes
    this.stateUpdateHandler = (newState) => {
      console.log('[GROUND STATE] Monitor received state update from state manager');
      this.handleStateUpdate(newState);
    };

    // Listen for state changes using subscribe method
    this.stateManager.subscribe('stateChanged', this.stateUpdateHandler);
    this.stateManager.subscribe('characterLoaded', () => this.loadCurrentCharacterData());
  }

  loadCurrentCharacterData() {
    // Get current character from state manager
    const character = this.stateManager ? this.stateManager.getCurrentCharacter() : null;
    const state = this.stateManager ? this.stateManager.getState() : null;
    
    if (!character || !state) {
      console.log('[GROUND STATE] No character loaded yet');
      return;
    }

    console.log('[GROUND STATE] Loading character data from state manager:', character.name);
    
    // Update UI with character info
    this.ui.populateCharacterList([character]);
    this.ui.setSelectedCharacter(character.id);
    
    // Update state and displays
    this.state.setSelectedCharacter(character.id);
    this.state.update(state);
    this.ui.updateAll(this.state.consciousnessData);
  }

  handleStateUpdate(newState) {
    if (!newState) return;
    
    console.log('[GROUND STATE] Updating monitor displays with new state');
    this.state.update(newState);
    this.ui.updateAll(this.state.consciousnessData);
  }

  // User action: Manually refresh display
  refreshData() {
    console.log('[GROUND STATE] User requested refresh - reloading from state manager');
    this.loadCurrentCharacterData();
  }

  // User action: Clear errors
  clearErrors() {
    console.log('[GROUND STATE] User clearing errors');
    this.ui.clearErrorLog();
    
    // Also clear errors in state manager
    if (this.stateManager) {
      const currentErrors = this.stateManager.getErrors();
      if (currentErrors && currentErrors.length > 0) {
        // This would typically trigger a server action to clear errors
        // For now, just clear the display
        this.stateManager.setErrors([]);
      }
    }
  }

  // Called when user navigates to character (from app.js)
  connectToCharacter(character) {
    console.log('[GROUND STATE] Connecting monitor to character:', character.name);
    
    // Just load the data from state manager
    this.loadCurrentCharacterData();
    
    // No WebSocket connection needed - we use local state!
    return Promise.resolve(true);
  }

tartMonitoring(characterId) {
  console.log('[MONITOR] User clicked Start Monitoring for:', characterId);
  
  // Update local state
  this.state.setSelectedCharacter(characterId);
  this.state.setMonitoringStatus(true);
  
  // Update UI button states
  this.ui.setMonitoringButtonState(true);
  
  // Start socket monitoring session
  if (this.socketClient) {
    this.socketClient.startMonitoring(characterId);
  }
}

// Add this method too
stopMonitoring() {
  console.log('[MONITOR] User clicked Stop Monitoring');
  
  const characterId = this.state.selectedCharacter;
  if (!characterId) return;
  
  // Update local state
  this.state.setMonitoringStatus(false);
  
  // Update UI button states
  this.ui.setMonitoringButtonState(false);
  
  // Stop socket monitoring session
  if (this.socketClient) {
    this.socketClient.stopMonitoring(characterId);
  }
}

  // Cleanup
  destroy() {
    if (this.stateUpdateHandler && this.stateManager) {
      this.stateManager.off('stateChanged', this.stateUpdateHandler);
      this.stateManager.off('characterLoaded', this.stateUpdateHandler);
    }
  }
}

export default MonitorController;