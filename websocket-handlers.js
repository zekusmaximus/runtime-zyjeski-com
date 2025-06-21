const ConsciousnessEngine = require('./consciousness-engine');

class WebSocketHandlers {
  initializeHandlers(socket, io) {
    // Handle consciousness monitoring requests
    socket.on('start-monitoring', async (data) => {
      try {
        const { characterId } = data;
        console.log(`Starting monitoring for character: ${characterId}`);
        
        // Start consciousness simulation
        ConsciousnessEngine.startSimulation(characterId);
        
        // Send initial state
        const state = await ConsciousnessEngine.getState(characterId);
        socket.emit('consciousness-update', {
          characterId,
          state,
          timestamp: new Date().toISOString()
        });
        
        // Join character-specific room for updates
        socket.join(`character-${characterId}`);
        
        socket.emit('monitoring-started', { characterId });
      } catch (error) {
        console.error('Error starting monitoring:', error);
        socket.emit('error', { message: 'Failed to start monitoring' });
      }
    });

    // Handle stop monitoring
    socket.on('stop-monitoring', (data) => {
      try {
        const { characterId } = data;
        console.log(`Stopping monitoring for character: ${characterId}`);
        
        ConsciousnessEngine.stopSimulation(characterId);
        socket.leave(`character-${characterId}`);
        
        socket.emit('monitoring-stopped', { characterId });
      } catch (error) {
        console.error('Error stopping monitoring:', error);
        socket.emit('error', { message: 'Failed to stop monitoring' });
      }
    });

    // Handle debugging commands
    socket.on('debug-command', async (data) => {
      try {
        const { characterId, command, args } = data;
        console.log(`Debug command for ${characterId}: ${command}`, args);
        
        let result = {};
        
        switch (command) {
          case 'ps':
            result.processes = await ConsciousnessEngine.getProcesses(characterId);
            break;
          case 'top':
            result.resources = await ConsciousnessEngine.getResources(characterId);
            result.processes = await ConsciousnessEngine.getProcesses(characterId);
            break;
          case 'kill':
            if (args.pid) {
              // This would integrate with the process simulator
              result.message = `Terminated process ${args.pid}`;
            }
            break;
          case 'monitor':
            result.memory = await ConsciousnessEngine.getMemory(characterId);
            result.errors = await ConsciousnessEngine.getErrors(characterId);
            break;
          default:
            result.error = `Unknown command: ${command}`;
        }
        
        socket.emit('debug-result', {
          characterId,
          command,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error executing debug command:', error);
        socket.emit('error', { message: 'Failed to execute debug command' });
      }
    });

    // Handle player interventions
    socket.on('player-intervention', async (data) => {
      try {
        const { characterId, intervention } = data;
        console.log(`Player intervention for ${characterId}:`, intervention);
        
        // Apply intervention to consciousness state
        await ConsciousnessEngine.updateState(characterId, intervention);
        
        // Broadcast update to all clients monitoring this character
        const updatedState = await ConsciousnessEngine.getState(characterId);
        io.to(`character-${characterId}`).emit('consciousness-update', {
          characterId,
          state: updatedState,
          intervention: true,
          timestamp: new Date().toISOString()
        });
        
        socket.emit('intervention-applied', {
          characterId,
          intervention,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error applying player intervention:', error);
        socket.emit('error', { message: 'Failed to apply intervention' });
      }
    });

    // Handle real-time updates (periodic consciousness state broadcasts)
    const startPeriodicUpdates = (characterId) => {
      const updateInterval = setInterval(async () => {
        try {
          if (socket.rooms.has(`character-${characterId}`)) {
            const state = await ConsciousnessEngine.getState(characterId);
            socket.emit('consciousness-update', {
              characterId,
              state,
              timestamp: new Date().toISOString()
            });
          } else {
            clearInterval(updateInterval);
          }
        } catch (error) {
          console.error('Error sending periodic update:', error);
          clearInterval(updateInterval);
        }
      }, 2000); // Update every 2 seconds
    };

    // Start periodic updates when monitoring begins
    socket.on('start-monitoring', (data) => {
      startPeriodicUpdates(data.characterId);
    });

    // Handle disconnection cleanup
    socket.on('disconnect', () => {
      console.log('Client disconnected, cleaning up...');
      // Stop any active simulations for this socket
      // In a production app, you'd track which characters this socket was monitoring
    });
  }
}

module.exports = new WebSocketHandlers();

