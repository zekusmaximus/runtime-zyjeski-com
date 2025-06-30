import { validate } from 'jsonschema';
import { ConsciousnessInstance } from '../consciousness-instance.js';
import { CharacterRepository } from './CharacterRepository.js';

export class CharacterLoader {
  constructor(engine) {
    this.engine = engine;
    this.characterRepository = new CharacterRepository();
  }

  async loadCharacter(characterId, options = {}) {
    if (this.engine.instances.has(characterId)) {
      console.log(`Character ${characterId} already loaded`);
      return this.engine.instances.get(characterId);
    }
    if (this.engine.instances.size >= this.engine.config.maxInstances) {
      throw new Error('Maximum consciousness instances reached');
    }
    const data = await this.loadCharacterData(characterId);
    const schema = this.engine.schemas.get('consciousness-schema');
    if (!schema) {
      throw new Error('Consciousness schema not loaded. Engine may not be properly initialized.');
    }
    const validation = validate(data, schema);
    if (!validation.valid) {
      throw new Error(`Invalid consciousness data: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    const instance = new ConsciousnessInstance({
      ...data,
      engine: this.engine,
      dynamicProcessing: options.enableDynamic ?? true,
      difficultyLevel: options.difficulty ?? 'intermediate',
      debugMode: options.debugMode ?? this.engine.config.debugMode
    });
    if (options.storyContext) {
      this.engine.storyContexts.set(characterId, options.storyContext);
      await this.engine.narrativeEngine.loadStoryFragments(options.storyContext.storyId);
    }
    const startingState = options.startingState ?? data.defaultState;
    await instance.initialize(startingState);
    this.engine.instances.set(characterId, instance);
    this.engine.emit('characterLoaded', { characterId, instance });
    console.log(`Character ${characterId} loaded successfully`);
    if (options.loadProgress) {
      const progress = await this.engine.stateManager.loadProgress(
        options.userId,
        characterId,
        options.storyContext?.storyId
      );
      if (progress) {
        await instance.restoreState(progress);
      }
    }
    return instance;
  }

  async loadCharacterData(characterId) {
    return this.characterRepository.loadCharacterData(characterId);
  }

  async loadStoryConfig(storyId) {
    const storyPath = join(resolveDataPath('stories', storyId), 'story-config.json');
    const data = await fs.readFile(storyPath, 'utf8');
    const config = JSON.parse(data);
    const validation = validate(config, this.engine.schemas.get('story-schema'));
    if (!validation.valid) {
      throw new Error(`Invalid story configuration: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    return config;
  }

  async unloadCharacter(characterId) {
    const instance = this.engine.instances.get(characterId);
    if (!instance) return;
    await instance.shutdown();
    this.engine.instances.delete(characterId);
    this.engine.storyContexts.delete(characterId);
    this.engine.emit('characterUnloaded', { characterId });
  }
}
