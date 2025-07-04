import { info, error } from '../logger.js';
import { wrapHandler } from '../validation/validation-middleware.js';

export default function registerDebugHandlers({ socket, io, ensureEngineInitialized, consciousnessEngine }) {
  // Debug command handler with validation
  const debugCommandHandler = async (data) => {
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
  };

  // Register validated handler
  socket.on('debug-command', wrapHandler(debugCommandHandler, 'debug-command'));

  // Undo last command handler
  const debugUndoHandler = async (data) => {
    try {
      const { characterId } = data;
      if (!characterId) {
        socket.emit('error', { message: 'Character ID required' });
        return;
      }

      info('USER ACTION: Undo last command', { characterId, socketId: socket.id });
      await ensureEngineInitialized();

      const instance = consciousnessEngine.instances.get(characterId);
      if (!instance) {
        socket.emit('error', { message: `No consciousness loaded: ${characterId}` });
        return;
      }

      const result = await instance.processManager.undoLastCommand();

      socket.emit('debug-undo-result', {
        characterId,
        success: true,
        result,
        timestamp: new Date().toISOString()
      });

      // Broadcast state change if undo affected state
      if (result.stateChanges) {
        const updatedState = await consciousnessEngine.getState(characterId);
        io.to(`character-${characterId}`).emit('consciousness-update', {
          characterId: characterId,
          state: updatedState,
          trigger: 'command_undo',
          timestamp: Date.now()
        });
      }

    } catch (err) {
      error('Error undoing command', { error: err, characterId: data.characterId });
      socket.emit('debug-undo-result', {
        characterId: data.characterId,
        success: false,
        result: { error: err.message },
        timestamp: new Date().toISOString()
      });
    }
  };

  // Register validated undo handler
  socket.on('debug-undo', wrapHandler(debugUndoHandler, 'debug-undo'));

  // Redo last undone command handler
  const debugRedoHandler = async (data) => {
    try {
      const { characterId } = data;
      if (!characterId) {
        socket.emit('error', { message: 'Character ID required' });
        return;
      }

      info('USER ACTION: Redo last command', { characterId, socketId: socket.id });
      await ensureEngineInitialized();

      const instance = consciousnessEngine.instances.get(characterId);
      if (!instance) {
        socket.emit('error', { message: `No consciousness loaded: ${characterId}` });
        return;
      }

      const result = await instance.processManager.redoLastCommand();

      socket.emit('debug-redo-result', {
        characterId,
        success: true,
        result,
        timestamp: new Date().toISOString()
      });

      // Broadcast state change if redo affected state
      if (result.stateChanges) {
        const updatedState = await consciousnessEngine.getState(characterId);
        io.to(`character-${characterId}`).emit('consciousness-update', {
          characterId: characterId,
          state: updatedState,
          trigger: 'command_redo',
          timestamp: Date.now()
        });
      }

    } catch (err) {
      error('Error redoing command', { error: err, characterId: data.characterId });
      socket.emit('debug-redo-result', {
        characterId: data.characterId,
        success: false,
        result: { error: err.message },
        timestamp: new Date().toISOString()
      });
    }
  };

  // Register validated redo handler
  socket.on('debug-redo', wrapHandler(debugRedoHandler, 'debug-redo'));

  // Get command history handler
  const debugHistoryHandler = async (data) => {
    try {
      const { characterId, limit, criteria } = data;
      if (!characterId) {
        socket.emit('error', { message: 'Character ID required' });
        return;
      }

      await ensureEngineInitialized();

      const instance = consciousnessEngine.instances.get(characterId);
      if (!instance) {
        socket.emit('error', { message: `No consciousness loaded: ${characterId}` });
        return;
      }

      let history;
      if (criteria) {
        history = instance.processManager.searchCommandHistory(criteria);
      } else {
        history = instance.processManager.getCommandHistory(limit);
      }

      socket.emit('debug-history-result', {
        characterId,
        success: true,
        history,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      error('Error getting command history', { error: err, characterId: data.characterId });
      socket.emit('debug-history-result', {
        characterId: data.characterId,
        success: false,
        result: { error: err.message },
        timestamp: new Date().toISOString()
      });
    }
  };

  // Register validated history handler
  socket.on('debug-history', wrapHandler(debugHistoryHandler, 'debug-history'));

  // Get undo/redo status handler
  const debugStatusHandler = async (data) => {
    try {
      const { characterId } = data;
      if (!characterId) {
        socket.emit('error', { message: 'Character ID required' });
        return;
      }

      await ensureEngineInitialized();

      const instance = consciousnessEngine.instances.get(characterId);
      if (!instance) {
        socket.emit('error', { message: `No consciousness loaded: ${characterId}` });
        return;
      }

      const status = {
        canUndo: instance.processManager.canUndo(),
        canRedo: instance.processManager.canRedo(),
        undoStack: instance.processManager.getUndoStack(),
        redoStack: instance.processManager.getRedoStack(),
        metrics: instance.processManager.getCommandMetrics()
      };

      socket.emit('debug-status-result', {
        characterId,
        success: true,
        status,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      error('Error getting debug status', { error: err, characterId: data.characterId });
      socket.emit('debug-status-result', {
        characterId: data.characterId,
        success: false,
        result: { error: err.message },
        timestamp: new Date().toISOString()
      });
    }
  };

  // Register validated status handler
  socket.on('debug-status', wrapHandler(debugStatusHandler, 'debug-status'));
}
