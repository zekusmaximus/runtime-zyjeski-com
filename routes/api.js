import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { error } from '../lib/logger.js';
import { debugCommandsLimiter } from '../lib/middleware/rate-limiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

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
  } catch (err) {
    error('Error loading characters', { error: err });
    res.status(500).json({ error: 'Failed to load characters' });
  }
});

// Get specific character consciousness state
router.get('/character/:id', async (req, res) => {
  try {
    const characterId = req.params.id;

    // Only allow alphanumeric, underscore, and hyphen
    if (!/^[\w-]+$/.test(characterId)) {
      return res.status(400).json({ error: 'Invalid character ID' });
    }

    const filePath = path.join(__dirname, '../data/characters', `${characterId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    const character = JSON.parse(data);
    
    res.json(character);
  } catch (err) {
    error('Error loading character', { error: err, characterId });
    res.status(404).json({ error: 'Character not found' });
  }
});

// Start debugging session with debug command rate limiting
router.post('/debug/:characterId', debugCommandsLimiter, async (req, res) => {
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
  } catch (err) {
    error('Error starting debug session', { error: err, characterId });
    res.status(500).json({ error: 'Failed to start debugging session' });
  }
});

// Kill a mental process with debug command rate limiting
router.put('/process/:pid/kill', debugCommandsLimiter, async (req, res) => {
  try {
    const pid = parseInt(req.params.pid);
    const { characterId } = req.body;

    // In a real implementation, this would update the character's state
    res.json({
      success: true,
      pid,
      characterId,
      message: 'Process terminated',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Fixed: Changed 'processId' to 'pid' to match the actual variable name
    error('Error killing process', { error: err, characterId, pid: req.params.pid });
    res.status(500).json({ error: 'Failed to kill process' });
  }
});

export default router;