import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

/**
 * State Manager
 * Handles persistence and state management across sessions
 */
export class StateManager extends EventEmitter {
  constructor() {
    super();
    
    // Storage configuration
    this.config = {
      saveDirectory: path.join(process.cwd(), 'data', 'saves'),
      maxSavesPerUser: 10,
      autoSaveSlots: 3,
      compressionEnabled: true,
      encryptionEnabled: false // Can be enabled for sensitive data
    };
    
    // In-memory cache
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
    
    // Save metadata tracking
    this.saveMetadata = new Map();
  }

  /**
   * Initialize state manager
   */
  async initialize() {
    // Ensure save directory exists
    await this.ensureSaveDirectory();
    
    // Load save metadata
    await this.loadSaveMetadata();
    
    this.emit('initialized');
  }

  /**
   * Ensure save directory structure exists
   */
  async ensureSaveDirectory() {
    try {
      await fs.mkdir(this.config.saveDirectory, { recursive: true });
      
      // Create subdirectories
      const subdirs = ['users', 'autosaves', 'metadata'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.config.saveDirectory, subdir), { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create save directories:', error);
      throw error;
    }
  }

  /**
   * Save progress for a user
   */
  async saveProgress(userId, characterId, storyId, data) {
    const saveId = this.generateSaveId(userId, characterId, storyId);
    const timestamp = new Date().toISOString();
    
    const saveData = {
      version: '1.0.0',
      saveId,
      userId,
      characterId,
      storyId,
      timestamp,
      data: await this.compressData(data),
      checksum: this.generateChecksum(data)
    };
    
    // Determine save path
    const savePath = this.getSavePath(userId, saveId);
    
    try {
      // Write save file
      await fs.writeFile(
        savePath,
        JSON.stringify(saveData, null, 2),
        'utf8'
      );
      
      // Update metadata
      await this.updateSaveMetadata(userId, saveId, {
        characterId,
        storyId,
        timestamp,
        size: JSON.stringify(saveData).length
      });
      
      // Update cache
      this.cache.set(saveId, {
        data,
        timestamp: Date.now()
      });
      
      // Cleanup old saves
      await this.cleanupOldSaves(userId);
      
      this.emit('progressSaved', {
        userId,
        characterId,
        storyId,
        saveId
      });
      
      return saveId;
      
    } catch (error) {
      this.emit('saveError', {
        userId,
        characterId,
        storyId,
        error
      });
      throw error;
    }
  }

  /**
   * Load progress for a user
   */
  async loadProgress(userId, characterId, storyId) {
    const saveId = this.generateSaveId(userId, characterId, storyId);
    
    // Check cache first
    const cached = this.cache.get(saveId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const savePath = this.getSavePath(userId, saveId);
    
    try {
      // Check if save exists
      await fs.access(savePath);
      
      // Read save file
      const saveContent = await fs.readFile(savePath, 'utf8');
      const saveData = JSON.parse(saveContent);
      
      // Verify checksum
      const decompressed = await this.decompressData(saveData.data);
      if (!this.verifyChecksum(decompressed, saveData.checksum)) {
        throw new Error('Save file corrupted: checksum mismatch');
      }
      
      // Update cache
      this.cache.set(saveId, {
        data: decompressed,
        timestamp: Date.now()
      });
      
      this.emit('progressLoaded', {
        userId,
        characterId,
        storyId,
        saveId
      });
      
      return decompressed;
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        // No save file exists
        return null;
      }
      
      this.emit('loadError', {
        userId,
        characterId,
        storyId,
        error
      });
      throw error;
    }
  }

  /**
   * Create autosave
   */
  async createAutosave(userId, characterId, storyId, data) {
    const slot = await this.getNextAutosaveSlot(userId);
    const autosaveId = `autosave_${userId}_${slot}`;
    
    const saveData = {
      version: '1.0.0',
      type: 'autosave',
      slot,
      userId,
      characterId,
      storyId,
      timestamp: new Date().toISOString(),
      data: await this.compressData(data)
    };
    
    const savePath = path.join(
      this.config.saveDirectory,
      'autosaves',
      `${autosaveId}.json`
    );
    
    await fs.writeFile(
      savePath,
      JSON.stringify(saveData, null, 2),
      'utf8'
    );
    
    return autosaveId;
  }

  /**
   * List saves for a user
   */
  async listSaves(userId) {
    const userSaves = [];
    const metadata = this.saveMetadata.get(userId) || new Map();
    
    for (const [saveId, meta] of metadata) {
      userSaves.push({
        saveId,
        ...meta
      });
    }
    
    // Sort by timestamp (newest first)
    userSaves.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return userSaves;
  }

  /**
   * Delete a save
   */
  async deleteSave(userId, saveId) {
    const savePath = this.getSavePath(userId, saveId);
    
    try {
      await fs.unlink(savePath);
      
      // Remove from metadata
      const userMeta = this.saveMetadata.get(userId);
      if (userMeta) {
        userMeta.delete(saveId);
      }
      
      // Remove from cache
      this.cache.delete(saveId);
      
      this.emit('saveDeleted', { userId, saveId });
      
    } catch (error) {
      this.emit('deleteError', { userId, saveId, error });
      throw error;
    }
  }

  /**
   * Export save data for download
   */
  async exportSave(userId, saveId) {
    const savePath = this.getSavePath(userId, saveId);
    
    const saveContent = await fs.readFile(savePath, 'utf8');
    const saveData = JSON.parse(saveContent);
    
    // Create export package
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      platform: 'runtime.zyjeski.com',
      save: saveData,
      metadata: {
        userId,
        characterId: saveData.characterId,
        storyId: saveData.storyId,
        originalTimestamp: saveData.timestamp
      }
    };
    
    return {
      filename: `runtime-save-${saveId}-${Date.now()}.json`,
      data: JSON.stringify(exportData, null, 2)
    };
  }

