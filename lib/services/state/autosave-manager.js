import { debug } from '../../logger.js';

export class AutosaveManager {
  constructor(stateManager, getTargets, interval = 30000) {
    this.stateManager = stateManager;
    this.getTargets = getTargets; // function returning array of {userId, characterId, storyId, data}
    this.interval = interval;
    this.timer = null;
  }

  start() {
    if (this.timer) return;
    debug('Starting autosave manager');
    this.timer = setInterval(() => this.autosave(), this.interval);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  async autosave() {
    const targets = this.getTargets ? this.getTargets() : [];
    for (const t of targets) {
      try {
        await this.stateManager.saveProgress(t.userId, t.characterId, t.storyId, t.data);
      } catch (err) {
        debug('Autosave failed', { err });
      }
    }
  }
}

export default AutosaveManager;
