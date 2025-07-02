import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EventBus from '../../../lib/events/EventBus.js';

describe('EventBus Core', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = new EventBus({
      historySize: 10,
      performanceThreshold: 5,
      enableWildcards: true,
      debugMode: false
    });
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe('Basic Event Handling', () => {
    it('should emit and receive events', () => {
      const handler = vi.fn();
      eventBus.on('ProcessCreated', handler);
      
      const event = eventBus.emit('ProcessCreated', { processId: 'test_001' });
      
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'ProcessCreated',
        data: { processId: 'test_001' }
      }));
      expect(event.id).toMatch(/^evt_\d+_[a-z0-9]+$/);
    });

    it('should support multiple listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      
      eventBus.on('ProcessTerminated', handler1);
      eventBus.on('ProcessTerminated', handler2);
      eventBus.on('ProcessTerminated', handler3);
      
      eventBus.emit('ProcessTerminated', { processId: 'test_002' });
      
      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
      expect(handler3).toHaveBeenCalledOnce();
    });

    it('should handle one-time listeners', () => {
      const handler = vi.fn();
      eventBus.once('CommandExecuted', handler);
      
      eventBus.emit('CommandExecuted', { command: 'test' });
      eventBus.emit('CommandExecuted', { command: 'test2' });
      
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'CommandExecuted',
        data: { command: 'test' }
      }));
    });

    it('should remove listeners correctly', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.on('MemoryAllocated', handler1);
      eventBus.on('MemoryAllocated', handler2);
      
      eventBus.off('MemoryAllocated', handler1);
      eventBus.emit('MemoryAllocated', { size: 1024 });
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it('should remove all listeners for an event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.on('ProcessOptimized', handler1);
      eventBus.on('ProcessOptimized', handler2);
      
      eventBus.removeAllListeners('ProcessOptimized');
      eventBus.emit('ProcessOptimized', { processId: 'test_003' });
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Wildcard Pattern Matching', () => {
    it('should match wildcard patterns', () => {
      const handler = vi.fn();
      eventBus.on('process.*', handler);
      
      eventBus.emit('process.created', { id: 1 });
      eventBus.emit('process.terminated', { id: 2 });
      eventBus.emit('memory.allocated', { size: 1024 });
      
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should match suffix wildcards', () => {
      const handler = vi.fn();
      eventBus.on('*.created', handler);
      
      eventBus.emit('process.created', { id: 1 });
      eventBus.emit('memory.created', { id: 2 });
      eventBus.emit('process.terminated', { id: 3 });
      
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should handle wildcard once listeners', () => {
      const handler = vi.fn();
      eventBus.once('command.*', handler);
      
      eventBus.emit('command.executed', { cmd: 'test1' });
      eventBus.emit('command.failed', { cmd: 'test2' });
      
      expect(handler).toHaveBeenCalledOnce();
    });

    it('should remove wildcard listeners', () => {
      const handler = vi.fn();
      eventBus.on('test.*', handler);
      
      eventBus.emit('test.event', {});
      expect(handler).toHaveBeenCalledOnce();
      
      eventBus.off('test.*', handler);
      eventBus.emit('test.event', {});
      expect(handler).toHaveBeenCalledOnce(); // Still only once
    });

    it('should disable wildcards when configured', () => {
      const busNoWildcards = new EventBus({ enableWildcards: false });

      expect(() => {
        busNoWildcards.on('test.*', vi.fn());
      }).toThrow('Wildcard patterns are disabled');
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics', () => {
      const handler = vi.fn();
      eventBus.on('ProcessCreated', handler);
      
      eventBus.emit('ProcessCreated', { processId: 'perf_test' });
      
      const metrics = eventBus.getPerformanceMetrics();
      expect(metrics.ProcessCreated).toBeDefined();
      expect(metrics.ProcessCreated.totalEvents).toBe(1);
      expect(metrics.ProcessCreated.avgDispatchTime).toBeGreaterThanOrEqual(0);
    });

    it('should maintain event history', () => {
      eventBus.emit('ProcessCreated', { id: 1 });
      eventBus.emit('ProcessTerminated', { id: 2 });
      
      const history = eventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('ProcessCreated');
      expect(history[1].type).toBe('ProcessTerminated');
    });

    it('should limit history size', () => {
      const smallBus = new EventBus({ historySize: 3 });
      
      for (let i = 0; i < 5; i++) {
        smallBus.emit('TestEvent', { id: i });
      }
      
      const history = smallBus.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].data.id).toBe(2); // Oldest kept
      expect(history[2].data.id).toBe(4); // Newest
    });

    it('should track frequency statistics', () => {
      eventBus.emit('ProcessCreated', { id: 1 });
      eventBus.emit('ProcessCreated', { id: 2 });
      
      const stats = eventBus.getFrequencyStats();
      expect(stats.ProcessCreated).toBeDefined();
      expect(stats.ProcessCreated.count).toBe(2);
      expect(stats.ProcessCreated.firstSeen).toBeLessThanOrEqual(stats.ProcessCreated.lastSeen);
    });
  });

  describe('Error Handling', () => {
    it('should handle listener errors gracefully', () => {
      const goodHandler = vi.fn();
      const badHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      
      eventBus.on('TestEvent', goodHandler);
      eventBus.on('TestEvent', badHandler);
      
      // Should not throw
      expect(() => {
        eventBus.emit('TestEvent', { data: 'test' });
      }).not.toThrow();
      
      expect(goodHandler).toHaveBeenCalledOnce();
      expect(badHandler).toHaveBeenCalledOnce();
    });

    it('should validate handler functions', () => {
      expect(() => {
        eventBus.on('TestEvent', 'not a function');
      }).toThrow('Event handler must be a function');
      
      expect(() => {
        eventBus.once('TestEvent', null);
      }).toThrow('Event handler must be a function');
    });
  });

  describe('Utility Methods', () => {
    it('should check for listeners', () => {
      expect(eventBus.hasListeners('NonExistent')).toBe(false);
      
      eventBus.on('TestEvent', vi.fn());
      expect(eventBus.hasListeners('TestEvent')).toBe(true);
    });

    it('should count listeners', () => {
      expect(eventBus.listenerCount('TestEvent')).toBe(0);
      
      eventBus.on('TestEvent', vi.fn());
      eventBus.on('TestEvent', vi.fn());
      eventBus.once('TestEvent', vi.fn());
      
      expect(eventBus.listenerCount('TestEvent')).toBe(3);
    });

    it('should count wildcard listeners', () => {
      eventBus.on('test.*', vi.fn());
      eventBus.on('test.*', vi.fn());
      
      expect(eventBus.listenerCount('test.event')).toBe(2);
    });

    it('should support method chaining', () => {
      const handler = vi.fn();
      
      const result = eventBus
        .on('Event1', handler)
        .on('Event2', handler)
        .once('Event3', handler);
      
      expect(result).toBe(eventBus);
    });
  });

  describe('Supported Event Types', () => {
    const supportedEvents = [
      'ProcessCreated',
      'ProcessTerminated',
      'CommandExecuted',
      'MemoryAllocated',
      'ProcessOptimized'
    ];

    supportedEvents.forEach(eventType => {
      it(`should handle ${eventType} events`, () => {
        const handler = vi.fn();
        eventBus.on(eventType, handler);

        const event = eventBus.emit(eventType, { test: true });

        expect(handler).toHaveBeenCalledOnce();
        expect(event.type).toBe(eventType);
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should perform under load (1000 events/sec)', () => {
      const handlers = Array.from({ length: 10 }, () => vi.fn());
      handlers.forEach(handler => eventBus.on('PerformanceTest', handler));

      const startTime = performance.now();
      const eventCount = 1000;

      for (let i = 0; i < eventCount; i++) {
        eventBus.emit('PerformanceTest', { iteration: i });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const eventsPerSecond = (eventCount / totalTime) * 1000;

      expect(eventsPerSecond).toBeGreaterThan(1000);
      expect(totalTime).toBeLessThan(1000); // Should complete in under 1 second

      // Verify all handlers were called for all events
      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledTimes(eventCount);
      });
    });

    it('should dispatch events in <1ms for 10 listeners', () => {
      const handlers = Array.from({ length: 10 }, () => vi.fn());
      handlers.forEach(handler => eventBus.on('SpeedTest', handler));

      const event = eventBus.emit('SpeedTest', { test: 'performance' });

      expect(event.performance.dispatchTime).toBeLessThan(1);
      expect(event.performance.listenerCount).toBe(10);

      // Verify all handlers were called
      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledOnce();
      });
    });

    it('should handle wildcard matching efficiently', () => {
      const handler = vi.fn();
      eventBus.on('performance.*', handler);

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        eventBus.emit('performance.test', { iteration: i });
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;

      expect(avgTime).toBeLessThan(0.1); // <0.1ms per wildcard match
      expect(handler).toHaveBeenCalledTimes(100);
    });

    it('should maintain performance with mixed event types', () => {
      const handlers = new Map();
      const eventTypes = ['ProcessCreated', 'ProcessTerminated', 'CommandExecuted', 'MemoryAllocated', 'ProcessOptimized'];

      // Set up handlers for each event type
      eventTypes.forEach(type => {
        const handler = vi.fn();
        handlers.set(type, handler);
        eventBus.on(type, handler);
      });

      // Add wildcard handlers for process events (using dot-separated format)
      const processWildcardHandler = vi.fn();
      eventBus.on('process.*', processWildcardHandler);

      const startTime = performance.now();
      const eventsPerType = 50;

      // Emit events in mixed order
      for (let i = 0; i < eventsPerType; i++) {
        eventTypes.forEach(type => {
          eventBus.emit(type, { iteration: i });
        });
        // Also emit some dot-separated process events for wildcard testing
        eventBus.emit('process.created', { iteration: i });
        eventBus.emit('process.terminated', { iteration: i });
      }

      const endTime = performance.now();
      const totalEvents = (eventTypes.length + 2) * eventsPerType; // +2 for the dot-separated events
      const avgDispatchTime = (endTime - startTime) / totalEvents;

      expect(avgDispatchTime).toBeLessThan(1); // <1ms average dispatch

      // Verify all handlers were called correctly
      handlers.forEach((handler) => {
        expect(handler).toHaveBeenCalledTimes(eventsPerType);
      });

      // Wildcard handler should catch the dot-separated process events
      expect(processWildcardHandler).toHaveBeenCalledTimes(eventsPerType * 2);
    });
  });
});
