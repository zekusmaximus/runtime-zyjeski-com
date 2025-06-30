import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ConsciousnessManager from '../../public/js/consciousness.js';

describe('ConsciousnessManager Monitoring Lifecycle', () => {
  let manager;
  beforeEach(() => {
    global.window = {};

    // Mock stateManager with all required methods
    let isMonitoringActive = false;
    const mockStateManager = {
      set: vi.fn((key, value) => {
        if (key === 'monitoringActive') {
          isMonitoringActive = value;
        }
      }),
      subscribe: vi.fn(),
      loadCharacterState: vi.fn(),
      updateConsciousnessData: vi.fn(),
      getCurrentCharacter: vi.fn(() => ({ id: 'alexander-kane', name: 'Alexander Kane' })),
      getMonitoringActive: vi.fn(() => isMonitoringActive),
      setCurrentCharacter: vi.fn(),
      setMonitoringActive: vi.fn((active) => { isMonitoringActive = active; })
    };

    window.stateManager = mockStateManager;
    window.socketClient = {
      isSocketConnected: () => true,
      startMonitoring: vi.fn(),
      stopMonitoring: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };

    // Create manager with dependency injection
    manager = new ConsciousnessManager({
      stateManager: mockStateManager,
      socketClient: window.socketClient
    });
  });

  afterEach(() => {
    manager.destroy();
    delete global.window;
  });

  it('does not start monitoring on instantiation', () => {
    expect(manager.isMonitoring).toBe(false);
    expect(manager.updateInterval).toBe(null);
  });

  it('starts monitoring only after userStartMonitoring()', () => {
    manager.userStartMonitoring();
    expect(manager.isMonitoring).toBe(true);
    expect(manager.updateInterval).toBe(null);
    expect(window.socketClient.startMonitoring).toHaveBeenCalledWith('alexander-kane');
  });

  it('stops monitoring after userStopMonitoring()', () => {
    // First start monitoring to set up the state
    manager.userStartMonitoring();
    expect(manager.isMonitoring).toBe(true); // Verify it started

    // Then stop monitoring
    manager.userStopMonitoring();
    expect(manager.isMonitoring).toBe(false);
    expect(manager.updateInterval).toBe(null);
    expect(window.socketClient.stopMonitoring).toHaveBeenCalledWith('alexander-kane');
  });

  it('does not start duplicate intervals', () => {
    manager.userStartMonitoring();
    const interval = manager.updateInterval;
    manager.userStartMonitoring();
    expect(manager.updateInterval).toBe(interval);
  });
});
