const ConsciousnessEngine = require('./consciousness-engine');

class WebSocketHandlers {
  constructor() {
    this.connectedSockets = new Map(); // socketId -> { characterId, isMonitoring }
    this.setupEngineListeners();
  }

  setupEngineListeners() {
    // Listen for consciousness updates from the engine
    ConsciousnessEngine.on('consciousness-updated', (data) => {
      this.broadcastConsciousnessUpdate(data);
    });

    ConsciousnessEngine.on('real-time-update', (data) => {
      this.sendRealTimeUpdate(data);
    });

    ConsciousnessEngine.on('debug-command-executed', (data) => {
      this.broadcastDebugResult(data);
    });

    ConsciousnessEngine.on('debug-hook-triggered', (data) => {
      this.broadcastDebugHook(data);
    });
  }

  initializeHandlers(socket, io) {
    this.io = io;
    
    // Store socket connection info
    this.connectedSockets.set(socket.id, {
      characterId: null,
      isMonitoring: false,
      joinedRooms: new Set()
    });

    // Handle consciousness monitoring requests
    socket.on('start-monitoring', async (data) => {
      try {
        const { characterId } = data;
        
        if (!characterId) {
          socket.emit('error', { message: 'Character ID required' });
          return;
        }

        console.log(`Starting monitoring for character: ${characterId} (socket: ${socket.id})`);
        
        // Load character if not already loaded
        await ConsciousnessEngine.loadCharacter(characterId);
        
        // Start monitoring with this socket
        ConsciousnessEngine.startMonitoring(characterId, socket.id);
        
        // Update socket info
        const socketInfo = this.connectedSockets.get(socket.id);
        socketInfo.characterId = characterId;
        socketInfo.isMonitoring = true;
        
        // Join character room for targeted updates
        const roomName = `character-${characterId}`;
        socket.join(roomName);
        socketInfo.joinedRooms.add(roomName);
        
        socket.emit('monitoring-started', { 
          characterId,
          message: `Monitoring started for ${characterId}` 
        });
        
      } catch (error) {
        console.error('Error starting monitoring:', error);
        socket.emit('error', { 
          message: `Failed to start monitoring: ${error.message}` 
        });
      }
    });

    // Handle stop monitoring
    socket.on('stop-monitoring', (data) => {
      try {
        const { characterId } = data;
        const socketInfo = this.connectedSockets.get(socket.id);
        
        if (socketInfo && socketInfo.characterId === characterId) {
          ConsciousnessEngine.stopMonitoring(characterId, socket.id);
          
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
      } catch (error) {
        console.error('Error stopping monitoring:', error);
        socket.emit('error', { 
          message: `Failed to stop monitoring: ${error.message}` 
        });
      }
    });

    // UPDATED: Handle debug commands that trigger consciousness updates
    socket.on('debug-command', async (data) => {
      try {
        const { characterId, command, args } = data;
        
        if (!characterId || !command) {
          socket.emit('error', { message: 'Character ID and command required' });
          return;
        }

        console.log(`Executing debug command: ${command} for ${characterId}`);
        
        const result = await ConsciousnessEngine.executeDebugCommand(characterId, command, args);
        
        // FIXED: Send result in the format terminal/debugger expects
        socket.emit('debug-result', {
          characterId,
          command,
          success: true,
          result: result,
          timestamp: new Date().toISOString()
        });

        // ADDED: Start debug session event for debugger interface
        if (['step_into', 'step_over', 'continue', 'break_all'].includes(command)) {
          socket.emit('debug-session-started', {
            sessionId: result.sessionId || `debug-${characterId}-${Date.now()}`,
            characterId,
            command,
            timestamp: new Date().toISOString()
          });
        }
        
      } catch (error) {
        console.error('Error executing debug command:', error);
        
        // FIXED: Send error in the format terminal/debugger expects
        socket.emit('debug-result', {
          characterId: data.characterId,
          command: data.command,
          success: false,
          result: {
            error: error.message
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    // UPDATED: Handle player interventions that trigger consciousness updates
   socket.on('player-intervention', async (data) => {
  try {
    const { characterId, intervention } = data;
    
    if (!characterId || !intervention) {
      socket.emit('error', { message: 'Character ID and intervention required' });
      return;
    }

    console.log(`Applying player intervention for ${characterId}:`, intervention.type);
    
    const result = await ConsciousnessEngine.applyPlayerIntervention(characterId, intervention);
    
    // FIXED: Send proper response format
    socket.emit('intervention-applied', {
      characterId,
      intervention,
      result,
      success: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error applying player intervention:', error);
    
    // FIXED: Send error response with proper format
    socket.emit('intervention-applied', {
      characterId: data.characterId,
      intervention: data.intervention,
      result: null,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

    // ADDED: Manual consciousness update trigger
    socket.on('request-update', async (data) => {
      try {
        const { characterId, reason } = data;
        
        if (!characterId) {
          socket.emit('error', { message: 'Character ID required' });
          return;
        }

        console.log(`Manual update requested for ${characterId}: ${reason || 'user-request'}`);
        
        // Trigger a consciousness update
        ConsciousnessEngine.triggerUpdate(characterId, reason || 'user-request');
        
      } catch (error) {
        console.error('Error triggering manual update:', error);
        socket.emit('error', { 
          message: `Failed to trigger update: ${error.message}` 
        });
      }
    });

    // ADDED: Toggle auto-updates
    socket.on('toggle-auto-updates', (data) => {
      try {
        const { characterId, enabled } = data;
        
        if (!characterId) {
          socket.emit('error', { message: 'Character ID required' });
          return;
        }

        console.log(`${enabled ? 'Enabling' : 'Disabling'} auto-updates for ${characterId}`);
        
        ConsciousnessEngine.setAutoUpdates(characterId, enabled);
        
        socket.emit('auto-updates-toggled', {
          characterId,
          enabled,
          message: `Auto-updates ${enabled ? 'enabled' : 'disabled'} for ${characterId}`
        });
        
      } catch (error) {
        console.error('Error toggling auto-updates:', error);
        socket.emit('error', { 
          message: `Failed to toggle auto-updates: ${error.message}` 
        });
      }
    });

    // Handle socket disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket ${socket.id} disconnected: ${reason}`);
      
      const socketInfo = this.connectedSockets.get(socket.id);
      if (socketInfo && socketInfo.isMonitoring) {
        // Stop monitoring for this socket
        ConsciousnessEngine.stopMonitoring(socketInfo.characterId, socket.id);
      }
      
      this.connectedSockets.delete(socket.id);
    });
  }

  // Broadcast consciousness updates to all monitoring sockets
  broadcastConsciousnessUpdate(data) {
    if (!this.io) return;
    
    const roomName = `character-${data.characterId}`;
    
    // CHANGED: Only send updates to sockets monitoring this character
    this.io.to(roomName).emit('consciousness-update', {
      characterId: data.characterId,
      state: data.state,
      timestamp: data.timestamp,
      type: data.type || 'simulation-update',
      reason: data.reason
    });
  }

  sendRealTimeUpdate(data) {
    if (!this.io) return;
    
    // Send to specific socket
    const targetSocket = this.io.sockets.sockets.get(data.socketId);
    if (targetSocket) {
      targetSocket.emit('consciousness-update', {
        characterId: data.characterId,
        state: data.state,
        timestamp: data.timestamp,
        type: data.type || 'real-time'
      });
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

  broadcastSystemMessage(message, type = 'info') {
    if (!this.io) return;
    
    this.io.emit('system-message', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  // ADDED: Broadcast breakpoint triggered events
  broadcastBreakpoint(data) {
    if (!this.io) return;
    
    const roomName = `character-${data.characterId}`;
    this.io.to(roomName).emit('breakpoint-triggered', {
      characterId: data.characterId,
      breakpoint: data.breakpoint,
      timestamp: data.timestamp
    });
  }

  // Health check
  performHealthCheck() {
    const connectedCount = this.connectedSockets.size;
    const monitoringCount = Array.from(this.connectedSockets.values())
      .filter(info => info.isMonitoring).length;
    const activeCharacters = ConsciousnessEngine.getAllActiveCharacters();
    
    return {
      connectedSockets: connectedCount,
      activeMonitoring: monitoringCount,
      activeCharacters: activeCharacters.length,
      characters: activeCharacters,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new WebSocketHandlers();