import { describe, it, expect } from 'vitest';
import EventBus from '../../lib/events/EventBus.js';

describe('EventBus Performance Benchmarks', () => {
  it('should dispatch events in <1ms for typical usage (10 listeners)', () => {
    const eventBus = new EventBus();
    const handlers = Array.from({ length: 10 }, () => () => {});
    
    // Register handlers
    handlers.forEach(handler => eventBus.on('ProcessCreated', handler));
    
    // Warm up
    for (let i = 0; i < 10; i++) {
      eventBus.emit('ProcessCreated', { warmup: true });
    }
    
    // Benchmark
    const iterations = 100;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const event = eventBus.emit('ProcessCreated', { processId: `test_${i}` });
      const endTime = performance.now();
      
      times.push(endTime - startTime);
      
      // Verify the event was properly dispatched
      expect(event.performance.dispatchTime).toBeLessThan(1);
      expect(event.performance.listenerCount).toBe(10);
    }
    
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    console.log(`EventBus Performance Results:
      Average dispatch time: ${avgTime.toFixed(3)}ms
      Max dispatch time: ${maxTime.toFixed(3)}ms
      Min dispatch time: ${minTime.toFixed(3)}ms
      Iterations: ${iterations}
      Listeners: 10`);
    
    // Performance assertions
    expect(avgTime).toBeLessThan(1, `Average dispatch time ${avgTime.toFixed(3)}ms exceeds 1ms threshold`);
    expect(maxTime).toBeLessThan(5, `Max dispatch time ${maxTime.toFixed(3)}ms is too high`);
  });

  it('should handle high-frequency events efficiently', () => {
    const eventBus = new EventBus({ historySize: 1000 });
    const handler = () => {};
    
    eventBus.on('ProcessCreated', handler);
    eventBus.on('ProcessTerminated', handler);
    eventBus.on('CommandExecuted', handler);
    eventBus.on('MemoryAllocated', handler);
    eventBus.on('ProcessOptimized', handler);
    
    const eventTypes = ['ProcessCreated', 'ProcessTerminated', 'CommandExecuted', 'MemoryAllocated', 'ProcessOptimized'];
    const eventsPerType = 200;
    const totalEvents = eventTypes.length * eventsPerType;
    
    const startTime = performance.now();
    
    for (let i = 0; i < eventsPerType; i++) {
      eventTypes.forEach(type => {
        eventBus.emit(type, { iteration: i });
      });
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const eventsPerSecond = (totalEvents / totalTime) * 1000;
    const avgTimePerEvent = totalTime / totalEvents;
    
    console.log(`High-Frequency Event Performance:
      Total events: ${totalEvents}
      Total time: ${totalTime.toFixed(2)}ms
      Events per second: ${eventsPerSecond.toFixed(0)}
      Average time per event: ${avgTimePerEvent.toFixed(3)}ms`);
    
    expect(eventsPerSecond).toBeGreaterThan(1000, 'Should handle >1000 events/second');
    expect(avgTimePerEvent).toBeLessThan(1, 'Average time per event should be <1ms');
  });

  it('should maintain performance with wildcard patterns', () => {
    const eventBus = new EventBus();
    const handler = () => {};
    
    // Add various wildcard patterns
    eventBus.on('process.*', handler);
    eventBus.on('*.created', handler);
    eventBus.on('*.terminated', handler);
    eventBus.on('command.*', handler);
    eventBus.on('memory.*', handler);
    
    const testEvents = [
      'process.created',
      'process.terminated',
      'command.executed',
      'memory.allocated',
      'system.started'
    ];
    
    const iterations = 100;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const eventType = testEvents[i % testEvents.length];
      const startTime = performance.now();
      eventBus.emit(eventType, { iteration: i });
      const endTime = performance.now();
      times.push(endTime - startTime);
    }
    
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    
    console.log(`Wildcard Pattern Performance:
      Average dispatch time: ${avgTime.toFixed(3)}ms
      Max dispatch time: ${maxTime.toFixed(3)}ms
      Wildcard patterns: 5
      Test events: ${testEvents.length}`);
    
    expect(avgTime).toBeLessThan(1, 'Wildcard matching should be <1ms on average');
    expect(maxTime).toBeLessThan(5, 'Max wildcard matching time should be reasonable');
  });

  it('should handle memory efficiently with large event history', () => {
    const eventBus = new EventBus({ historySize: 10000 });
    const handler = () => {};
    
    eventBus.on('TestEvent', handler);
    
    // Fill up the history buffer
    const startTime = performance.now();
    for (let i = 0; i < 15000; i++) { // More than history size to test buffer management
      eventBus.emit('TestEvent', { 
        iteration: i,
        data: 'x'.repeat(100) // Add some data to make events larger
      });
    }
    const endTime = performance.now();
    
    const history = eventBus.getHistory();
    const metrics = eventBus.getPerformanceMetrics();
    
    console.log(`Memory Management Performance:
      Events emitted: 15000
      History size: ${history.length}
      Total time: ${(endTime - startTime).toFixed(2)}ms
      Average time per event: ${((endTime - startTime) / 15000).toFixed(3)}ms
      Total events in metrics: ${metrics.TestEvent.totalEvents}`);
    
    // Verify history buffer is properly managed
    expect(history.length).toBe(10000);
    expect(history[0].data.iteration).toBe(5000); // Should start from event 5000
    expect(history[9999].data.iteration).toBe(14999); // Should end at event 14999
    
    // Performance should still be good
    expect((endTime - startTime) / 15000).toBeLessThan(1, 'Should maintain <1ms per event even with large history');
  });

  it('should demonstrate consciousness event performance', () => {
    const eventBus = new EventBus();
    
    // Simulate consciousness debugging scenario
    const consciousnessHandlers = {
      ProcessCreated: () => { /* New thought pattern emerging */ },
      ProcessTerminated: () => { /* Mental process resolved */ },
      CommandExecuted: () => { /* Conscious intervention */ },
      MemoryAllocated: () => { /* New memory formation */ },
      ProcessOptimized: () => { /* Coping mechanism activated */ }
    };
    
    // Register consciousness event handlers
    Object.entries(consciousnessHandlers).forEach(([event, handler]) => {
      eventBus.on(event, handler);
    });
    
    // Simulate a consciousness debugging session
    const sessionEvents = [
      { type: 'ProcessCreated', data: { processId: 'grief_001', name: 'Grief_Manager.exe' } },
      { type: 'MemoryAllocated', data: { size: 512, type: 'emotional_memory' } },
      { type: 'CommandExecuted', data: { command: 'analyze_emotion', target: 'grief_001' } },
      { type: 'ProcessOptimized', data: { processId: 'grief_001', optimization: 'acceptance_protocol' } },
      { type: 'ProcessTerminated', data: { processId: 'grief_001', reason: 'resolved' } }
    ];
    
    const startTime = performance.now();
    const iterations = 200; // Simulate 200 debugging sessions
    
    for (let session = 0; session < iterations; session++) {
      sessionEvents.forEach(({ type, data }) => {
        eventBus.emit(type, { ...data, session });
      });
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const totalEvents = sessionEvents.length * iterations;
    const avgTimePerEvent = totalTime / totalEvents;
    
    console.log(`Consciousness Debugging Performance:
      Sessions simulated: ${iterations}
      Events per session: ${sessionEvents.length}
      Total events: ${totalEvents}
      Total time: ${totalTime.toFixed(2)}ms
      Average time per event: ${avgTimePerEvent.toFixed(3)}ms
      Sessions per second: ${(iterations / totalTime * 1000).toFixed(0)}`);
    
    expect(avgTimePerEvent).toBeLessThan(1, 'Consciousness events should dispatch in <1ms');
    expect(totalTime).toBeLessThan(1000, 'Should complete 200 sessions in <1 second');
  });
});
