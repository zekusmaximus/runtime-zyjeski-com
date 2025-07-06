import express from 'express';
import DatabaseManager from '../lib/database.js';
import { authenticateToken, requireDebuggingStateOwnership } from '../lib/auth/auth-middleware.js';
import { info, error } from '../lib/logger.js';

const router = express.Router();
const db = DatabaseManager.getInstance();

router.get('/', authenticateToken, (req, res) => {
  try {
    const states = db.getUserDebuggingStates(req.user.id);
    res.json({
      success: true,
      data: { states },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    error('Failed to fetch debugging states', { userId: req.user.id, error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch debugging states',
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/:stateId', authenticateToken, requireDebuggingStateOwnership, (req, res) => {
  const state = req.debuggingState;
  res.json({
    success: true,
    data: {
      state: {
        id: state.id,
        characterId: state.character_id,
        consciousnessState: state.consciousness_state,
        terminalHistory: state.terminal_history,
        breakpoints: state.breakpoints,
        createdAt: state.created_at,
        updatedAt: state.updated_at,
        expiresAt: state.expires_at
      }
    },
    timestamp: new Date().toISOString()
  });
});

router.post('/', authenticateToken, (req, res) => {
  try {
    const { characterId, consciousnessState, terminalHistory, breakpoints } = req.body;
    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: 'Character ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const stateId = `state_${req.user.id}_${characterId}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + db.config.SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    db.createDebuggingState({
      id: stateId,
      userId: req.user.id,
      characterId,
      consciousnessState: consciousnessState || {},
      terminalHistory: terminalHistory || [],
      breakpoints: breakpoints || [],
      expiresAt: expiresAt.toISOString()
    });

    info('Debugging state created via API', { userId: req.user.id, stateId, characterId });

    res.status(201).json({
      success: true,
      data: { stateId, message: 'Debugging state created successfully', expiresAt: expiresAt.toISOString() },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    error('Failed to create debugging state', { userId: req.user.id, error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create debugging state',
      timestamp: new Date().toISOString()
    });
  }
});

router.put('/:stateId', authenticateToken, requireDebuggingStateOwnership, (req, res) => {
  try {
    const { consciousnessState, terminalHistory, breakpoints } = req.body;
    const stateId = req.params.stateId;

    const existingState = req.debuggingState;
    const updateData = {
      consciousnessState: consciousnessState !== undefined ? consciousnessState : existingState.consciousness_state,
      terminalHistory: terminalHistory !== undefined ? terminalHistory : existingState.terminal_history,
      breakpoints: breakpoints !== undefined ? breakpoints : existingState.breakpoints
    };

    db.updateDebuggingState(stateId, updateData);
    info('Debugging state updated via API', { userId: req.user.id, stateId, fieldsUpdated: Object.keys(req.body) });

    res.json({
      success: true,
      data: { message: 'Debugging state updated successfully', updatedAt: new Date().toISOString() },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    error('Failed to update debugging state', { userId: req.user.id, stateId: req.params.stateId, error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update debugging state',
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/:stateId', authenticateToken, requireDebuggingStateOwnership, (req, res) => {
  try {
    db.deleteDebuggingState(req.params.stateId);
    info('Debugging state deleted via API', { userId: req.user.id, stateId: req.params.stateId });
    res.json({
      success: true,
      data: { message: 'Debugging state deleted successfully' },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    error('Failed to delete debugging state', { userId: req.user.id, stateId: req.params.stateId, error: err.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete debugging state',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
