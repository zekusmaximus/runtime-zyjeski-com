import DatabaseManager from '../database.js';
import { info } from '../logger.js';

export default function registerAuthenticatedHandlers({ socket }) {
  const db = DatabaseManager.getInstance();

  socket.on('save-debugging-state', (data) => {
    if (socket.isGuest) {
      socket.emit('error', { message: 'Guest users cannot save debugging states', code: 'GUEST_SAVE_DENIED' });
      return;
    }
    try {
      const { characterId, consciousnessState, terminalHistory, breakpoints } = data;
      const stateId = `state_${socket.userId}_${characterId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      db.createDebuggingState({
        id: stateId,
        userId: socket.userId,
        characterId,
        consciousnessState: consciousnessState || {},
        terminalHistory: terminalHistory || [],
        breakpoints: breakpoints || [],
        expiresAt: expiresAt.toISOString()
      });
      info('Debugging state saved via WebSocket', { userId: socket.userId, stateId, characterId });
      socket.emit('debugging-state-saved', { stateId });
    } catch (err) {
      socket.emit('error', { message: 'Failed to save debugging state', code: 'SAVE_FAILED' });
    }
  });

  socket.on('load-debugging-state', (data) => {
    if (socket.isGuest) {
      socket.emit('error', { message: 'Guest users cannot load saved states', code: 'GUEST_LOAD_DENIED' });
      return;
    }
    try {
      const { stateId } = data;
      const state = db.getDebuggingState(stateId);
      if (!state || state.user_id !== socket.userId) {
        socket.emit('error', { message: 'Debugging state not found or access denied', code: 'STATE_NOT_FOUND' });
        return;
      }
      socket.emit('debugging-state-loaded', {
        consciousnessState: state.consciousness_state,
        terminalHistory: state.terminal_history,
        breakpoints: state.breakpoints,
        characterId: state.character_id
      });
    } catch (err) {
      socket.emit('error', { message: 'Failed to load debugging state', code: 'LOAD_FAILED' });
    }
  });
}
