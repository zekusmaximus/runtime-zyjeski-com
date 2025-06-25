export class TickLoop {
  constructor(engine) {
    this.engine = engine;
    this.interval = null;
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.systemTick();
    }, this.engine.config.tickRate);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async systemTick() {
    for (const [characterId, instance] of this.engine.instances) {
      try {
        const updates = await instance.tick();
        const gameState = instance.getState();
        for (const process of instance.processManager.processes.values()) {
          const evolved = this.engine.processEvolution.evolveProcess(process, gameState);
          Object.assign(process, evolved);
        }
        const emergent = this.engine.processEvolution.checkForEmergentProcesses(gameState);
        if (emergent.length > 0) {
          emergent.forEach(p => {
            instance.processManager.processes.set(p.pid, p);
          });
        }
        const storyContext = this.engine.storyContexts.get(characterId);
        if (storyContext && updates.stateChanges.length > 0) {
          const events = await this.engine.narrativeEngine.checkSystemTriggers(
            instance.getState(),
            updates,
            storyContext
          );
          if (events.length > 0) {
            await this.engine.applyNarrativeEffects(instance, events, storyContext);
          }
        }
        if (updates.hasChanges) {
          this.engine.emit('stateUpdate', {
            characterId,
            updates,
            state: instance.getState()
          });
        }
      } catch (err) {
        this.engine.emit('tickError', { characterId, error: err });
      }
    }
  }
}
