// public/js/bootstrap.js
// Single Bootstrap Module with Dependency Injection
// This is the ONLY initialization point for the entire application

import { createLogger } from '/js/logger.js';
import stateManager from '/js/modules/state-manager.js';
import GroundStateValidator from '/js/ground-state-validator.js';

// Import module classes (not instances)
import SocketClient from '/js/socket-client.js';
import ConsciousnessManager from '/js/consciousness.js';
import Terminal from '/js/terminal.js';
import DebuggerInterface from '/js/debugger.js';
import MonitorController from '/js/monitor.js';
import RuntimeApp from '/js/app.js';

const logger = createLogger('Bootstrap');

// Immediate debug output to verify module loading
console.log('📦 Bootstrap module imports completed successfully');
console.log('📦 Available imports:', {
  createLogger: typeof createLogger,
  stateManager: typeof stateManager,
  GroundStateValidator: typeof GroundStateValidator,
  SocketClient: typeof SocketClient,
  ConsciousnessManager: typeof ConsciousnessManager,
  Terminal: typeof Terminal,
  DebuggerInterface: typeof DebuggerInterface,
  MonitorController: typeof MonitorController,
  RuntimeApp: typeof RuntimeApp
});

// Simplified Bootstrap - Direct Module Creation with Dependency Injection
// This approach is more reliable than complex async initialization

// Auto-initialize when this module loads
console.log('🚀 Bootstrap module loaded, starting initialization...');

// Simplified initialization - just create modules directly
try {
  console.log('🔧 Creating modules with dependency injection...');

  // 1. StateManager (already exists)
  console.log('1. Using existing stateManager');
  window.stateManager = stateManager;

  // 2. SocketClient
  console.log('2. Creating socketClient');
  const socketClient = new SocketClient({
    stateManager: stateManager,
    logger: createLogger('SocketClient')
  });
  window.socketClient = socketClient;

  // 3. ConsciousnessManager
  console.log('3. Creating consciousness');
  const consciousness = new ConsciousnessManager({
    stateManager: stateManager,
    socketClient: socketClient,
    logger: createLogger('Consciousness')
  });
  window.consciousness = consciousness;

  // 4. Terminal
  console.log('4. Creating terminal');
  const terminal = new Terminal({
    stateManager: stateManager,
    socketClient: socketClient,
    logger: createLogger('Terminal')
  });
  window.terminal = terminal;

  // 5. DebuggerInterface
  console.log('5. Creating debugger');
  const debuggerInterface = new DebuggerInterface({
    stateManager: stateManager,
    consciousness: consciousness,
    logger: createLogger('Debugger')
  });
  window.debugger = debuggerInterface;

  // 6. MonitorController
  console.log('6. Creating monitor');
  const monitor = new MonitorController({
    stateManager: stateManager,
    socketClient: socketClient,
    consciousness: consciousness,
    logger: createLogger('Monitor')
  });
  window.monitor = monitor;

  // 7. RuntimeApp
  console.log('7. Creating app');
  const app = new RuntimeApp({
    stateManager: stateManager,
    socketClient: socketClient,
    consciousness: consciousness,
    monitor: monitor,
    terminal: terminal,
    debugger: debuggerInterface,
    logger: createLogger('App')
  });
  window.app = app;

  console.log('🎉 All modules created successfully!');

  // Fire app ready event
  const event = new CustomEvent('app:ready', {
    detail: { modules: ['stateManager', 'socketClient', 'consciousness', 'terminal', 'debugger', 'monitor', 'app'] }
  });
  document.dispatchEvent(event);
  console.log('🎉 App ready event fired!');

} catch (error) {
  console.error('❌ Bootstrap initialization failed:', error);
  console.error('Error details:', error.stack);
}

export default bootstrap;
