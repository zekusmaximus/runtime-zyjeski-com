import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConsciousnessManager } from '../../public/js/consciousness.js';

describe('ConsciousnessManager Monitoring Lifecycle', () => {
  let manager;
  beforeEach(() => {
    global.window = {};
    window.stateManager = {
      set: vi.fn(),
      subscribe: vi.fn(),
      loadCharacterState: vi.fn(),
      updateConsciousnessData: vi.fn()
    };
    window.socketClient = {
      isSocketConnected: () => true,
      startMonitoring: vi.fn(),
      stopMonitoring: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };
    manager = new ConsciousnessManager();
    manager.currentCharacter = { id: 'alexander-kane', name: 'Alexander Kane' };
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
    expect(manager.updateInterval).not.toBe(null);
    expect(window.socketClient.startMonitoring).toHaveBeenCalledWith('alexander-kane');
  });

  it('stops monitoring after userStopMonitoring()', () => {
    manager.userStartMonitoring();
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
