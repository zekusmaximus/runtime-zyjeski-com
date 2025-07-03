// public/js/bootstrap.js
// Single Bootstrap Module with Dependency Injection
// This is the ONLY initialization point for the entire application

import { createLogger } from './logger.js';
import './state-manager.js'; // This creates window.stateManager
import GroundStateValidator from './ground-state-validator.js';

// Import module classes (not instances)
import SocketClient from './socket-client.js';
import ConsciousnessManager from './consciousness.js';
import Terminal from './terminal.js';
import DebuggerInterface from './debugger.js';
import MonitorController from './monitor.js';
import RuntimeApp from './app.js';
import { ConsciousnessTransformer } from './utils/ConsciousnessTransformer.js';
import ResourceMeter from './components/ResourceMeter.js';

const logger = createLogger('Bootstrap');

// Immediate debug output to verify module loading
console.log('📦 Bootstrap module imports completed successfully');
console.log('📦 Available imports:', {
  createLogger: typeof createLogger,
  stateManager: typeof window.stateManager,
  GroundStateValidator: typeof GroundStateValidator,
  SocketClient: typeof SocketClient,
  ConsciousnessManager: typeof ConsciousnessManager,
  ConsciousnessTransformer: typeof ConsciousnessTransformer,
  Terminal: typeof Terminal,
  DebuggerInterface: typeof DebuggerInterface,
  MonitorController: typeof MonitorController,
  RuntimeApp: typeof RuntimeApp,
  ResourceMeter: typeof ResourceMeter
});

// Simplified Bootstrap - Direct Module Creation with Dependency Injection
// This approach is more reliable than complex async initialization

// Auto-initialize when this module loads
console.log('🚀 Bootstrap module loaded, starting initialization...');

// Simplified initialization - just create modules directly
try {
  console.log('🔧 Creating modules with dependency injection...');

  // 1. StateManager (already exists from import)
  console.log('1. Using existing stateManager');
  const stateManager = window.stateManager;

  if (!stateManager) {
    throw new Error('StateManager not available - check state-manager.js import');
  }

  // 2. SocketClient
  console.log('2. Creating socketClient');
  const socketClient = new SocketClient({
    stateManager: stateManager,
    logger: createLogger('SocketClient')
  });
  window.socketClient = socketClient;

  // 3. ConsciousnessTransformer
  console.log('3. Creating consciousnessTransformer');
  const consciousnessTransformer = new ConsciousnessTransformer({
    enableCaching: true,
    cacheTimeout: 60000,
    maxCacheSize: 100
  });
  window.consciousnessTransformer = consciousnessTransformer;

  // 4. ConsciousnessManager
  console.log('4. Creating consciousness');
  const consciousness = new ConsciousnessManager({
    stateManager: stateManager,
    socketClient: socketClient,
    transformer: consciousnessTransformer,
    logger: createLogger('Consciousness')
  });
  window.consciousness = consciousness;

  // 5. Terminal
  console.log('5. Creating terminal');
  const terminal = new Terminal({
    stateManager: stateManager,
    socketClient: socketClient,
    logger: createLogger('Terminal')
  });
  window.terminal = terminal;

  // 6. DebuggerInterface
  console.log('6. Creating debugger');
  const debuggerInterface = new DebuggerInterface({
    stateManager: stateManager,
    consciousness: consciousness,
    logger: createLogger('Debugger')
  });
  window.debuggerInterface = debuggerInterface;

  // 7. MonitorController
  console.log('7. Creating monitor');
  const monitor = new MonitorController({
    stateManager: stateManager,
    socketClient: socketClient,
    consciousness: consciousness,
    logger: createLogger('Monitor')
  });
  window.monitor = monitor;

  // 8. Make ResourceMeter available globally
  console.log('8. Making ResourceMeter available globally');
  window.ResourceMeter = ResourceMeter;

  // 9. RuntimeApp
  console.log('9. Creating app');
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
    detail: { modules: ['stateManager', 'socketClient', 'consciousnessTransformer', 'consciousness', 'terminal', 'debugger', 'monitor', 'app'] }
  });
  document.dispatchEvent(event);
  console.log('🎉 App ready event fired!');

} catch (error) {
  console.error('❌ Bootstrap initialization failed:', error);
  console.error('Error details:', error.stack);
}

// Export bootstrap info for debugging
const bootstrap = {
  initialized: true,
  modules: ['stateManager', 'socketClient', 'consciousnessTransformer', 'consciousness', 'terminal', 'debuggerInterface', 'monitor', 'app']
};

export default bootstrap;
