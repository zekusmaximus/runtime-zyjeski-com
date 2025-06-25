import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { SaveLoader } from '../../../lib/services/state/save-loader.js';

describe('SaveLoader', () => {
  it('writes and reads a file', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'saveload-'));
    const file = path.join(dir, 'test.json');
    const loader = new SaveLoader();

    await loader.save(file, 'hello');
    const content = await loader.load(file);
    expect(content).toBe('hello');
  });
});
