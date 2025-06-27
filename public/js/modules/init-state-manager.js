import stateManager from './state-manager.js';

/* Redux-style action constants */
export const SOCKET_CONNECTED = 'SOCKET_CONNECTED';

// Make state manager available globally (singleton)
if (!window.stateManager) {
  window.stateManager = stateManager;
}

// Bind backward-compat convenience aliases exactly once
if (!window.stateManager.__aliasesBound) {
  window.stateManager.on  = window.stateManager.subscribe.bind(window.stateManager);
  window.stateManager.off = window.stateManager.unsubscribe.bind(window.stateManager);
  window.stateManager.__aliasesBound = true;
}

/* ------------------------------------------------------------------
 * Listen for the global CustomEvent fired by socket-client.js when the
 * shared Socket.IO instance actually connects.  We convert that into a
 * Redux-style action so any module can subscribe via stateManager.
 * ------------------------------------------------------------------ */
window.addEventListener('SOCKET_CONNECTED', () => {
  // Flag for quick checks
  stateManager.connected = true;

  // Dispatch via our simple pub/sub bus
  stateManager.emit(SOCKET_CONNECTED, { connected: true });
});
 
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