  /**
   * Import save data
   */
  async importSave(userId, importData) {
    try {
      const parsed = JSON.parse(importData);
      
      // Validate import format
      if (!parsed.version || !parsed.save || !parsed.metadata) {
        throw new Error('Invalid import format');
      }
      
      // Generate new save ID for imported data
      const saveId = this.generateSaveId(
        userId,
        parsed.metadata.characterId,
        parsed.metadata.storyId
      );
      
      // Update save data with new user ID
      parsed.save.userId = userId;
      parsed.save.saveId = saveId;
      parsed.save.imported = true;
      parsed.save.importDate = new Date().toISOString();
      
      // Save imported data
      const savePath = this.getSavePath(userId, saveId);
      await fs.writeFile(
        savePath,
        JSON.stringify(parsed.save, null, 2),
        'utf8'
      );
      
      // Update metadata
      await this.updateSaveMetadata(userId, saveId, {
        characterId: parsed.metadata.characterId,
        storyId: parsed.metadata.storyId,
        timestamp: new Date().toISOString(),
        imported: true,
        originalTimestamp: parsed.metadata.originalTimestamp
      });
      
      this.emit('saveImported', {
        userId,
        saveId,
        characterId: parsed.metadata.characterId,
        storyId: parsed.metadata.storyId
      });
      
      return saveId;
      
    } catch (error) {
      this.emit('importError', { userId, error });
      throw error;
    }
  }

  /**
   * Transfer progress between stories
   */
  async transferProgress(userId, fromStory, toStory, mappingRules) {
    // Load source progress
    const sourceData = await this.loadProgress(
      userId,
      mappingRules.fromCharacter,
      fromStory
    );
    
    if (!sourceData) {
      throw new Error('No source progress found');
    }
    
    // Apply mapping rules
    const transferredData = this.applyTransferRules(sourceData, mappingRules);
    
    // Save to target story
    return await this.saveProgress(
      userId,
      mappingRules.toCharacter,
      toStory,
      transferredData
    );
  }

  /**
   * Apply transfer rules when moving between stories
   */
  applyTransferRules(sourceData, rules) {
    const transferred = {
      consciousness: {},
      narrative: {},
      timestamp: new Date().toISOString(),
      transferred: true,
      sourceStory: rules.fromStory
    };
    
    // Transfer consciousness state based on rules
    if (rules.transferEmotionalState) {
      transferred.consciousness.emotional = sourceData.consciousness?.emotional;
    }
    
    if (rules.transferStability) {
      transferred.consciousness.stability = sourceData.consciousness?.stability || 1;
      transferred.consciousness.corruption = sourceData.consciousness?.corruption || 0;
    }
    
    if (rules.transferMemoryFragments && sourceData.consciousness?.memory) {
      // Map memory addresses if needed
      transferred.consciousness.memoryFragments = this.mapMemoryFragments(
        sourceData.consciousness.memory,
        rules.memoryMapping
      );
    }
    
    // Transfer narrative progress
    if (rules.transferChoices) {
      transferred.narrative.previousChoices = sourceData.narrative?.choicesMade || [];
    }
    
    if (rules.transferRelationships) {
      transferred.narrative.relationships = this.mapRelationships(
        sourceData.narrative?.relationships,
        rules.relationshipMapping
      );
    }
    
    return transferred;
  }

  /**
   * Map memory fragments between stories
   */
  mapMemoryFragments(sourceMemory, mapping) {
    if (!mapping) return [];
    
    const mapped = [];
    
    for (const fragment of sourceMemory) {
      const mappedAddress = mapping[fragment.address];
      if (mappedAddress) {
        mapped.push({
          address: mappedAddress,
          content: fragment.content,
          transferred: true,
          originalAddress: fragment.address
        });
      }
    }
    
    return mapped;
  }

