import MonitorState from './monitor-state.js';
import MonitorUI from './monitor-ui.js';
import MonitorSocket from './monitor-socket.js';

export default class MonitorController {
  constructor() {
    this.state = new MonitorState();
    this.ui = new MonitorUI();
    this.socket = null;
    this.currentCharacter = null;
    this.monitoring = false;
  }

  init() {
    console.log('[MONITOR CONTROLLER] Initializing monitor controller...');
    
    if (window.socketClient) {
      this.socket = new MonitorSocket(window.socketClient, {
        onConsciousnessUpdate: (d) => this.handleUpdate(d),
        onSystemResources: (d) => this.handleResources(d),
        onErrorLogs: (d) => this.handleErrors(d),
        onMemoryAllocation: (d) => this.handleMemory(d),
        onMonitoringStarted: () => console.log('monitoring started'),
        onMonitoringStopped: () => console.log('monitoring stopped')
      });
      this.socket.bindEvents();
    }
    this.bindUIActions();
    
    // Initialize monitor in disconnected/empty state
    this.showDisconnectedState();
  }

  displayCharacterData(characterData) {
    if (!characterData) {
      console.log('Monitor: No character data provided');
      this.showDisconnectedState();
      return;
    }
    
    console.log('Monitor: Displaying character data for:', characterData.name);
    console.log('Monitor: Character data:', characterData);
    
    // Extract consciousness data
    const consciousness = characterData.consciousness || characterData;
    
    // Set the character in the dropdown
    const select = document.getElementById('characterSelect');
    if (select) {
      select.value = characterData.id;
      this.currentCharacter = characterData.id;
      console.log('Monitor: Set character selection to:', characterData.id);
    }
    
    console.log('Monitor: Consciousness data:', consciousness);
    
    // Display processes
    if (consciousness.processes) {
      console.log('Monitor: Found processes:', consciousness.processes);
      this.handleUpdate({ processes: consciousness.processes });
    }
    
    // Display system resources - use 'resources' not 'systemResources'
    if (consciousness.resources) {
      console.log('Monitor: Found resources:', consciousness.resources);
      this.handleResources({ resources: consciousness.resources });
    } else {
      console.log('Monitor: No resources found');
    }
    
    // Display memory data - extract from resources.memory since consciousness.memory doesn't exist
    if (consciousness.memory) {
      console.log('Monitor: Found consciousness.memory:', consciousness.memory);
      this.handleMemory({ memoryData: consciousness.memory });
    } else if (consciousness.resources && consciousness.resources.memory) {
      console.log('Monitor: Found memory in resources:', consciousness.resources.memory);
      console.log('Monitor: Calling handleMemory with resources.memory');
      this.handleMemory({ memoryData: consciousness.resources.memory });
    } else {
      console.log('Monitor: No memory found anywhere');
      console.log('Monitor: consciousness.resources exists:', !!consciousness.resources);
      console.log('Monitor: consciousness.resources.memory exists:', !!(consciousness.resources && consciousness.resources.memory));
      // Force display empty memory panel
      this.handleMemory({ memoryData: null });
    }
    
    // Display any errors
    if (consciousness.system_errors) {
      console.log('Monitor: Found system errors:', consciousness.system_errors);
      this.handleErrors({ errors: consciousness.system_errors });
    } else {
      console.log('Monitor: No system_errors found');
    }
    
    console.log('Monitor loaded character data:', characterData.name);
  }

