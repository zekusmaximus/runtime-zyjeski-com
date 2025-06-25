export class MonitorResponder {
  constructor(engine) {
    this.engine = engine;
    this.monitoringSockets = new Map();
    this.broadcastInterval = null;
  }

  startRealTimeBroadcasting() {
    console.log('\uD83D\uDD34 Real-time broadcasting disabled - using on-demand updates only');
    return;
  }

  stopRealTimeBroadcasting() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  async broadcastStateChange(characterId, changeType = 'state-change') {
    if (this.monitoringSockets.size === 0) return;
    for (const [socketId, monitoring] of this.monitoringSockets) {
      if (monitoring.characterId !== characterId) continue;
      const instance = this.engine.instances.get(characterId);
      if (!instance) {
        this.monitoringSockets.delete(socketId);
        continue;
      }
      const state = await this.engine.getState(characterId);
      this.engine.emit('consciousness-update', {
        socketId,
        characterId,
        state,
        timestamp: Date.now(),
        type: changeType
      });
      monitoring.lastUpdate = Date.now();
    }
  }

  async startMonitoring(characterId, socketId) {
    const instance = this.engine.instances.get(characterId);
    if (!instance) {
      throw new Error(`No consciousness loaded: ${characterId}`);
    }
    this.monitoringSockets.set(socketId, {
      characterId,
      startTime: Date.now(),
      lastUpdate: Date.now()
    });
    if (this.monitoringSockets.size === 1) {
      this.startRealTimeBroadcasting();
    }
    const initialState = await this.engine.getState(characterId);
    this.engine.emit('monitoringStarted', {
      characterId,
      socketId,
      initialState: {
        consciousness: initialState.consciousness,
        processes: initialState.processes,
        system_errors: initialState.system_errors,
        threads: initialState.threads
      }
    });
    setTimeout(() => {
      this.engine.emit('consciousness-update', {
        socketId,
        characterId,
        state: {
          consciousness: initialState.consciousness,
          processes: initialState.processes,
          system_errors: initialState.system_errors,
          threads: initialState.threads
        },
        timestamp: Date.now(),
        type: 'initial-update'
      });
    }, 100);
    return {
      success: true,
      message: `Monitoring started for ${characterId}`,
      characterId,
      socketId
    };
  }

  async stopMonitoring(socketId) {
    if (!this.monitoringSockets.has(socketId)) return;
    const monitoring = this.monitoringSockets.get(socketId);
    this.monitoringSockets.delete(socketId);
    if (this.monitoringSockets.size === 0) {
      this.stopRealTimeBroadcasting();
    }
    this.engine.emit('monitoringStopped', {
      characterId: monitoring.characterId,
      socketId,
      duration: Date.now() - monitoring.startTime
    });
  }
}
