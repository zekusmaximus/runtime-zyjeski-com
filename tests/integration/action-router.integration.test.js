import { describe, it, expect, vi } from 'vitest';
import ActionRouter from '../../lib/instance/action-router.js';
import SnapshotManager from '../../lib/instance/snapshot-manager.js';

const createInstance = () => {
  const instance = {
    state: { stability: 1, errors: [] },
    usage: {},
    resources: { memory: { total: 100 }, threads: { max: 10 } },
    processManager: {
      executeAction: vi.fn().mockResolvedValue({}),
      getResourceUsage: vi.fn(() => ({})),
      getSystemResourceUsage: vi.fn(() => ({})),
      captureState: vi.fn(() => 'pstate'),
      restoreState: vi.fn(),
      getProcessList: vi.fn(() => [])
    },
    memoryState: {
      executeAction: vi.fn().mockResolvedValue({}),
      getResourceUsage: vi.fn(() => ({})),
      getState: vi.fn(() => ({})),
      getMemoryStatus: vi.fn(() => ({ capacity: { used: 0, total: 100, available: 100 } })),
      captureState: vi.fn(() => 'mstate'),
      restoreState: vi.fn()
    },
    emotionalState: {
      executeAction: vi.fn().mockResolvedValue({}),
      getResourceUsage: vi.fn(() => ({})),
      captureState: vi.fn(() => 'estate'),
      restoreState: vi.fn()
    },
    events: { stateRestored: vi.fn() }
  };
  instance.snapshotManager = new SnapshotManager(instance);
  return instance;
};

describe('ActionRouter integration', () => {
  it('saves snapshot before executing action', async () => {
    const instance = createInstance();
    const router = new ActionRouter(instance);
    await router.execute('ps');
    expect(instance.snapshotManager.history.length).toBe(1);
  });
});
