// public/js/modules/socket-client.js - GROUND STATE COMPLIANT
// This module imports and re-exports the main Ground State socket client
// All legacy socket client code has been removed to prevent conflicts

console.log('[Ground State] Loading socket client wrapper module');

// Use the main Ground State compliant socket client
// This ensures only one socket client instance exists throughout the app
const socketClient = window.socketClient;

if (!socketClient) {
  console.error('[Ground State] Main socket client not available. Make sure /js/socket-client.js is loaded first.');
  throw new Error('Main socket client not available');
}

console.log('[Ground State] Socket client wrapper loaded, using shared instance');

// Export the same instance - no new connections or auto-connections
export default socketClient;