  /**
   * Map relationships between stories
   */
  mapRelationships(sourceRelationships, mapping) {
    if (!mapping || !sourceRelationships) return {};
    
    const mapped = {};
    
    for (const [character, relationship] of Object.entries(sourceRelationships)) {
      const mappedCharacter = mapping[character];
      if (mappedCharacter) {
        mapped[mappedCharacter] = {
          ...relationship,
          transferred: true,
          originalCharacter: character
        };
      }
    }
    
    return mapped;
  }

  /**
   * Generate save ID
   */
  generateSaveId(userId, characterId, storyId) {
    return `${userId}_${characterId}_${storyId}`;
  }

  /**
   * Get save file path
   */
  getSavePath(userId, saveId) {
    return path.join(
      this.config.saveDirectory,
      'users',
      userId,
      `${saveId}.json`
    );
  }

  /**
   * Compress data for storage
   */
  async compressData(data) {
    if (!this.config.compressionEnabled) {
      return data;
    }
    
    // Simple JSON compression by removing whitespace
    // In production, use proper compression library
    const compressed = JSON.stringify(data);
    return {
      compressed: true,
      data: compressed
    };
  }

  /**
   * Decompress data from storage
   */
  async decompressData(data) {
    if (!data.compressed) {
      return data;
    }
    
    return JSON.parse(data.data);
  }

  /**
   * Generate checksum for data integrity
   */
  generateChecksum(data) {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * Verify checksum
   */
  verifyChecksum(data, checksum) {
    return this.generateChecksum(data) === checksum;
  }

  /**
   * Load save metadata
   */
  async loadSaveMetadata() {
    const metadataPath = path.join(
      this.config.saveDirectory,
      'metadata',
      'saves.json'
    );
    
    try {
      const content = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(content);
      
      // Convert to Map structure
      for (const [userId, saves] of Object.entries(metadata)) {
        this.saveMetadata.set(userId, new Map(Object.entries(saves)));
      }
    } catch (error) {
      // Metadata file doesn't exist yet
      console.log('No save metadata found, starting fresh');
    }
  }

  /**
   * Update save metadata
   */
  async updateSaveMetadata(userId, saveId, metadata) {
    // Ensure user directory exists
    const userDir = path.join(this.config.saveDirectory, 'users', userId);
    await fs.mkdir(userDir, { recursive: true });
    
    // Update in-memory metadata
    if (!this.saveMetadata.has(userId)) {
      this.saveMetadata.set(userId, new Map());
    }
    
    const userMeta = this.saveMetadata.get(userId);
    userMeta.set(saveId, metadata);
    
    // Persist metadata
    await this.persistMetadata();
  }

  /**
   * Persist metadata to disk
   */
  async persistMetadata() {
    const metadataPath = path.join(
      this.config.saveDirectory,
      'metadata',
      'saves.json'
    );
    
    // Convert Map to object for JSON serialization
    const metadata = {};
    for (const [userId, saves] of this.saveMetadata) {
      metadata[userId] = Object.fromEntries(saves);
    }
    
    await fs.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
  }

  /**
   * Clean up old saves
   */
  async cleanupOldSaves(userId) {
    const userSaves = await this.listSaves(userId);
    
    if (userSaves.length > this.config.maxSavesPerUser) {
      // Remove oldest saves
      const toDelete = userSaves
        .slice(this.config.maxSavesPerUser)
        .map(save => save.saveId);
      
      for (const saveId of toDelete) {
        await this.deleteSave(userId, saveId);
      }
    }
  }

  /**
   * Get next autosave slot
   */
  async getNextAutosaveSlot(userId) {
    // Rotate through autosave slots
    const metadataPath = path.join(
      this.config.saveDirectory,
      'metadata',
      `autosave_${userId}.json`
    );
    
    let currentSlot = 0;
    
    try {
      const content = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(content);
      currentSlot = metadata.lastSlot || 0;
    } catch (error) {
      // No metadata yet
    }
    
    // Increment and wrap
    const nextSlot = (currentSlot + 1) % this.config.autoSaveSlots;
    
    // Save slot metadata
    await fs.writeFile(
      metadataPath,
      JSON.stringify({ lastSlot: nextSlot }),
      'utf8'
    );
    
    return nextSlot;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const stats = {
      totalUsers: this.saveMetadata.size,
      totalSaves: 0,
      cacheSize: this.cache.size,
      storageUsed: 0
    };
    
    for (const [userId, saves] of this.saveMetadata) {
      stats.totalSaves += saves.size;
    }
    
    // Calculate storage used
    try {
      const saveDir = path.join(this.config.saveDirectory, 'users');
      stats.storageUsed = await this.calculateDirectorySize(saveDir);
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
    }
    
    return stats;
  }

  /**
   * Calculate directory size
   */
  async calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        
        if (file.isDirectory()) {
          totalSize += await this.calculateDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.error('Error calculating directory size:', error);
    }
    
    return totalSize;
  }
}