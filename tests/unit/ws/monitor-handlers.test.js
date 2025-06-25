import { describe, it, expect, vi } from 'vitest';
import registerHandlers from '../../../lib/ws-handlers/monitor-handlers.js';

describe('monitor-handlers', () => {
  it('handles start-monitoring event', async () => {
    const handlers = { connectedSockets: new Map([['s1', { joinedRooms: new Set() }]]) };
    const socket = { id: 's1', on: vi.fn(), join: vi.fn(), emit: vi.fn() };
    const engine = { loadCharacter: vi.fn(), startMonitoring: vi.fn().mockResolvedValue({}) };
    const ensure = vi.fn();
    const events = {};
    socket.on.mockImplementation((e, cb) => { events[e] = cb; });

    registerHandlers({ socket, handlers, consciousnessEngine: engine, ensureEngineInitialized: ensure });

    await events['start-monitoring']({ characterId: 'c1' });

    expect(engine.loadCharacter).toHaveBeenCalledWith('c1');
    expect(engine.startMonitoring).toHaveBeenCalledWith('c1', 's1');
    expect(handlers.connectedSockets.get('s1').isMonitoring).toBe(true);
  });
});
