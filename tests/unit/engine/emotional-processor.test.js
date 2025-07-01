import { describe, it, expect } from 'vitest';
import EmotionalProcessor from '../../../lib/emotional-processor.js';

describe('EmotionalProcessor', () => {
  it('updates dominant emotion after modification', async () => {
    const proc = new EmotionalProcessor({}, { initialState: { grief: 0.2 } });
    await proc.initialize();
    proc.modifyEmotion('joy', 0.8);
    expect(proc.getPrimaryEmotion()).toBe('joy');
  });

  it('intensifies all emotions', () => {
    const proc = new EmotionalProcessor({}, { initialState: { anger: 0.2, joy: 0.1 } });
    proc.intensifyAll(0.1);
    expect(proc.getTotalIntensity()).toBeCloseTo(0.6, 2);
  });

  it('shuts down gracefully', async () => {
    const proc = new EmotionalProcessor({}, { initialState: { grief: 0.5 } });
    await proc.initialize();

    const result = await proc.shutdown();
    expect(result).toBe(true);

    // Processor should still be functional after shutdown (just logged)
    expect(proc.getTotalIntensity()).toBeCloseTo(0.5, 2);
  });
});
