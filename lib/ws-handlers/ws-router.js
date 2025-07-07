import registerMonitorHandlers from './monitor-handlers.js';
import registerConsciousnessHandlers from './consciousness-handlers.js';
import registerDebugHandlers from './debug-handlers.js';
import registerAuthenticatedHandlers from './authenticated-handlers.js';

export default function registerSocketHandlers(deps) {
  registerMonitorHandlers(deps);
  registerConsciousnessHandlers(deps);
  registerDebugHandlers(deps);
  registerAuthenticatedHandlers(deps);
  // scenario handlers are attached globally in ws-bootstrap
}
