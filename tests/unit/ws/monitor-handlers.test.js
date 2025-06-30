import { describe, it, expect, vi } from 'vitest';
import registerHandlers from '../../../lib/ws-handlers/monitor-handlers.js';

describe('monitor-handlers', () => {
  it('handles start-monitoring event', async () => {
    const handlers = { connectedSockets: new Map([['s1', { joinedRooms: new Set(), isMonitoring: false }]]) };
    const socket = { id: 's1', on: vi.fn(), join: vi.fn(), emit: vi.fn() };

    // Mock consciousness engine with event emitter interface
    const engine = {
      loadCharacter: vi.fn(),
      startMonitoring: vi.fn().mockResolvedValue({}),
      getState: vi.fn().mockResolvedValue({ consciousness: { processes: [] } }),
      // Event emitter methods required by forwardEngineEvent
      on: vi.fn(),
      off: vi.fn()
    };

    const ensure = vi.fn();
    const events = {};
    socket.on.mockImplementation((e, cb) => { events[e] = cb; });

    registerHandlers({ socket, handlers, consciousnessEngine: engine, ensureEngineInitialized: ensure });

    // Trigger the monitor:start event through the registered handler
    const monitorStartHandler = events['monitor:start'];
    expect(monitorStartHandler).toBeDefined();

    // Call the handler directly with the event data
    await monitorStartHandler({ characterId: 'c1' });

    expect(engine.loadCharacter).toHaveBeenCalledWith('c1');
    expect(engine.startMonitoring).toHaveBeenCalledWith('c1', 's1');
    expect(handlers.connectedSockets.get('s1').isMonitoring).toBe(true);
  });
});
