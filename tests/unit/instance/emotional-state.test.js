import { describe, it, expect, vi } from 'vitest';
import EmotionalState from '../../../lib/instance/emotional-state.js';

const fakeProcessor = {
  initialize: vi.fn().mockResolvedValue('init'),
  tick: vi.fn().mockResolvedValue('tick'),
  modifyEmotion: vi.fn().mockResolvedValue('mod'),
  captureState: vi.fn(() => ({ e: 1 })),
  restoreState: vi.fn(),
  getPrimaryEmotion: vi.fn(() => 'happy'),
  getTotalIntensity: vi.fn(() => 5),
  getVolatility: vi.fn(() => 1),
  generateProfile: vi.fn(() => ({ mood: 'ok' })),
  intensifyAll: vi.fn(),
  executeAction: vi.fn()
};

describe('EmotionalState', () => {
  it('delegates to EmotionalProcessor', async () => {
    const state = new EmotionalState({ id: 1 }, {});
    state.processor = fakeProcessor;
    await state.initialize();
    await state.tick();
    await state.modifyEmotion('joy', 1, 10);
    expect(fakeProcessor.initialize).toHaveBeenCalled();
    expect(fakeProcessor.tick).toHaveBeenCalled();
    expect(fakeProcessor.modifyEmotion).toHaveBeenCalledWith('joy', 1, 10);
    expect(state.getPrimaryEmotion()).toBe('happy');
  });
});
