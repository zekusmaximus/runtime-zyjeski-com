import { describe, it, expect } from 'vitest';
import { SchemaLoader } from '../../../lib/engine/schema-loader.js';

// Uses real schema files under data/schema

describe('SchemaLoader', () => {
  it('loads default schemas from disk', async () => {
    const map = new Map();
    const loader = new SchemaLoader(map);
    await loader.load();
    expect(map.size).toBeGreaterThanOrEqual(3);
    expect(map.has('consciousness-schema')).toBe(true);
  });
});
