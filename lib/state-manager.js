import path from 'path';
import { EventEmitter } from 'events';
import { debug, error } from './logger.js';
import { SaveLoader } from './services/state/save-loader.js';
import { StateSerializer } from './services/state/state-serializer.js';

/**
 * StateManager
 * Minimal persistence orchestrator for prototype phase
 */
export class StateManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.config = {
      saveDirectory: options.saveDirectory || path.join(process.cwd(), 'data', 'saves')
    };
    this.loader = options.saveLoader || new SaveLoader();
    this.serializer = options.serializer || new StateSerializer();
  }

  getSavePath(userId, characterId, storyId) {
    return path.join(this.config.saveDirectory, userId, `${characterId}_${storyId}.json`);
  }

  async saveProgress(userId, characterId, storyId, data) {
    const file = this.getSavePath(userId, characterId, storyId);
    try {
      const content = this.serializer.serialize(data);
      await this.loader.save(file, content);
      this.emit('progressSaved', { userId, characterId, storyId });
      debug(`Saved progress for ${characterId}`);
    } catch (err) {
      error('Failed saving progress', { err });
      this.emit('saveError', err);
      throw err;
    }
  }

  async loadProgress(userId, characterId, storyId) {
    const file = this.getSavePath(userId, characterId, storyId);
    try {
      const exists = await this.loader.exists(file);
      if (!exists) {
        debug(`No save found for ${characterId}`);
        return null;
      }
      const content = await this.loader.load(file);
      const data = this.serializer.deserialize(content);
      this.emit('progressLoaded', { userId, characterId, storyId });
      debug(`Loaded progress for ${characterId}`);
      return data;
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      error('Failed loading progress', { err });
      this.emit('loadError', err);
      throw err;
    }
  }
}

export default StateManager;
