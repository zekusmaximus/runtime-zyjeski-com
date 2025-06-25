import { describe, it, expect, vi } from 'vitest';
import { ConsciousnessEngine } from '../../../lib/consciousness-engine.js';

describe('ConsciousnessEngine', () => {
  it('initializes and starts tick loop', async () => {
    const engine = new ConsciousnessEngine();
    engine.schemaLoader.load = vi.fn().mockResolvedValue();
    engine.processGenerator.initialize = vi.fn().mockResolvedValue();
    engine.narrativeEngine.initialize = vi.fn().mockResolvedValue();
    engine.tickLoop.start = vi.fn();
    engine.autosaveManager.start = vi.fn();

    await engine.initialize();

    expect(engine.isInitialized).toBe(true);
    expect(engine.tickLoop.start).toHaveBeenCalled();

    engine.stopSystemTick();
    expect(engine.isRunning).toBe(false);
  });
});
