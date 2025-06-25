import { describe, it, expect, vi } from 'vitest';
import { FragmentLoader } from '../../../lib/narrative/fragment-loader.js';

describe('FragmentLoader', () => {
  it('indexes fragments by story and id', async () => {
    const loader = new FragmentLoader();
    loader.loadFragmentType = vi.fn(async () => [{ id: 'f1', content: 'hi' }]);
    await loader.loadStoryFragments('story1');
    const frags = loader.getFragments('story1:process-triggers');
    expect(frags.length).toBe(1);
    expect(loader.getFragmentById('f1').content).toBe('hi');
  });
});