  bindUIActions() {
    if (this.ui.refreshBtn) {
      this.ui.refreshBtn.addEventListener('click', () => this.refresh());
    }
    
    // Hide the monitoring toggle button since we don't need active monitoring
    if (this.ui.toggleBtn) {
      this.ui.toggleBtn.style.display = 'none';
    }
    
    const select = document.getElementById('characterSelect');
    if (select) {
      select.addEventListener('change', (e) => {
        this.currentCharacter = e.target.value || null;
        if (this.currentCharacter) {
          this.loadCharacterFromAPI(this.currentCharacter);
        }
      });
    }
    const clearBtn = document.getElementById('clearErrors');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.state.update({ errors: [] });
        this.ui.updateErrors([]);
      });
    }
  }

  start() {
    if (!this.currentCharacter || !this.socket) return;
    this.socket.startMonitoring(this.currentCharacter);
    this.monitoring = true;
  }

  stop() {
    if (!this.currentCharacter || !this.socket) return;
    this.socket.stopMonitoring(this.currentCharacter);
    this.monitoring = false;
  }

  toggleMonitoring() {
    if (this.monitoring) {
      this.stop();
    } else {
      this.start();
    }
  }

  refresh() {
    // Refresh by reloading current character data
    if (this.currentCharacter) {
      this.loadCharacterFromAPI(this.currentCharacter);
    } else if (window.app && window.app.currentCharacter) {
      this.displayCharacterData(window.app.currentCharacter);
    } else {
      console.log('No character selected to refresh');
    }
  }

  async loadCharacterFromAPI(characterId) {
    try {
      const response = await fetch(`/api/consciousness/${characterId}/state`);
      if (response.ok) {
        const characterData = await response.json();
        this.displayCharacterData(characterData);
        console.log('Monitor refreshed with latest data for:', characterData.name);
      } else {
        console.error('Failed to refresh character data:', response.statusText);
      }
    } catch (error) {
      console.error('Error refreshing character data:', error);
    }
  }

  handleUpdate(data) {
    this.state.update(data.consciousness || data);
    this.ui.updateProcesses(this.state.processes);
    this.ui.updateResources(this.state.resources);
    this.ui.updateMemory(this.state.memory);
    this.ui.updateErrors(this.state.errors);
    if (this.state.lastUpdate) {
      this.ui.updateTimestamp(this.state.lastUpdate);
    }
  }

  handleResources(data) {
    this.state.update({ resources: data.resources });
    this.ui.updateResources(this.state.resources);
  }

  handleErrors(data) {
    this.state.update({ errors: data.errors });
    this.ui.updateErrors(this.state.errors);
  }

  handleMemory(data) {
    console.log('Monitor: handleMemory called with:', data);
    this.state.update({ memory: data.memoryData });
    console.log('Monitor: State updated, calling UI updateMemory with:', this.state.memory);
    this.ui.updateMemory(this.state.memory);
    console.log('Monitor: UI updateMemory completed');
  }

  showDisconnectedState() {
    console.log('[MONITOR CONTROLLER] Showing disconnected state');
    
    // Clear character selection
    const select = document.getElementById('characterSelect');
    if (select) {
      select.value = '';
    }
    
    // Show disconnected message in all panels
    this.ui.updateProcesses([]);
    this.ui.updateResources(null);
    this.ui.updateMemory(null);
    this.ui.updateErrors([]);
    
    // Update connection status
    const connectionStatus = document.getElementById('connectionStatus');
    if (connectionStatus) {
      connectionStatus.textContent = 'No Consciousness Connected';
      connectionStatus.className = 'connection-status disconnected';
    }
    
    // Disable controls
    const refreshBtn = document.getElementById('refreshMonitor');
    const toggleBtn = document.getElementById('toggleMonitoring');
    if (refreshBtn) refreshBtn.disabled = true;
    if (toggleBtn) toggleBtn.disabled = true;
    
    this.currentCharacter = null;
    console.log('[MONITOR CONTROLLER] Monitor reset to disconnected state');
  }

  connectToCharacter(characterData) {
    console.log('[MONITOR CONTROLLER] Connecting to character:', characterData.name);
    this.displayCharacterData(characterData);
    
    // Enable controls
    const refreshBtn = document.getElementById('refreshMonitor');
    const toggleBtn = document.getElementById('toggleMonitoring');
    if (refreshBtn) refreshBtn.disabled = false;
    if (toggleBtn) toggleBtn.disabled = false;
    
    // Update connection status
    const connectionStatus = document.getElementById('connectionStatus');
    if (connectionStatus) {
      connectionStatus.textContent = `Connected to ${characterData.name}`;
      connectionStatus.className = 'connection-status connected';
    }
  }
}
