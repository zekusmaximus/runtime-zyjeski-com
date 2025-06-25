import { info, error } from '../logger.js';

export default function registerDebugHandlers({ socket, ensureEngineInitialized, consciousnessEngine }) {
  socket.on('debug-command', async (data) => {
    try {
      const { characterId, command, args } = data;
      if (!characterId || !command) {
        socket.emit('error', { message: 'Character ID and command required' });
        return;
      }

      info('Executing debug command', { command, characterId });
      await ensureEngineInitialized();
      const result = await consciousnessEngine.executeDebugCommand(characterId, command, args);
      socket.emit('debug-result', {
        characterId,
        command,
        success: true,
        result,
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
        result: { error: err.message },
        timestamp: new Date().toISOString()
      });
    }
  });
}
