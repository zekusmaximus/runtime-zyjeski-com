export class AutosaveManager {
  constructor(engine) {
    this.engine = engine;
    this.interval = null;
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.autosaveAll();
    }, this.engine.config.autosaveInterval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async autosaveAll() {
    for (const [characterId, instance] of this.engine.instances) {
      const ctx = this.engine.storyContexts.get(characterId);
      if (ctx?.userId) {
        await this.engine.saveProgress(ctx.userId, characterId, ctx.storyId);
      }
    }
  }
}
