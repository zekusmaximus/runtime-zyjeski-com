import stateManager from './state-manager.js';

// Make state manager available globally for debugging
window.stateManager = stateManager;

// Initialize when consciousness manager loads a character
window.addEventListener('consciousnessLoaded', (event) => {
  const characterId = event.detail?.characterId;
  if (characterId) {
    console.log('[INIT] Loading character into state manager:', characterId);
    stateManager.loadCharacter(characterId);
  }
});

console.log('🎯 State Manager initialized and available as window.stateManager');

export default stateManager;