const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Get all available characters
router.get('/characters', async (req, res) => {
  try {
    const charactersDir = path.join(__dirname, '../data/characters');
    const files = await fs.readdir(charactersDir);
    const characters = [];
    
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'schema.json') {
        const filePath = path.join(charactersDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const character = JSON.parse(data);
        characters.push({
          id: character.id,
          name: character.name,
          status: character.status,
          description: character.description
        });
      }
    }
    
    res.json(characters);
  } catch (error) {
    console.error('Error loading characters:', error);
    res.status(500).json({ error: 'Failed to load characters' });
  }
});

// Get specific character consciousness state
router.get('/character/:id', async (req, res) => {
  try {
    const characterId = req.params.id;
    const filePath = path.join(__dirname, '../data/characters', `${characterId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    const character = JSON.parse(data);
    
    res.json(character);
  } catch (error) {
    console.error('Error loading character:', error);
    res.status(404).json({ error: 'Character not found' });
  }
});

// Start debugging session
router.post('/debug/:characterId', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const sessionId = `debug_${characterId}_${Date.now()}`;
    
    // In a real implementation, this would initialize debugging state
    res.json({
      sessionId,
      characterId,
      status: 'debugging_started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error starting debug session:', error);
    res.status(500).json({ error: 'Failed to start debugging session' });
  }
});

// Kill a mental process
router.put('/process/:pid/kill', async (req, res) => {
  try {
    const pid = req.params.pid;
    
    // In a real implementation, this would terminate the process
    res.json({
      pid,
      status: 'terminated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error killing process:', error);
    res.status(500).json({ error: 'Failed to kill process' });
  }
});

// Get real-time monitoring data
router.get('/monitor/:characterId', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    
    // In a real implementation, this would return live monitoring data
    res.json({
      characterId,
      timestamp: new Date().toISOString(),
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      active_processes: Math.floor(Math.random() * 10) + 1,
      errors: Math.floor(Math.random() * 5)
    });
  } catch (error) {
    console.error('Error getting monitor data:', error);
    res.status(500).json({ error: 'Failed to get monitoring data' });
  }
});

module.exports = router;

