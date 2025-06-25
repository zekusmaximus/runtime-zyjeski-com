import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { StateManager } from '../../../lib/state-manager.js';

describe('StateManager', () => {
  it('saves and loads progress', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'state-'));
    const manager = new StateManager({ saveDirectory: dir });
    const data = { foo: 'bar' };
    await manager.saveProgress('u1', 'c1', 's1', data);
    const loaded = await manager.loadProgress('u1', 'c1', 's1');
    expect(loaded).toEqual(data);
  });
});
