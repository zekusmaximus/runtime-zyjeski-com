import { describe, it, expect, vi } from 'vitest';
import SnapshotManager from '../../../lib/instance/snapshot-manager.js';

describe('SnapshotManager', () => {
  const instance = {
    state: { errors: [] },
    usage: { cpu: 1, memory: 2, threads: 1 },
    resources: { memory: { total: 100 } },
    processManager: {
      getSystemResourceUsage: vi.fn(() => ({ totalMemoryUsage: 2, memoryPercentage: 2 })),
      getProcessList: vi.fn(() => []),
      captureState: vi.fn(() => 'pstate'),
      restoreState: vi.fn()
    },
    memoryState: {
      getState: vi.fn(() => ({})),
      getMemoryStatus: vi.fn(() => ({ capacity: { used: 2, total: 100, available: 98 } })),
      captureState: vi.fn(() => 'mstate'),
      restoreState: vi.fn()
    },
    emotionalState: {
      captureState: vi.fn(() => 'estate'),
      restoreState: vi.fn()
    },
    events: { stateRestored: vi.fn() }
  };

  it('captures and restores state', async () => {
    const manager = new SnapshotManager(instance);
    const snap = manager.capture();
    expect(snap.processes).toBe('pstate');
    manager.save();
    expect(manager.history.length).toBe(1);
    await manager.restore(snap);
    expect(instance.events.stateRestored).toHaveBeenCalled();
  });
});
