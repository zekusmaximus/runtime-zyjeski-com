import { info, error } from '../logger.js';

export default function registerDebugHandlers({ socket, io, ensureEngineInitialized, consciousnessEngine }) {
  socket.on('debug-command', async (data) => {
    try {
      const { characterId, command, args } = data;
      if (!characterId || !command) {
        socket.emit('error', { message: 'Character ID and command required' });
        return;
      }

      info('USER ACTION: Executing debug command', { command, characterId, socketId: socket.id });
      await ensureEngineInitialized();
      const result = await consciousnessEngine.executeDebugCommand(characterId, command, args);
      
      // Send command result back to user
      socket.emit('debug-result', {
        characterId,
        command,
        success: true,
        result,
        timestamp: new Date().toISOString()
      });

      // GROUND STATE: Only broadcast state change if user action modified state
      if (result.stateChanges) {
        const updatedState = await consciousnessEngine.getState(characterId);
        io.to(`character-${characterId}`).emit('consciousness-update', {
          characterId: characterId,
          state: updatedState,
          trigger: 'user_command',
          command: command,
          timestamp: Date.now()
        });
      }

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
        result: { error: err.message },
        timestamp: new Date().toISOString()
      });
    }
  });
}
