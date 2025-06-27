export async function updateResourceUsage(instance) {
  const systemResources = instance.processManager.getSystemResourceUsage();
  const memoryUsage = instance.memoryState ? instance.memoryState.getResourceUsage() : { memory: 0 };
  const emotionalUsage = instance.emotionalState ? instance.emotionalState.getResourceUsage() : { cpu: 0, memory: 0, threads: 0 };

  instance.usage.cpu = Math.min(100, systemResources.totalCpuUsage + emotionalUsage.cpu);

  instance.usage.memory = Math.min(
    instance.resources.memory.total,
    systemResources.totalMemoryUsage + memoryUsage.memory + emotionalUsage.memory
  );

  instance.usage.threads = Math.min(
    instance.resources.threads.max,
    systemResources.totalThreads + emotionalUsage.threads
  );
}

export function calculateStabilityDelta(instance) {
  let delta = 0;

  if (instance.usage.cpu > 90) delta -= 0.01;
  else if (instance.usage.cpu > 80) delta -= 0.005;

  const recentErrors = instance.state.errors.filter(
    (e) => Date.now() - e.timestamp < 5000
  ).length;
  delta -= recentErrors * 0.02;

  const emotionalIntensity = instance.emotionalState.getTotalIntensity();
  if (emotionalIntensity > 0.8) delta -= 0.01;

  if (instance.usage.cpu < 50 && recentErrors === 0) {
    delta += 0.003;
  }

  return delta;
}

export function calculateCorruptionSpread(instance) {
  if (instance.state.corruption === 0) return 0;

  let spread = 0;
  if (instance.state.stability < 0.3) {
    spread = instance.state.corruption * 0.01;
  } else if (instance.state.stability < 0.5) {
    spread = instance.state.corruption * 0.005;
  }

  const memoryErrors = instance.memoryState.getCorruptedRegions().length;
  spread += memoryErrors * 0.005;

  return spread;
}

export function shouldCascadeError(instance, error) {
  if (error.severity === 'critical') return true;
  if (instance.state.stability < 0.3) return true;
  if (instance.state.corruption > 0.7) return true;
  return false;
}

export async function triggerErrorCascade(instance, error) {
  const related = instance.processManager.getRelatedProcesses(error.source);
  for (const process of related) {
    await instance.processManager.destabilizeProcess(process, 0.2);
  }

  if (error.memoryAddress) {
    await instance.memoryState.corruptRegion(error.memoryAddress, 0.1);
  }

  await instance.emotionalState.intensifyAll(0.1);
  instance.state.stability = Math.max(0, instance.state.stability - 0.1);
}

export function checkSystemHealth(instance) {
  if (instance.state.stability < 0.1) {
    instance.state.status = 'critical';
    instance.events.criticalState(instance.snapshotManager.getState());
  }

  if (instance.state.corruption >= 1) {
    instance.state.status = 'corrupted';
    instance.events.totalCorruption(instance.snapshotManager.getState());
  }

  if (instance.usage.memory >= instance.resources.memory.total) {
    instance.state.status = 'memory_exhausted';
    instance.events.resourceExhaustion({ type: 'memory' });
  }
}

export function cleanErrorLog(instance) {
  const maxAge = 60000;
  const now = Date.now();
  instance.state.errors = instance.state.errors.filter(
    (error) => now - error.timestamp < maxAge
  );
}

export function getStatistics(instance) {
  return {
    uptime: instance.state.uptime,
    stability: instance.state.stability,
    corruption: instance.state.corruption,
    resourceUsage: {
      cpu: instance.usage.cpu,
      memory: `${instance.usage.memory}/${instance.resources.memory.total}MB`,
      threads: `${instance.usage.threads}/${instance.resources.threads.max}`,
    },
    processes: {
      total: instance.processManager.getProcessCount(),
      running: instance.processManager.getRunningCount(),
      errors: instance.processManager.getErrorCount(),
    },
    memory: {
      fragmentation: instance.memoryState.getFragmentation(),
      corrupted: instance.memoryState.getCorruptedRegions().length,
    },
    emotional: {
      primary: instance.emotionalState.getPrimaryEmotion(),
      intensity: instance.emotionalState.getTotalIntensity(),
      volatility: instance.emotionalState.getVolatility(),
    },
  };
}
