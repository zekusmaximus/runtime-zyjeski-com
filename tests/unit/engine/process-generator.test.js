import { describe, it, expect } from 'vitest';
import { ProcessGenerator } from '../../../lib/process-generator.js';

describe('ProcessGenerator', () => {
  it('creates memory review process for grief', () => {
    const gen = new ProcessGenerator();
    const proc = gen.generateFromEmotionalState('grief', { id: 'a1' });
    expect(proc.name).toContain('memory_review');
  });

  it('returns null for unknown emotion', () => {
    const gen = new ProcessGenerator();
    const proc = gen.generateFromEmotionalState('unknown', {});
    expect(proc).toBeNull();
  });
});
