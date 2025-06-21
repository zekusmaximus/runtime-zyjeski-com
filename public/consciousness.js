const express = require('express');
const router = express.Router();
const ConsciousnessEngine = require('../lib/consciousness-engine');

// Get consciousness state for a character
router.get('/:characterId/state', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const state = await ConsciousnessEngine.getState(characterId);
    res.json(state);
  } catch (error) {
    console.error('Error getting consciousness state:', error);
    res.status(500).json({ error: 'Failed to get consciousness state' });
  }
});

// Update consciousness state
router.post('/:characterId/update', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const updates = req.body;
    const newState = await ConsciousnessEngine.updateState(characterId, updates);
    res.json(newState);
  } catch (error) {
    console.error('Error updating consciousness state:', error);
    res.status(500).json({ error: 'Failed to update consciousness state' });
  }
});

// Get process list
router.get('/:characterId/processes', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const processes = await ConsciousnessEngine.getProcesses(characterId);
    res.json(processes);
  } catch (error) {
    console.error('Error getting processes:', error);
    res.status(500).json({ error: 'Failed to get processes' });
  }
});

// Get memory allocation
router.get('/:characterId/memory', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const memory = await ConsciousnessEngine.getMemory(characterId);
    res.json(memory);
  } catch (error) {
    console.error('Error getting memory:', error);
    res.status(500).json({ error: 'Failed to get memory allocation' });
  }
});

// Get system errors
router.get('/:characterId/errors', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const errors = await ConsciousnessEngine.getErrors(characterId);
    res.json(errors);
  } catch (error) {
    console.error('Error getting system errors:', error);
    res.status(500).json({ error: 'Failed to get system errors' });
  }
});

module.exports = router;

