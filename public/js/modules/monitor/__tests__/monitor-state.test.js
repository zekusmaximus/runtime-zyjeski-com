import { describe, it, expect } from 'vitest';
import MonitorState from '../monitor-state.js';

describe('MonitorState', () => {
  it('updates state fields', () => {
    const state = new MonitorState();
    state.update({ resources: { cpu: 1 }, processes: [1], memory: { m: true }, errors: ['e'] });
    expect(state.resources.cpu).toBe(1);
    expect(state.processes.length).toBe(1);
    expect(state.memory.m).toBe(true);
    expect(state.errors.length).toBe(1);
    expect(state.lastUpdate).not.toBeNull();
  });
});
