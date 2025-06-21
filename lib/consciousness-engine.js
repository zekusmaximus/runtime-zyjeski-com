const fs = require('fs').promises;
const path = require('path');
const ProcessSimulator = require('./process-simulator');

class ConsciousnessEngine {
  constructor() {
    this.activeStates = new Map();
    this.simulators = new Map();
  }

  async loadCharacter(characterId) {
    try {
      const filePath = path.join(__dirname, '../data/characters', `${characterId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const character = JSON.parse(data);
      
      // Initialize process simulator for this character
      const simulator = new ProcessSimulator(character);
      this.simulators.set(characterId, simulator);
      this.activeStates.set(characterId, character);
      
      return character;
    } catch (error) {
      throw new Error(`Failed to load character ${characterId}: ${error.message}`);
    }
  }

  async getState(characterId) {
    if (!this.activeStates.has(characterId)) {
      await this.loadCharacter(characterId);
    }
    
    const state = this.activeStates.get(characterId);
    const simulator = this.simulators.get(characterId);
    
    // Update state with current simulation data
    if (simulator) {
      state.consciousness.processes = simulator.getProcesses();
      state.consciousness.memory = simulator.getMemory();
      state.consciousness.system_errors = simulator.getErrors();
      state.consciousness.resources = simulator.getResources();
    }
    
    return state;
  }

  async updateState(characterId, updates) {
    if (!this.activeStates.has(characterId)) {
      await this.loadCharacter(characterId);
    }
    
    const state = this.activeStates.get(characterId);
    const simulator = this.simulators.get(characterId);
    
    // Apply updates to the state
    Object.assign(state.consciousness, updates);
    
    // Update simulator if needed
    if (simulator) {
      simulator.applyUpdates(updates);
    }
    
    this.activeStates.set(characterId, state);
    return state;
  }

  async getProcesses(characterId) {
    const state = await this.getState(characterId);
    return state.consciousness.processes || [];
  }

  async getMemory(characterId) {
    const state = await this.getState(characterId);
    return state.consciousness.memory || {};
  }

  async getErrors(characterId) {
    const state = await this.getState(characterId);
    return state.consciousness.system_errors || [];
  }

  async getResources(characterId) {
    const state = await this.getState(characterId);
    return state.consciousness.resources || {};
  }

  // Simulate consciousness updates over time
  startSimulation(characterId) {
    const simulator = this.simulators.get(characterId);
    if (simulator) {
      simulator.start();
    }
  }

  stopSimulation(characterId) {
    const simulator = this.simulators.get(characterId);
    if (simulator) {
      simulator.stop();
    }
  }

  // Get all active characters
  getActiveCharacters() {
    return Array.from(this.activeStates.keys());
  }
}

// Export singleton instance
module.exports = new ConsciousnessEngine();