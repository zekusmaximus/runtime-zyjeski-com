import { describe, it, expect, vi } from 'vitest';
import { TickLoop } from '../../../lib/engine/tick-loop.js';

describe('TickLoop', () => {
  it('starts and stops interval', () => {
    const engine = {
      config: { tickRate: 10 },
      instances: new Map(),
      processEvolution: { evolveProcess: vi.fn(), checkForEmergentProcesses: vi.fn(() => []) },
      narrativeEngine: { checkSystemTriggers: vi.fn(() => []) },
      emit: vi.fn(),
      storyContexts: new Map()
    };
    const loop = new TickLoop(engine);
    vi.useFakeTimers();
    loop.start();
    expect(loop.interval).not.toBeNull();
    vi.advanceTimersByTime(30);
    loop.stop();
    expect(loop.interval).toBeNull();
    vi.useRealTimers();
  });
});
