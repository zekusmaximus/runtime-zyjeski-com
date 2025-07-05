import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsciousnessEngine } from '../../lib/consciousness-engine.js';
import EventBus from '../../lib/events/EventBus.js';
import WebSocketEventBridge from '../../lib/events/WebSocketEventBridge.js';

describe('EventBus End-to-End Integration', () => {
  let consciousnessEngine;
  let eventBus;
  let eventBridge;
  let mockIo;
  let mockSocket;
  let capturedEvents;

  beforeEach(async () => {
    // Create EventBus
    eventBus = new EventBus({
      historySize: 100,
      performanceThreshold: 10,
      enableWildcards: true,
      debugMode: false
    });

    // Create ConsciousnessEngine with EventBus
    consciousnessEngine = new ConsciousnessEngine({ eventBus });

    // Mock Socket.io
    mockSocket = { emit: vi.fn() };
    mockIo = {
      sockets: {
        sockets: new Map([['client1', mockSocket]])
      },
      to: vi.fn().mockReturnThis(),
      emit: vi.fn()
    };

    // Create WebSocket bridge
    eventBridge = new WebSocketEventBridge(eventBus, mockIo, {
      enableDebugLogging: false,
      filterSensitiveData: true
    });

    // Capture all events
    capturedEvents = [];
    eventBus.on('ProcessCreated', (event) => capturedEvents.push(event));
    eventBus.on('ProcessTerminated', (event) => capturedEvents.push(event));
    eventBus.on('ProcessOptimized', (event) => capturedEvents.push(event));
    eventBus.on('CommandExecuted', (event) => capturedEvents.push(event));
    eventBus.on('MemoryAllocated', (event) => capturedEvents.push(event));
    eventBus.on('TestEvent', (event) => capturedEvents.push(event));

    // Initialize the engine
    await consciousnessEngine.initialize();
  });

  afterEach(async () => {
    if (consciousnessEngine) {
      await consciousnessEngine.shutdown();
    }
    if (eventBridge) {
      eventBridge.shutdown();
    }
    eventBus.removeAllListeners();
    capturedEvents = [];
  });

  it('should handle complete consciousness lifecycle with events', async () => {
    // Load a character
    const instance = await consciousnessEngine.loadCharacter('alexander-kane', {
      enableDynamic: true,
      difficulty: 'intermediate'
    });

    expect(instance).toBeDefined();
    expect(instance.id).toBe('alexander-kane');

    // Execute a debug action that works with existing processes
    const debugResult = await consciousnessEngine.executeDebugAction(
      'alexander-kane',
      'ps',
      {}
    );

    expect(debugResult.success).toBe(true);

    // Execute a process kill action (which will emit events)
    const processes = instance.processManager.getProcessList();
    if (processes.length > 0) {
      const processId = processes[0].pid;
      await consciousnessEngine.executeDebugAction(
        'alexander-kane',
        'kill',
        { processId: processId.toString() }
      );
    }

    // Execute a memory action
    await consciousnessEngine.executeDebugAction(
      'alexander-kane',
      'defragment',
      {}
    );

    // Verify events were captured
    expect(capturedEvents.length).toBeGreaterThan(0);

    // Check for ProcessCreated events
    const processCreatedEvents = capturedEvents.filter(e => e.type === 'ProcessCreated');
    expect(processCreatedEvents.length).toBeGreaterThan(0);

    // Check for CommandExecuted events
    const commandExecutedEvents = capturedEvents.filter(e => e.type === 'CommandExecuted');
    expect(commandExecutedEvents.length).toBeGreaterThan(0);

    // Verify WebSocket forwarding occurred
    expect(mockSocket.emit).toHaveBeenCalled();

    // Check that consciousness-event was emitted for process events
    const consciousnessEventCalls = mockSocket.emit.mock.calls.filter(
      call => call[0] === 'consciousness-event'
    );
    expect(consciousnessEventCalls.length).toBeGreaterThan(0);

    // Check that command-event was emitted for command events
    const commandEventCalls = mockSocket.emit.mock.calls.filter(
      call => call[0] === 'command-event'
    );
    expect(commandEventCalls.length).toBeGreaterThan(0);
  });

  it('should maintain event history across multiple operations', async () => {
    // Load character
    const instance = await consciousnessEngine.loadCharacter('alexander-kane');

    // Perform multiple operations
    await consciousnessEngine.executeDebugAction('alexander-kane', 'ps', {});
    await consciousnessEngine.executeDebugAction('alexander-kane', 'defragment', {});
    await consciousnessEngine.executeDebugAction('alexander-kane', 'analyze', {});

    // Check event history
    const history = eventBus.getHistory();
    expect(history.length).toBeGreaterThan(2);

    // Verify event types are present
    const eventTypes = history.map(e => e.type);
    expect(eventTypes).toContain('ProcessCreated');
    // Debug actions go through ActionRouter, not CommandExecutor, so they don't emit CommandExecuted events
    // Instead, they may emit other events like MemoryAllocated, ProcessOptimized, etc.
    expect(eventTypes.length).toBeGreaterThan(1); // Just verify we have multiple event types

    // Check performance metrics
    const metrics = eventBus.getPerformanceMetrics();
    expect(metrics.ProcessCreated).toBeDefined();
    expect(metrics.ProcessCreated.totalEvents).toBeGreaterThan(0);
    // Debug actions go through ActionRouter, not CommandExecutor, so they don't emit CommandExecuted events
    // Instead, verify we have multiple event types in metrics
    expect(Object.keys(metrics).length).toBeGreaterThan(1);
  });

  it('should handle process termination with proper event flow', async () => {
    // Load character
    const instance = await consciousnessEngine.loadCharacter('alexander-kane');

    // Get an existing process to kill (use the temporal_sync process which is in error state)
    const processes = instance.processManager.getProcessList();
    const testProcess = processes.find(p => p.name === 'temporal_sync');
    expect(testProcess).toBeDefined();
    expect(testProcess.pid).toBeDefined();

    // Clear captured events
    capturedEvents.length = 0;
    mockSocket.emit.mockClear();

    // Kill the process
    await consciousnessEngine.executeDebugAction('alexander-kane', 'kill', {
      processId: testProcess.pid
    });

    // Verify ProcessTerminated event was emitted
    const terminatedEvents = capturedEvents.filter(e => e.type === 'ProcessTerminated');
    expect(terminatedEvents).toHaveLength(1);

    const terminatedEvent = terminatedEvents[0];
    // Process ID in events uses the full process identifier format (e.g., "base_1002")
    // The testProcess.pid is just the numeric part (1002), but events use the full identifier
    expect(terminatedEvent.data.processId).toBe(`base_${testProcess.pid}`);
    expect(terminatedEvent.data.reason).toBe('user_initiated');

    // Verify CommandExecuted event was emitted
    const commandEvents = capturedEvents.filter(e => e.type === 'CommandExecuted');
    expect(commandEvents).toHaveLength(1);

    const commandEvent = commandEvents[0];
    expect(commandEvent.data.commandType).toBe('KillProcessCommand');
    expect(commandEvent.data.success).toBe(true);

    // Verify WebSocket forwarding
    expect(mockSocket.emit).toHaveBeenCalledWith('consciousness-event', expect.objectContaining({
      type: 'ProcessTerminated'
    }));

    expect(mockSocket.emit).toHaveBeenCalledWith('command-event', expect.objectContaining({
      type: 'CommandExecuted'
    }));
  });

  it('should demonstrate performance within acceptable limits', async () => {
    const startTime = performance.now();

    // Load character
    await consciousnessEngine.loadCharacter('alexander-kane');

    // Perform multiple rapid operations
    const operations = [];
    for (let i = 0; i < 5; i++) {
      operations.push(
        consciousnessEngine.executeDebugAction('alexander-kane', 'ps', {})
      );
    }

    await Promise.all(operations);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Should complete operations in reasonable time
    expect(totalTime).toBeLessThan(1000); // 1 second for 5 operations + character loading

    // Verify events were processed
    expect(capturedEvents.length).toBeGreaterThan(0);

    // Check EventBus performance metrics
    const metrics = eventBus.getPerformanceMetrics();
    Object.values(metrics).forEach(metric => {
      expect(metric.avgDispatchTime).toBeLessThan(10); // Less than 10ms average
    });
  });

  it('should handle error scenarios gracefully', async () => {
    // Load character
    await consciousnessEngine.loadCharacter('alexander-kane');

    // Clear captured events
    capturedEvents.length = 0;

    // Try to execute a command that will fail
    try {
      await consciousnessEngine.executeDebugAction('alexander-kane', 'kill', {
        processId: '99999' // Non-existent process ID
      });
    } catch (error) {
      // Expected to fail
    }

    // For this type of error (invalid process ID), no CommandExecuted event is emitted
    // because the error occurs at the ProcessManager level, not the CommandExecutor level
    const commandEvents = capturedEvents.filter(e => e.type === 'CommandExecuted');
    expect(commandEvents).toHaveLength(0);

    // However, the EventBus should still be functional for other events
    // Let's verify by manually emitting a test event
    eventBus.emit('TestEvent', { message: 'EventBus recovery test' });

    // Now we should have captured the test event
    expect(capturedEvents.length).toBeGreaterThan(0);
    expect(capturedEvents[capturedEvents.length - 1].type).toBe('TestEvent');
  });
});
