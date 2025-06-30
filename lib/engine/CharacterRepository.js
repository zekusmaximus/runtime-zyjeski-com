import fs from 'fs/promises';
import { join } from 'path';
import { resolveDataPath } from './engine-utils.js';

/**
 * CharacterRepository
 * Handles file I/O operations for character data loading
 * Extracted from CharacterLoader to separate file operations from business logic
 */
export class CharacterRepository {
  constructor(basePath = null) {
    this.basePath = basePath || resolveDataPath('characters');
  }

  /**
   * Load character data from JSON file
   * @param {string} characterId - The character identifier
   * @returns {Promise<Object>} Parsed character data
   * @throws {Error} If character file not found or invalid JSON
   */
  async loadCharacterData(characterId) {
    const filePath = join(this.basePath, `${characterId}.json`);
    
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`Character ${characterId} not found`);
    }
    
    const data = await fs.readFile(filePath, 'utf8');
    
    try {
      return JSON.parse(data);
    } catch {
      throw new Error(`Failed to parse ${characterId}.json`);
    }
  }
}

export default CharacterRepository;
