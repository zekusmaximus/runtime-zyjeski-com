import { ConsciousnessEngine } from './consciousness-engine.js';
import ScenarioEngine from './scenario-engine.js';
import { info, error } from './logger.js';
import registerSocketHandlers from './ws-handlers/ws-router.js';
import registerScenarioHandlers from './ws-handlers/scenario-handlers.js';

// Create singleton engine instances
const consciousnessEngine = new ConsciousnessEngine();
const scenarioEngine = new ScenarioEngine({
  watch: process.env.NODE_ENV !== 'production'
});

let isEngineInitialized = false;
async function ensureEngineInitialized() {
  if (!isEngineInitialized) {
    await consciousnessEngine.initialize();
    await scenarioEngine.initialize();
    scenarioEngine.attach(consciousnessEngine);
    isEngineInitialized = true;
    info('Consciousness engine initialized successfully');
  }
}

class WebSocketHandlers {
  constructor() {
    this.connectedSockets = new Map();
    this.io = null;
    this.setupEngineListeners();
    // Scenario events are routed once at startup
    registerScenarioHandlers({ scenarioEngine, handlers: this });
  }

  setupEngineListeners() {
    consciousnessEngine.on('consciousness-update', data => {
      console.log('Received consciousness-update event', data);
      this.broadcastConsciousnessUpdate(data);
    });

    consciousnessEngine.on('monitoringStarted', data => {
      const socket = this.io?.sockets.sockets.get(data.socketId);
      if (socket) {
        socket.emit('monitoring-started', {
          characterId: data.characterId,
          message: `Started monitoring ${data.characterId}`,
          initialState: data.initialState
        });
        socket.emit('consciousness-update', {
          characterId: data.characterId,
          state: data.initialState,
          timestamp: Date.now(),
          type: 'monitoring-started'
        });
      }
    });

    consciousnessEngine.on('monitoringStopped', data => {
      const socket = this.io?.sockets.sockets.get(data.socketId);
      if (socket) {
        socket.emit('monitoring-stopped', {
          characterId: data.characterId,
          duration: data.duration
        });
      }
    });

    consciousnessEngine.on('debug-command-executed', data => {
      this.broadcastDebugResult(data);
    });

    consciousnessEngine.on('debug-hook-triggered', data => {
      this.broadcastDebugHook(data);
    });
  }

  initializeHandlers(socket, io) {
    this.io = io;
    this.connectedSockets.set(socket.id, {
      characterId: null,
      isMonitoring: false,
      joinedRooms: new Set()
    });

    registerSocketHandlers({
      socket,
      io,
      handlers: this,
      consciousnessEngine,
      scenarioEngine,
      ensureEngineInitialized
    });
  }

  broadcastConsciousnessUpdate(data) {
    if (!this.io) return;
    const room = `character-${data.characterId}`;
    this.io.to(room).emit('consciousness-update', {
      characterId: data.characterId,
      state: data.state,
      timestamp: data.timestamp,
      type: data.type || 'simulation-update',
      reason: data.reason
    });
  }

  sendRealTimeUpdate(data) {
    if (!this.io || !data.socketId) return;
    const target = this.io.sockets.sockets.get(data.socketId);
    if (target) {
      target.emit('consciousness-update', {
        characterId: data.characterId,
        consciousness: data.consciousness,
        timestamp: data.timestamp,
        type: data.type || 'real-time'
      });
    } else {
      consciousnessEngine.stopMonitoring(data.socketId);
    }
  }

  broadcastDebugResult(data) {
    if (!this.io) return;
    const room = `character-${data.characterId}`;
    this.io.to(room).emit('debug-command-broadcast', {
      characterId: data.characterId,
      command: data.command,
      result: data.result,
      timestamp: data.timestamp
    });
  }

  broadcastDebugHook(data) {
    if (!this.io) return;
    const room = `debug-${data.characterId}`;
    this.io.to(room).emit('debug-hook-triggered', {
      characterId: data.characterId,
      hook: data.hook,
      timestamp: data.timestamp
    });
  }

  broadcastSystemMessage(message, type = 'info') {
    if (!this.io) return;
    this.io.emit('system-message', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  broadcastBreakpoint(data) {
    if (!this.io) return;
    const room = `character-${data.characterId}`;
    this.io.to(room).emit('breakpoint-triggered', {
      characterId: data.characterId,
      breakpoint: data.breakpoint,
      timestamp: data.timestamp
    });
  }

  broadcastScenarioEvent(event, data) {
    if (!this.io) return;
    const room = `character-${data.characterId}`;
    this.io.to(room).emit(event, data);
  }

  getConnectedSockets() {
    return Array.from(this.connectedSockets.entries()).map(([socketId, info]) => ({
      socketId,
      ...info
    }));
  }

  getSocketsMonitoringCharacter(characterId) {
    return Array.from(this.connectedSockets.entries())
      .filter(([_, info]) => info.characterId === characterId && info.isMonitoring)
      .map(([socketId]) => socketId);
  }

  performHealthCheck() {
    const connectedCount = this.connectedSockets.size;
    const monitoringCount = Array.from(this.connectedSockets.values()).filter(i => i.isMonitoring).length;
    const activeCharacters = consciousnessEngine.getAllActiveCharacters();
    return {
      connectedSockets: connectedCount,
      activeMonitoring: monitoringCount,
      activeCharacters: activeCharacters.length,
      characters: activeCharacters,
      timestamp: new Date().toISOString()
    };
  }
}

const handlers = new WebSocketHandlers();
export default handlers;
export { consciousnessEngine };
