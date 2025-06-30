import { CharacterRepository } from '../../../lib/engine/CharacterRepository.js';
import { expect } from 'chai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CharacterRepository', () => {
  let repository;
  let testDataDir;

  beforeEach(async () => {
    // Create a temporary test directory
    testDataDir = path.join(__dirname, 'test-characters');
    await fs.mkdir(testDataDir, { recursive: true });
    
    // Initialize repository with test directory
    repository = new CharacterRepository(testDataDir);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should use provided basePath', () => {
      const customPath = '/custom/path';
      const repo = new CharacterRepository(customPath);
      expect(repo.basePath).to.equal(customPath);
    });

    it('should use default path when no basePath provided', () => {
      const repo = new CharacterRepository();
      expect(repo.basePath).to.include('data');
      expect(repo.basePath).to.include('characters');
    });
  });

  describe('loadCharacterData', () => {
    it('should load valid character data successfully', async () => {
      // Create a test character file
      const characterData = {
        id: 'test-character',
        name: 'Test Character',
        status: 'stable',
        description: 'A test character for unit testing',
        consciousness: {
          processes: [],
          memory: { capacity: { total: 1000 } }
        }
      };

      const filePath = path.join(testDataDir, 'test-character.json');
      await fs.writeFile(filePath, JSON.stringify(characterData, null, 2));

      // Test loading
      const result = await repository.loadCharacterData('test-character');
      expect(result).to.deep.equal(characterData);
    });

    it('should throw error for non-existent character', async () => {
      try {
        await repository.loadCharacterData('non-existent-character');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Character non-existent-character not found');
      }
    });

    it('should throw error for invalid JSON', async () => {
      // Create a file with invalid JSON
      const filePath = path.join(testDataDir, 'invalid-character.json');
      await fs.writeFile(filePath, '{ invalid json content');

      try {
        await repository.loadCharacterData('invalid-character');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Failed to parse invalid-character.json');
      }
    });

    it('should handle empty JSON file', async () => {
      // Create an empty JSON file
      const filePath = path.join(testDataDir, 'empty-character.json');
      await fs.writeFile(filePath, '{}');

      const result = await repository.loadCharacterData('empty-character');
      expect(result).to.deep.equal({});
    });

    it('should preserve complex character data structure', async () => {
      // Create a complex character file similar to alexander-kane.json
      const complexCharacterData = {
        id: 'complex-character',
        name: 'Complex Character',
        version: '2.0.0',
        status: 'stable',
        description: 'A complex test character',
        baseProcesses: [
          {
            pid: 1001,
            name: 'test_process',
            command: '/usr/bin/test',
            status: 'running',
            priority: -5,
            cpu_usage: 25.5,
            memory_mb: 128
          }
        ],
        consciousness: {
          stability: 0.75,
          corruption: 0.1,
          memory: {
            capacity: { total: 10000, allocated: 2500 },
            pools: { shortTerm: 100, longTerm: 50 }
          },
          emotional: {
            primary: 'neutral',
            intensity: 0.3
          }
        },
        defaultState: 'active'
      };

      const filePath = path.join(testDataDir, 'complex-character.json');
      await fs.writeFile(filePath, JSON.stringify(complexCharacterData, null, 2));

      const result = await repository.loadCharacterData('complex-character');
      expect(result).to.deep.equal(complexCharacterData);
      
      // Verify specific nested properties
      expect(result.baseProcesses).to.be.an('array');
      expect(result.baseProcesses[0].pid).to.equal(1001);
      expect(result.consciousness.stability).to.equal(0.75);
      expect(result.consciousness.memory.capacity.total).to.equal(10000);
    });

    it('should handle character files with special characters in content', async () => {
      const characterData = {
        id: 'special-character',
        name: 'Character with "quotes" and symbols: @#$%',
        description: 'A character with\nnewlines and\ttabs',
        consciousness: {
          emotional: {
            primary: 'confused',
            notes: 'Contains unicode: 🤖 and émotions'
          }
        }
      };

      const filePath = path.join(testDataDir, 'special-character.json');
      await fs.writeFile(filePath, JSON.stringify(characterData, null, 2));

      const result = await repository.loadCharacterData('special-character');
      expect(result).to.deep.equal(characterData);
      expect(result.name).to.include('"quotes"');
      expect(result.description).to.include('\n');
      expect(result.consciousness.emotional.notes).to.include('🤖');
    });
  });
});
