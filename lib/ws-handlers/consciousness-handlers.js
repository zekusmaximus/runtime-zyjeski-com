import { info, error } from '../logger.js';
import { wrapHandler } from '../validation/validation-middleware.js';

export default function registerConsciousnessHandlers({ socket, ensureEngineInitialized, consciousnessEngine }) {
  // Player intervention handler
  const playerInterventionHandler = async (data) => {
    try {
      const { characterId, intervention } = data;
      if (!characterId || !intervention) {
        socket.emit('error', { message: 'Character ID and intervention required' });
        return;
      }

      info('Applying player intervention', { characterId, interventionType: intervention.type });
      await ensureEngineInitialized();
      const result = await consciousnessEngine.applyPlayerIntervention(characterId, intervention);
      
      // Emit success and broadcast state change
      socket.emit('intervention-applied', {
        characterId,
        intervention,
        result,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast state to all monitoring sockets
      await consciousnessEngine.broadcastStateChange(characterId, `intervention-${intervention.type}`);
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
  };

  // Register validated player intervention handler
  socket.on('player-intervention', wrapHandler(playerInterventionHandler, 'player-intervention'));

  // Request update handler
  const requestUpdateHandler = async (data) => {
    try {
      const { characterId, reason } = data;
      if (!characterId) {
        socket.emit('error', { message: 'Character ID required' });
        return;
      }

      info('Manual update requested', { characterId, reason: reason || 'user-request' });
      // Trigger update and broadcast state
      await consciousnessEngine.triggerUpdate(characterId, reason || 'user-request');
      await consciousnessEngine.broadcastStateChange(characterId, 'manual-update');
    } catch (err) {
      error('Error triggering manual update', { error: err, characterId });
      socket.emit('error', { message: `Failed to trigger update: ${err.message}` });
    }
  };

  // Register validated request update handler
  socket.on('request-update', wrapHandler(requestUpdateHandler, 'request-update'));

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
      socket.emit('error', { message: `Failed to toggle auto-updates: ${err.message}` });
    }
  });

  // Add debug logging for state emissions
  socket.on('debug-log', (data) => {
    const { characterId, message } = data;
    debug(`[DEBUG] ${characterId}: ${message}`);
  });
}
