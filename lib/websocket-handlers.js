import { ConsciousnessEngine } from './consciousness-engine.js';
import ScenarioEngine from './scenario-engine.js';
import { info, error } from './logger.js';


// Create singleton instance
const consciousnessEngine = new ConsciousnessEngine();
const scenarioEngine = new ScenarioEngine({
  watch: process.env.NODE_ENV !== 'production'
});

// Track initialization state
let isEngineInitialized = false;

// Initialize the engine
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
    this.connectedSockets = new Map(); // socketId -> { characterId, isMonitoring }
    this.io = null; // Will be set in initializeHandlers
    this.setupEngineListeners();
  }
  
  setupEngineListeners() {
    // Listen for consciousness engine events and broadcast them
    consciousnessEngine.on('consciousnessUpdate', (data) => {
      this.sendRealTimeUpdate(data);
    });

    consciousnessEngine.on('monitoringStarted', (data) => {
      const socket = this.io?.sockets.sockets.get(data.socketId);
      if (socket) {
        socket.emit('monitoring-started', {
          characterId: data.characterId,
          message: `Started monitoring ${data.characterId}`,
          initialState: data.initialState
        });
        
        // CRITICAL: Send the initial consciousness-update immediately
        socket.emit('consciousness-update', {
          characterId: data.characterId,
          state: data.initialState,
          timestamp: Date.now(),
          type: 'monitoring-started'
        });
      }
    });

    consciousnessEngine.on('monitoringStopped', (data) => {
      const socket = this.io?.sockets.sockets.get(data.socketId);
      if (socket) {
        socket.emit('monitoring-stopped', {
          characterId: data.characterId,
          duration: data.duration
        });
      }
    });

    // Keep your existing debug and scenario listeners
    consciousnessEngine.on('debug-command-executed', (data) => {
      this.broadcastDebugResult(data);
    });

    consciousnessEngine.on('debug-hook-triggered', (data) => {
      this.broadcastDebugHook(data);
    });

    scenarioEngine.on('scenarioStarted', (data) => {
      this.broadcastScenarioEvent('scenario-started', data);
    });
    scenarioEngine.on('scenarioCompleted', (data) => {
      this.broadcastScenarioEvent('scenario-completed', data);
    });
  }

  initializeHandlers(socket, io) {
    this.io = io;
    
    // Store socket connection info
    this.connectedSockets.set(socket.id, {
      characterId: null,
      isMonitoring: false,
      joinedRooms: new Set()
    });    // Handle consciousness monitoring requests
    socket.on('start-monitoring', async (data) => {
  try {
    const { characterId } = data;
    
    if (!characterId) {
      socket.emit('error', { message: 'Character ID required' });
      return;
    }

    info('Starting character monitoring', { characterId, socketId: socket.id });
    
    // Ensure engine is initialized before proceeding
    await ensureEngineInitialized();
    
    // Load character if not already loaded
    await consciousnessEngine.loadCharacter(characterId);
    
    // CRITICAL: Start monitoring with socket ID
    const result = await consciousnessEngine.startMonitoring(characterId, socket.id);
    
    // Update socket tracking
    const socketInfo = this.connectedSockets.get(socket.id);
    socketInfo.characterId = characterId;
    socketInfo.isMonitoring = true;
    
    // Join character-specific room for broadcasts
    const roomName = `character-${characterId}`;
    socket.join(roomName);
    socketInfo.joinedRooms.add(roomName);
    
    info('Character monitoring started successfully', result);
    
  } catch (err) {
    error('Error starting character monitoring', { error: err, characterId: data.characterId });
    
    socket.emit('error', { 
      message: `Failed to start monitoring: ${err.message}` 
    });
  }
});

    // Handle stop monitoring
    socket.on('stop-monitoring', (data) => {
      try {
        const { characterId } = data;
        const socketInfo = this.connectedSockets.get(socket.id);
          if (socketInfo && socketInfo.characterId === characterId) {
          consciousnessEngine.stopMonitoring(characterId, socket.id);
          
          socketInfo.isMonitoring = false;
          socketInfo.characterId = null;
          
          // Leave character room
          const roomName = `character-${characterId}`;
          socket.leave(roomName);
          socketInfo.joinedRooms.delete(roomName);
          
          socket.emit('monitoring-stopped', { 
            characterId,
            message: `Monitoring stopped for ${characterId}` 
          });
        }
      } catch (err) {
        error('Error stopping monitoring', { error: err, characterId });
        socket.emit('error', { 
          message: `Failed to stop monitoring: ${err.message}` 
        });
      }
    });    // Handle debug commands
    socket.on('debug-command', async (data) => {
      try {
        const { characterId, command, args } = data;
        
        if (!characterId || !command) {
          socket.emit('error', { message: 'Character ID and command required' });
          return;
        }
        
        info('Executing debug command', { command, characterId });
        
        // Ensure engine is initialized before proceeding
        await ensureEngineInitialized();
        
        const result = await consciousnessEngine.executeDebugCommand(characterId, command, args);
        
        socket.emit('debug-result', {
          characterId,
          command,
          success: true,
          result: result,
          timestamp: new Date().toISOString()
        });

        if (['step_into', 'step_over', 'continue', 'break_all'].includes(command)) {
          socket.emit('debug-session-started', {
            sessionId: result.sessionId || `debug-${characterId}-${Date.now()}`,
            characterId,
            command,
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (err) {
        error('Error executing debug command', { error: err, command, characterId });
        
        socket.emit('debug-result', {
          characterId: data.characterId,
          command: data.command,
          success: false,
          result: {
            error: err.message
          },
          timestamp: new Date().toISOString()
        });
      }
    });    // Handle player interventions
    socket.on('player-intervention', async (data) => {
      try {
        const { characterId, intervention } = data;
        
        if (!characterId || !intervention) {
          socket.emit('error', { message: 'Character ID and intervention required' });
          return;
        }

        info('Applying player intervention', { characterId, interventionType: intervention.type });
        
        // Ensure engine is initialized before proceeding
        await ensureEngineInitialized();
        
        const result = await consciousnessEngine.applyPlayerIntervention(characterId, intervention);
        
        socket.emit('intervention-applied', {
          characterId,
          intervention,
          result,
          success: true,
          timestamp: new Date().toISOString()
        });
        
      } catch (err) {
        error('Error applying player intervention', { error: err, characterId: data.characterId, interventionType: data.intervention?.type });
        
        socket.emit('intervention-applied', {
          characterId: data.characterId,
          intervention: data.intervention,
          result: null,
          success: false,
          error: err.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle manual consciousness update trigger
    socket.on('request-update', async (data) => {
      try {
        const { characterId, reason } = data;
        
        if (!characterId) {
          socket.emit('error', { message: 'Character ID required' });
          return;
        }

        info('Manual update requested', { characterId, reason: reason || 'user-request' });
        
        consciousnessEngine.triggerUpdate(characterId, reason || 'user-request');
        
      } catch (err) {
        error('Error triggering manual update', { error: err, characterId });
        socket.emit('error', { 
          message: `Failed to trigger update: ${err.message}` 
        });
      }
    });

    // Handle auto-updates toggle
    socket.on('toggle-auto-updates', (data) => {
      try {
        const { characterId, enabled } = data;
        
        if (!characterId) {
          socket.emit('error', { message: 'Character ID required' });
          return;
        }

        info('Auto-updates status changed', { enabled, characterId });
        
        consciousnessEngine.setAutoUpdates(characterId, enabled);
        
        socket.emit('auto-updates-toggled', {
          characterId,
          enabled,
          message: `Auto-updates ${enabled ? 'enabled' : 'disabled'} for ${characterId}`
        });
        
      } catch (err) {
        error('Error toggling auto-updates', { error: err, characterId, enabled });
        socket.emit('error', { 
          message: `Failed to toggle auto-updates: ${err.message}` 
        });
      }
    });

    // Emit system resources
    socket.on('get-system-resources', async () => {
      try {
        const socketInfo = this.connectedSockets.get(socket.id);
        if (!socketInfo || !socketInfo.characterId) {
          socket.emit('error', { message: 'No character being monitored' });
          return;
        }

        // Get the consciousness instance for this character
        const instance = consciousnessEngine.instances.get(socketInfo.characterId);
        if (!instance || !instance.processManager) {
          socket.emit('error', { message: 'Character instance not found' });
          return;
        }

        const resources = instance.processManager.getSystemResourceUsage();
        socket.emit('system-resources', {
          resources,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        error('Error fetching system resources', { error: err });
        socket.emit('error', { message: `Failed to fetch system resources: ${err.message}` });
      }
    });

    // Emit error logs
    socket.on('get-error-logs', async () => {
      try {
        const socketInfo = this.connectedSockets.get(socket.id);
        if (!socketInfo || !socketInfo.characterId) {
          socket.emit('error', { message: 'No character being monitored' });
          return;
        }

        // Get errors using the consciousness engine's getErrors method
        const errors = await consciousnessEngine.getErrors(socketInfo.characterId);
        socket.emit('error-logs', {
          errors,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        error('Error fetching error logs', { error: err });
        socket.emit('error', { message: `Failed to fetch error logs: ${err.message}` });
      }
    });

    // Emit memory allocation data
    socket.on('get-memory-allocation', async () => {
      try {
        const socketInfo = this.connectedSockets.get(socket.id);
        if (!socketInfo || !socketInfo.characterId) {
          socket.emit('error', { message: 'No character being monitored' });
          return;
        }

        // Get the consciousness instance for this character
        const instance = consciousnessEngine.instances.get(socketInfo.characterId);
        if (!instance || !instance.memoryManager) {
          socket.emit('error', { message: 'Character instance not found' });
          return;
        }

        const memoryData = instance.memoryManager.getMemoryDataForFrontend();
        socket.emit('memory-allocation', {
          memoryData,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        error('Error fetching memory allocation data', { error: err });
        socket.emit('error', { message: `Failed to fetch memory allocation data: ${err.message}` });
      }
    });

    // Handle socket disconnection
    socket.on('disconnect', (reason) => {
      info('Socket disconnected', { socketId: socket.id, reason });
      
      const socketInfo = this.connectedSockets.get(socket.id);
      if (socketInfo && socketInfo.isMonitoring) {
        consciousnessEngine.stopMonitoring(socketInfo.characterId, socket.id);
      }
      
      this.connectedSockets.delete(socket.id);
    });
  }

  // Broadcast consciousness updates to all monitoring sockets
  broadcastConsciousnessUpdate(data) {
    if (!this.io) return;
    
    const roomName = `character-${data.characterId}`;
    
    this.io.to(roomName).emit('consciousness-update', {
      characterId: data.characterId,
      state: data.state,
      timestamp: data.timestamp,
      type: data.type || 'simulation-update',
      reason: data.reason
    });
  }

  sendRealTimeUpdate(data) {
  if (!this.io || !data.socketId) return;
  
  const targetSocket = this.io.sockets.sockets.get(data.socketId);
  if (targetSocket) {
    targetSocket.emit('consciousness-update', {
      characterId: data.characterId,
      state: data.state,
      timestamp: data.timestamp,
      type: data.type || 'real-time'
    });
  } else {
    // Socket no longer exists, tell consciousness engine to stop monitoring
    consciousnessEngine.stopMonitoring(data.socketId);
  }
}

  broadcastDebugResult(data) {
    if (!this.io) return;
    
    const roomName = `character-${data.characterId}`;
    this.io.to(roomName).emit('debug-command-broadcast', {
      characterId: data.characterId,
      command: data.command,
      result: data.result,
      timestamp: data.timestamp
    });
  }

  broadcastDebugHook(data) {
    if (!this.io) return;
    
    const debugRoom = `debug-${data.characterId}`;
    this.io.to(debugRoom).emit('debug-hook-triggered', {
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
    
    const roomName = `character-${data.characterId}`;
    this.io.to(roomName).emit('breakpoint-triggered', {
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

  // Utility methods
  getConnectedSockets() {
    return Array.from(this.connectedSockets.entries()).map(([socketId, info]) => ({
      socketId,
      ...info
    }));
  }

  getSocketsMonitoringCharacter(characterId) {
    return Array.from(this.connectedSockets.entries())
      .filter(([_, info]) => info.characterId === characterId && info.isMonitoring)
      .map(([socketId, _]) => socketId);
  }

  performHealthCheck() {
    const connectedCount = this.connectedSockets.size;
    const monitoringCount = Array.from(this.connectedSockets.values())
      .filter(info => info.isMonitoring).length;
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

// Export both the handlers and the consciousness engine for API routes
export default handlers;
export { consciousnessEngine };
