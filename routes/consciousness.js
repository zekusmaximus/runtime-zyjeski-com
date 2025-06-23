import express from 'express';
import { consciousnessEngine } from '../lib/websocket-handlers.js';
import { error, info } from '../lib/logger.js';

const router = express.Router();

// Ensure engine is initialized before handling requests
async function ensureEngineInitialized() {
  try {
    await consciousnessEngine.initialize();
    info('Consciousness engine initialized for API requests');
  } catch (err) {
    error('Failed to initialize consciousness engine', { error: err.message });
    throw err;
  }
}

// Get consciousness state for a character
router.get('/:characterId/state', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    await ensureEngineInitialized();
    await consciousnessEngine.loadCharacter(characterId);
    const state = await consciousnessEngine.getState(characterId);
    res.json(state);
  } catch (err) {
    error('Error getting consciousness state:', { error: err.message, characterId });
    res.status(500).json({ error: 'Failed to get consciousness state' });
  }
});

// Update consciousness state
router.post('/:characterId/update', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const updates = req.body;
    await ensureEngineInitialized();
    await consciousnessEngine.loadCharacter(characterId);
    const newState = await consciousnessEngine.updateState(characterId, updates);
    res.json(newState);
  } catch (err) {
    error('Error updating consciousness state:', { error: err.message, characterId });
    res.status(500).json({ error: 'Failed to update consciousness state' });
  }
});

// Get process list
router.get('/:characterId/processes', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    await ensureEngineInitialized();
    await consciousnessEngine.loadCharacter(characterId);
    const processes = await consciousnessEngine.getProcesses(characterId);
    res.json(processes);
  } catch (err) {
    error('Error getting processes:', { error: err.message, characterId });
    res.status(500).json({ error: 'Failed to get processes' });
  }
});

// Get memory allocation
router.get('/:characterId/memory', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    await ensureEngineInitialized();
    await consciousnessEngine.loadCharacter(characterId);
    const memory = await consciousnessEngine.getMemory(characterId);
    res.json(memory);
  } catch (err) {
    error('Error getting memory:', { error: err.message, characterId });
    res.status(500).json({ error: 'Failed to get memory allocation' });
  }
});

// Get system errors
router.get('/:characterId/errors', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    await ensureEngineInitialized();
    await consciousnessEngine.loadCharacter(characterId);
    const errors = await consciousnessEngine.getErrors(characterId);
    res.json(errors);
  } catch (err) {
    error('Error getting system errors:', { error: err.message, characterId });
    res.status(500).json({ error: 'Failed to get system errors' });
  }
});

export default router;
