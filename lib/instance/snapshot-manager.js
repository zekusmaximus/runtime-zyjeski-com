export default class SnapshotManager {
  constructor(instance) {
    this.instance = instance;
    this.history = [];
    this.maxHistorySize = 10;
  }

  getState() {
    // Make sure resource usage is up to date before generating state
    if (this.instance.processManager) {
      // Calculate current resource usage from processes
      const systemResources = this.instance.processManager.getSystemResourceUsage();
      const memoryUsage = this.instance.memoryState ? this.instance.memoryState.getResourceUsage() : { memory: 0 };
      const emotionalUsage = this.instance.emotionalState ? this.instance.emotionalState.getResourceUsage() : { cpu: 0, memory: 0, threads: 0 };

      // Update usage calculations using actual process data
      this.instance.usage.cpu = systemResources.totalCpuUsage || 0;
      this.instance.usage.memory = systemResources.totalMemoryUsage || 0;
      this.instance.usage.threads = systemResources.totalThreads || 0;
    }

    const systemResources = this.instance.processManager
      ? this.instance.processManager.getSystemResourceUsage()
      : {};
    const memoryState = this.instance.memoryState
      ? this.instance.memoryState.getState()
      : {};
    const memoryStatus = this.instance.memoryState
      ? this.instance.memoryState.getMemoryStatus()
      : {};

    const cpu = {
      used: this.instance.usage.cpu || 0,
      total: 100,
      percentage: this.instance.usage.cpu || 0,
    };
    const memory = {
      processUsage: systemResources.totalMemoryUsage || 0,
      processPercentage: systemResources.memoryPercentage || 0,
      used: memoryStatus.capacity?.used || this.instance.usage.memory || 0,
      total:
        memoryStatus.capacity?.total ||
        (this.instance.resources && this.instance.resources.memory
          ? this.instance.resources.memory.total
          : 10000),
      available:
        memoryStatus.capacity?.available ||
        ((this.instance.resources && this.instance.resources.memory
          ? this.instance.resources.memory.total
          : 10000) -
          (this.instance.usage.memory || 0)),
      percentage: (() => {
        if (
          memoryStatus.capacity &&
          typeof memoryStatus.capacity.used === 'number' &&
          typeof memoryStatus.capacity.total === 'number' &&
          memoryStatus.capacity.total > 0
        ) {
          const calc =
            (memoryStatus.capacity.used / memoryStatus.capacity.total) * 100;
          return isNaN(calc) ? 0 : calc;
        }
        const memoryUsed = this.instance.usage.memory || 0;
        const memoryTotal = this.instance.resources && this.instance.resources.memory
          ? this.instance.resources.memory.total
          : 10000;
        const calc = (memoryUsed / memoryTotal) * 100;
        return isNaN(calc) ? 0 : calc;
      })(),
    };
    const threads = {
      used: this.instance.usage.threads || 0,
      total: this.instance.resources && this.instance.resources.threads
        ? this.instance.resources.threads.max
        : 16,
      percentage:
        ((this.instance.usage.threads || 0) /
          (this.instance.resources && this.instance.resources.threads
            ? this.instance.resources.threads.max
            : 16)) * 100,
    };

    return {
      consciousness: {
        processes: this.instance.processManager
          ? this.instance.processManager.getProcessList()
          : [],
        memory: memoryState,
        resources: { cpu, memory, threads },
        system_errors: this.instance.state.errors.slice(-5),
        threads: [],
      },
      timestamp: Date.now(),
    };
  }

  capture() {
    return {
      core: { ...this.instance.state },
      resources: { ...this.instance.usage },
      processes: this.instance.processManager.captureState(),
      memory: this.instance.memoryState.captureState(),
      emotional: this.instance.emotionalState.captureState(),
      timestamp: Date.now(),
    };
  }

  save() {
    const snapshot = this.capture();
    this.history.push(snapshot);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  async restore(saved) {
    this.instance.state = { ...saved.core };
    this.instance.usage = { ...saved.resources };

    await this.instance.processManager.restoreState(saved.processes);
    await this.instance.memoryState.restoreState(saved.memory);
    await this.instance.emotionalState.restoreState(saved.emotional);

    this.instance.events.stateRestored(saved);
  }
}
