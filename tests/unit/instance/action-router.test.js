import { describe, it, expect } from 'vitest';
import ActionRouter from '../../../lib/instance/action-router.js';

describe('ActionRouter', () => {
  const fakeInstance = { state: { stability: 1 }, snapshotManager: { save: () => {}, getState: () => ({}) }, processManager: { executeAction: async () => ({ ok: true }) }, memoryState: { executeAction: async () => ({ ok: true }) }, emotionalState: { executeAction: async () => ({ ok: true }) }, executeSystemAction: async () => ({ ok: true }) };

  it('validates actions correctly', () => {
    const router = new ActionRouter(fakeInstance);
    expect(router.isValidAction('ps')).toBe(true);
    expect(router.isValidAction('unknown')).toBe(false);
  });

  it('routes to correct category', () => {
    const router = new ActionRouter(fakeInstance);
    expect(router.getActionCategory('ps')).toBe('process');
    expect(router.getActionCategory('calm')).toBe('emotional');
  });
});
