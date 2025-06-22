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
        
        // Join character-specific room
        const roomName = `character-${characterId}`;
        socket.join(roomName);
        socketInfo.joinedRooms.add(roomName);
        
        // Send initial state
        const state = await ConsciousnessEngine.getState(characterId);
        socket.emit('consciousness-update', {
          characterId,
          state: state.consciousness,
          timestamp: new Date().toISOString(),
          type: 'initial'
        });
        
        socket.emit('monitoring-started', { 
          characterId,
          message: `Started monitoring ${state.name}'s consciousness`
        });
        
      } catch (error) {
        console.error('Error starting monitoring:', error);
        socket.emit('error', { 
          message: 'Failed to start monitoring',
          details: error.message 
        });
      }
    });

    // Handle stop monitoring
    socket.on('stop-monitoring', (data) => {
      try {
        const { characterId } = data;
        const socketInfo = this.connectedSockets.get(socket.id);
        
        if (!socketInfo || !socketInfo.isMonitoring) {
          socket.emit('error', { message: 'Not currently monitoring any character' });
          return;
        }

        console.log(`Stopping monitoring for character: ${characterId} (socket: ${socket.id})`);
        
        // Stop monitoring
        ConsciousnessEngine.stopMonitoring(characterId, socket.id);
        
        // Update socket info
        socketInfo.characterId = null;
        socketInfo.isMonitoring = false;
        
        // Leave character room
        const roomName = `character-${characterId}`;
        socket.leave(roomName);
        socketInfo.joinedRooms.delete(roomName);
        
        socket.emit('monitoring-stopped', { 
          characterId,
          message: `Stopped monitoring consciousness`
        });
        
      } catch (error) {
        console.error('Error stopping monitoring:', error);
        socket.emit('error', { 
          message: 'Failed to stop monitoring',
          details: error.message 
        });
      }
    });

    // Handle debugging commands
    socket.on('debug-command', async (data) => {
      try {
        const { characterId, command, args = {} } = data;
        
        if (!characterId || !command) {
          socket.emit('error', { message: 'Character ID and command required' });
          return;
        }

        console.log(`Debug command for ${characterId}: ${command}`, args);
        
        // Execute command through consciousness engine
        const result = await ConsciousnessEngine.executeDebugCommand(characterId, command, args);
        
        // Send result back to requesting socket
        socket.emit('debug-result', {
          characterId,
          command,
          args,
          result,
          timestamp: new Date().toISOString(),
          success: true
        });

        // Log successful command
        console.log(`Debug command executed successfully: ${command} for ${characterId}`);
        
      } catch (error) {
        console.error('Error executing debug command:', error);
        socket.emit('debug-result', {
          characterId: data.characterId,
          command: data.command,
          args: data.args,
          result: { error: error.message },
          timestamp: new Date().toISOString(),
          success: false
        });
      }
    });

    // Handle player interventions
    socket.on('player-intervention', async (data) => {
      try {
        const { characterId, intervention } = data;
        
        if (!characterId || !intervention) {
          socket.emit('error', { message: 'Character ID and intervention required' });
          return;
        }

        console.log(`Player intervention for ${characterId}:`, intervention);
        
        // Apply intervention through consciousness engine
        const result = await ConsciousnessEngine.updateState(characterId, intervention);
        
        // Broadcast update to all clients monitoring this character
        const roomName = `character-${characterId}`;
        this.io.to(roomName).emit('consciousness-update', {
          characterId,
          state: result.consciousness,
          intervention: true,
          interventionType: intervention.type,
          timestamp: new Date().toISOString()
        });
        
        // Send confirmation to requesting socket
        socket.emit('intervention-applied', {
          characterId,
          intervention,
          result: intervention.type === 'kill_process' || intervention.type === 'restart_process' ? result : { success: true },
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Error applying player intervention:', error);
        socket.emit('error', { 
          message: 'Failed to apply intervention',
          details: error.message 
        });
      }
    });

    // Handle breakpoint management
    socket.on('add-breakpoint', async (data) => {
      try {
        const { characterId, breakpoint } = data;
        
        // Add breakpoint to character's debug hooks
        const state = await ConsciousnessEngine.getState(characterId);
        state.consciousness.debug_hooks.push({
          id: `bp_${Date.now()}`,
          name: breakpoint.name || `Breakpoint at ${breakpoint.target}`,
          type: 'breakpoint',
          target: breakpoint.target,
          condition: breakpoint.condition || 'always',
          enabled: true,
          ...breakpoint
        });
        
        await ConsciousnessEngine.updateState(characterId, {
          debug_hooks: state.consciousness.debug_hooks
        });
        
        socket.emit('breakpoint-added', {
          characterId,
          breakpoint: state.consciousness.debug_hooks[state.consciousness.debug_hooks.length - 1]
        });
        
      } catch (error) {
        console.error('Error adding breakpoint:', error);
        socket.emit('error', { message: 'Failed to add breakpoint' });
      }
    });

    socket.on('remove-breakpoint', async (data) => {
      try {
        const { characterId, breakpointId } = data;
        
        const state = await ConsciousnessEngine.getState(characterId);
        state.consciousness.debug_hooks = state.consciousness.debug_hooks.filter(
          hook => hook.id !== breakpointId
        );
        
        await ConsciousnessEngine.updateState(characterId, {
          debug_hooks: state.consciousness.debug_hooks
        });
        
        socket.emit('breakpoint-removed', {
          characterId,
          breakpointId
        });
        
      } catch (error) {
        console.error('Error removing breakpoint:', error);
        socket.emit('error', { message: 'Failed to remove breakpoint' });
      }
    });

    // Handle debugging session management
    socket.on('start-debug-session', async (data) => {
      try {
        const { characterId } = data;
        const sessionId = ConsciousnessEngine.startDebuggingSession(characterId);
        
        socket.emit('debug-session-started', {
          characterId,
          sessionId,
          timestamp: new Date().toISOString()
        });
        
        // Join debug room for this character
        const debugRoom = `debug-${characterId}`;
        socket.join(debugRoom);
        
        const socketInfo = this.connectedSockets.get(socket.id);
        socketInfo.joinedRooms.add(debugRoom);
        
      } catch (error) {
        console.error('Error starting debug session:', error);
        socket.emit('error', { message: 'Failed to start debug session' });
      }
    });

    // Handle variable inspection
    socket.on('inspect-variable', async (data) => {
      try {
        const { characterId, variableName, scope } = data;
        
        const state = await ConsciousnessEngine.getState(characterId);
        let value = null;
        
        // Simulate variable inspection based on scope
        switch (scope) {
          case 'local':
            // Simulate local variables based on current process state
            const griefProcess = state.consciousness.processes.find(p => p.name === 'Grief_Manager.exe');
            if (variableName === 'grief_intensity' && griefProcess) {
              value = griefProcess.cpu_usage;
            } else if (variableName === 'memory_allocated' && griefProcess) {
              value = griefProcess.memory_mb;
            }
            break;
            
          case 'resources':
            if (state.consciousness.resources[variableName]) {
              value = state.consciousness.resources[variableName];
            }
            break;
            
          case 'memory':
            // Return memory block information
            value = Object.keys(state.consciousness.memory).length;
            break;
        }
        
        socket.emit('variable-inspected', {
          characterId,
          variableName,
          scope,
          value,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Error inspecting variable:', error);
        socket.emit('error', { message: 'Failed to inspect variable' });
      }
    });

    // Handle disconnection cleanup
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      
      const socketInfo = this.connectedSockets.get(socket.id);
      if (socketInfo) {
        // Stop monitoring if active
        if (socketInfo.isMonitoring && socketInfo.characterId) {
          ConsciousnessEngine.stopMonitoring(socketInfo.characterId, socket.id);
        }
        
        // Clean up consciousness engine resources
        ConsciousnessEngine.cleanup(socket.id);
        
        // Remove from connected sockets
        this.connectedSockets.delete(socket.id);
      }
    });

    // Add ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle emergency stop
    socket.on('emergency-stop', async (data) => {
      try {
        const { characterId } = data;
        
        // Stop all processes for character
        const state = await ConsciousnessEngine.getState(characterId);
        state.consciousness.processes.forEach(process => {
          if (process.status !== 'terminated') {
            process.status = 'stopped';
            process.cpu_usage = 0;
          }
        });
        
        await ConsciousnessEngine.updateState(characterId, {
          processes: state.consciousness.processes
        });
        
        socket.emit('emergency-stop-completed', {
          characterId,
          message: 'All processes stopped',
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Error during emergency stop:', error);
        socket.emit('error', { message: 'Emergency stop failed' });
      }
    });
  }

  // Broadcasting methods
  broadcastConsciousnessUpdate(data) {
    if (!this.io) return;
    
    const roomName = `character-${data.characterId}`;
    this.io.to(roomName).emit('consciousness-update', {
      characterId: data.characterId,
      state: data.state,
      timestamp: data.timestamp,
      type: 'simulation-update'
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
        type: 'real-time'
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