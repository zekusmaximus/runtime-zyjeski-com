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

// Helper function to ensure data is a valid array
async function ensureValidArray(dataFetcher) {
  try {
    const data = await dataFetcher();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    error('Error fetching array data:', { error: err.message });
    return [];
  }
}

// Get consciousness state for a character
router.get('/:characterId/state', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    await ensureEngineInitialized();
    await consciousnessEngine.loadCharacter(characterId);
    
    // Get the base state
    const state = await consciousnessEngine.getState(characterId);
    
    // Ensure all required arrays are properly formatted at the top level
    const completeState = {
      ...state,
      // Extract processes from nested structure and ensure it's a valid array
      processes: state.consciousness?.processes || await ensureValidArray(() => consciousnessEngine.getProcesses(characterId)),
      system_errors: await ensureValidArray(() => consciousnessEngine.getErrors(characterId)),
      threads: Array.isArray(state.threads) ? state.threads : [],
      // Preserve the nested consciousness structure as well
      consciousness: {
        ...state.consciousness,
        memory: state.consciousness?.memory || {},
      }
    };
    
    res.json(completeState);
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
    
    // Apply the same normalization to the updated state
    const normalizedState = {
      ...newState,
      processes: newState.consciousness?.processes || await ensureValidArray(() => consciousnessEngine.getProcesses(characterId)),
      system_errors: await ensureValidArray(() => consciousnessEngine.getErrors(characterId)),
      threads: Array.isArray(newState.threads) ? newState.threads : [],
      consciousness: {
        ...newState.consciousness,
        memory: newState.consciousness?.memory || {},
      }
    };
    
    res.json(normalizedState);
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
