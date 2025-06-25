import { describe, it, expect, vi } from 'vitest';
import { TriggerChecker } from '../../../lib/narrative/trigger-checker.js';

describe('TriggerChecker', () => {
  it('returns fragments that match', () => {
    const evaluator = { evaluate: vi.fn(() => true) };
    const checker = new TriggerChecker(evaluator);
    const fragments = [{ id: 'a', triggers: {} }, { id: 'b' }];
    const results = checker.evaluateFragments(fragments, { foo: 'bar' });
    expect(results.length).toBe(1);
    expect(results[0].fragment.id).toBe('a');
    expect(evaluator.evaluate).toHaveBeenCalled();
  });
});
