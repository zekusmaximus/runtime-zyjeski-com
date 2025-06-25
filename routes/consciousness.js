// routes/consciousness.js - Add missing routes
import express from 'express';
import { consciousnessEngine } from '../lib/ws-bootstrap.js';
import { error, info } from '../lib/logger.js';
import { validateConsciousnessData } from '../lib/validateConsciousness.js';

const router = express.Router();

// Track initialization state
let engineInitialized = false;
let initializationPromise = null;

// Ensure engine is initialized only once
async function ensureEngineInitialized() {
  // If already initialized, return immediately
  if (engineInitialized) {
    return;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    await initializationPromise;
    return;
  }

  // Start initialization
  try {
    info('Starting consciousness engine initialization for API requests');
    initializationPromise = consciousnessEngine.initialize();
    await initializationPromise;
    engineInitialized = true;
    info('Consciousness engine initialized successfully');
  } catch (err) {
    error('Failed to initialize consciousness engine', { error: err.message });
    initializationPromise = null; // Reset to allow retry
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
    
    // Check if character is already loaded to avoid reloading
    const loadedCharacters = consciousnessEngine.instances || new Map();
    if (!loadedCharacters.has(characterId)) {
      await consciousnessEngine.loadCharacter(characterId);
    }
    
    // Get the base state
    const state = await consciousnessEngine.getState(characterId);

    // Load character metadata from file
    const fs = await import('fs/promises');
    const path = await import('path');
    const characterPath = path.resolve(process.cwd(), 'data', 'characters', `${characterId}.json`);
    let characterMeta = {};
    try {
      const charData = await fs.readFile(characterPath, 'utf-8');
      characterMeta = JSON.parse(charData);
    } catch (metaErr) {
      error('Failed to load character metadata for consciousness state', { characterId, error: metaErr.message });
    }

    // Ensure all required arrays are properly formatted at the top level
    let completeState = {
      ...characterMeta, // Merge character metadata at the top level
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

    // Always patch required top-level fields before validation
    const stateMemoryMap = completeState.memoryMap || {};
    const patchedMemoryMap = {
      totalSize: typeof stateMemoryMap.totalSize === 'number' ? stateMemoryMap.totalSize : 1024,
      pageSize: typeof stateMemoryMap.pageSize === 'number' ? stateMemoryMap.pageSize : 4096,
      regions: Array.isArray(stateMemoryMap.regions) ? stateMemoryMap.regions : []
    };
    const requiredDefaults = {
      id: completeState.id || characterId,
      name: completeState.name || state.name || 'Unknown',
      version: completeState.version || state.version || '1.0.0',
      baseProcesses: Array.isArray(completeState.baseProcesses) ? completeState.baseProcesses : [],
      memoryMap: patchedMemoryMap,
      emotionalStates: completeState.emotionalStates || state.emotionalStates || {},
      systemResources: completeState.systemResources || state.systemResources || {
        cpu: { cores: 1, baseFrequency: 1.0, turboFrequency: 1.0 },
        memory: { total: 1024, available: 1024 },
        threads: { max: 4, reserved: 0 }
      }
    };
    completeState = { ...requiredDefaults, ...completeState };

    // Validate against schema before sending
    if (!validateConsciousnessData(completeState)) {
      error('Consciousness state failed schema validation', { characterId, consciousness: completeState });
      // Log which fields are missing or invalid
      try {
        const { validate } = await import('jsonschema');
        const fs = await import('fs');
        const path = await import('path');
        const schemaPath = path.resolve(process.cwd(), 'data', 'schema', 'consciousness-schema.json');
        const consciousnessSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
        const result = validate(completeState, consciousnessSchema);
        error('Schema validation errors:', result.errors.map(e => e.stack));
      } catch (logErr) {
        error('Failed to log schema validation details', { error: logErr.message });
      }
      return res.status(500).json({ error: 'Consciousness state failed schema validation (patched)' });
    }
    res.json(completeState);
  } catch (err) {
    const characterId = req.params.characterId;
    error('Error getting consciousness state:', { error: err.message, characterId });
    res.status(500).json({ error: 'Failed to get consciousness state' });
  }
});

// Get process list for a character
router.get('/:characterId/processes', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    await ensureEngineInitialized();
    
    const loadedCharacters = consciousnessEngine.instances || new Map();
    if (!loadedCharacters.has(characterId)) {
      await consciousnessEngine.loadCharacter(characterId);
    }
    
    const processes = await consciousnessEngine.getProcesses(characterId);
    res.json(processes);
  } catch (err) {
    error('Error getting processes:', { error: err.message });
    res.status(500).json({ error: 'Failed to get processes' });
  }
});

// Get memory allocation for a character - THIS WAS MISSING!
router.get('/:characterId/memory', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    await ensureEngineInitialized();
    
    const loadedCharacters = consciousnessEngine.instances || new Map();
    if (!loadedCharacters.has(characterId)) {
      await consciousnessEngine.loadCharacter(characterId);
    }
    
    const memory = await consciousnessEngine.getMemory(characterId);
    res.json(memory);
  } catch (err) {
    error('Error getting memory data:', { error: err.message });
    res.status(500).json({ error: 'Failed to get memory data' });
  }
});

// Get system errors for a character - THIS WAS MISSING!
router.get('/:characterId/errors', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    await ensureEngineInitialized();
    
    const loadedCharacters = consciousnessEngine.instances || new Map();
    if (!loadedCharacters.has(characterId)) {
      await consciousnessEngine.loadCharacter(characterId);
    }
    
    const errors = await consciousnessEngine.getErrors(characterId);
    res.json(errors);
  } catch (err) {
    error('Error getting system errors:', { error: err.message });
    res.status(500).json({ error: 'Failed to get system errors' });
  }
});

// Update consciousness state
router.post('/:characterId/update', async (req, res) => {
  try {
    const characterId = req.params.characterId;
    const updates = req.body;
    await ensureEngineInitialized();
    
    // Check if character is already loaded
    const loadedCharacters = consciousnessEngine.instances || new Map();
    if (!loadedCharacters.has(characterId)) {
      await consciousnessEngine.loadCharacter(characterId);
    }
    
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

export default router;