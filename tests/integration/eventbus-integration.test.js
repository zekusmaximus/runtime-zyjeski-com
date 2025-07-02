import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EventBus from '../../lib/events/EventBus.js';
import WebSocketEventBridge from '../../lib/events/WebSocketEventBridge.js';
import ProcessManager from '../../lib/ProcessManager.js';
import { CommandExecutor } from '../../lib/commands/CommandExecutor.js';
import MemoryManager from '../../lib/MemoryManager.js';
import KillProcessCommand from '../../lib/commands/KillProcessCommand.js';

describe('EventBus Integration', () => {
  let eventBus;
  let processManager;
  let commandExecutor;
  let memoryManager;
  let mockConsciousness;
  let mockIo;
  let eventBridge;
  let eventHistory;

  beforeEach(() => {
    // Create EventBus instance
    eventBus = new EventBus({
      historySize: 50,
      performanceThreshold: 10,
      enableWildcards: true,
      debugMode: false
    });

    // Track events for testing
    eventHistory = [];
    eventBus.on('*', (event) => {
      eventHistory.push(event);
    });

    // Mock consciousness instance
    mockConsciousness = {
      id: 'test-consciousness',
      systemLog: [],
      narrativeEngine: null,
      resources: {
        memory: { total: 10000 }
      }
    };

    // Mock Socket.io
    mockIo = {
      sockets: {
        sockets: new Map()
      },
      to: vi.fn().mockReturnThis(),
      emit: vi.fn()
    };

    // Create components with EventBus injection
    processManager = new ProcessManager(mockConsciousness, {
      eventBus,
      logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() }
    });

    commandExecutor = new CommandExecutor({
      eventBus,
      logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
      maxHistorySize: 50
    });

    memoryManager = new MemoryManager(mockConsciousness, {}, {
      eventBus,
      logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() }
    });

    // Create WebSocket bridge
    eventBridge = new WebSocketEventBridge(eventBus, mockIo, {
      enableDebugLogging: false,
      filterSensitiveData: true,
      maxEventRate: 100
    });
  });

  afterEach(() => {
    eventBus.removeAllListeners();
    eventBridge.shutdown();
    eventHistory = [];
  });

  describe('ProcessManager Event Emission', () => {
    it('should emit ProcessCreated when creating a base process', async () => {
      const processConfig = {
        name: 'test_process',
        type: 'background',
        priority: 'normal',
        memoryUsage: 100
      };

      await processManager.createBaseProcess(processConfig);

      // Check that ProcessCreated event was emitted
      const processCreatedEvents = eventHistory.filter(e => e.type === 'ProcessCreated');
      expect(processCreatedEvents).toHaveLength(1);

      const event = processCreatedEvents[0];
      expect(event.data.processName).toBe('test_process');
      expect(event.data.processType).toBe('background');
      expect(event.data.priority).toBe('normal');
      expect(event.data.initialMemory).toBe(100);
      expect(event.data.processId).toMatch(/^base_/);
    });

    it('should emit ProcessCreated when creating emotional process', () => {
      const emotionData = {
        type: 'anxiety',
        intensity: 0.8,
        processId: 'test-process'
      };

      const processId = processManager.createProcess(emotionData, 'high');

      // Check that ProcessCreated event was emitted
      const processCreatedEvents = eventHistory.filter(e => e.type === 'ProcessCreated');
      expect(processCreatedEvents).toHaveLength(1);

      const event = processCreatedEvents[0];
      expect(event.data.processId).toBe(processId);
      expect(event.data.priority).toBe('high');
    });

    it('should emit ProcessTerminated when killing a process', async () => {
      // First create a process
      const processConfig = {
        name: 'test_kill_process',
        type: 'background'
      };
      const processId = await processManager.createBaseProcess(processConfig);

      // Clear event history
      eventHistory.length = 0;

      // Kill the process
      await processManager.killProcess(processId);

      // Check that ProcessTerminated event was emitted
      const processTerminatedEvents = eventHistory.filter(e => e.type === 'ProcessTerminated');
      expect(processTerminatedEvents).toHaveLength(1);

      const event = processTerminatedEvents[0];
      expect(event.data.processId).toBe(processId);
      expect(event.data.processName).toBe('test_kill_process');
      expect(event.data.reason).toBe('user_initiated');
      expect(event.data.finalState).toBe('terminated');
      expect(typeof event.data.runtime).toBe('number');
      expect(typeof event.data.memoryReleased).toBe('number');
    });

    it('should emit ProcessOptimized when optimizing a process', async () => {
      // First create a process
      const processConfig = {
        name: 'test_optimize_process',
        type: 'background',
        memoryUsage: 200,
        cpuUsage: 50
      };
      const processId = await processManager.createBaseProcess(processConfig);

      // Clear event history
      eventHistory.length = 0;

      // Optimize the process
      await processManager.optimizeProcess(processId);

      // Check that ProcessOptimized event was emitted
      const processOptimizedEvents = eventHistory.filter(e => e.type === 'ProcessOptimized');
      expect(processOptimizedEvents).toHaveLength(1);

      const event = processOptimizedEvents[0];
      expect(event.data.processId).toBe(processId);
      expect(event.data.strategy).toBe('efficiency_boost');
      expect(event.data.beforeMetrics).toBeDefined();
      expect(event.data.afterMetrics).toBeDefined();
      expect(event.data.beforeMetrics.memory).toBeGreaterThan(event.data.afterMetrics.memory);
      expect(typeof event.data.improvement).toBe('number');
    });
  });

  describe('CommandExecutor Event Emission', () => {
    it('should emit CommandExecuted on successful command execution', async () => {
      // Create a process to kill
      const processConfig = { name: 'test_command_process' };
      const processId = await processManager.createBaseProcess(processConfig);

      // Clear event history
      eventHistory.length = 0;

      // Create and execute a command
      const killCommand = new KillProcessCommand(processManager, processId);
      await commandExecutor.execute(killCommand);

      // Check that CommandExecuted event was emitted
      const commandExecutedEvents = eventHistory.filter(e => e.type === 'CommandExecuted');
      expect(commandExecutedEvents).toHaveLength(1);

      const event = commandExecutedEvents[0];
      expect(event.data.commandType).toBe('KillProcessCommand');
      expect(event.data.success).toBe(true);
      expect(typeof event.data.executionTime).toBe('number');
      expect(event.data.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should emit CommandExecuted on failed command execution', async () => {
      // Clear event history
      eventHistory.length = 0;

      // Try to kill a non-existent process
      const killCommand = new KillProcessCommand(processManager, 'non-existent-process');
      
      try {
        await commandExecutor.execute(killCommand);
      } catch (error) {
        // Expected to fail
      }

      // Check that CommandExecuted event was emitted for failure
      const commandExecutedEvents = eventHistory.filter(e => e.type === 'CommandExecuted');
      expect(commandExecutedEvents).toHaveLength(1);

      const event = commandExecutedEvents[0];
      expect(event.data.commandType).toBe('KillProcessCommand');
      expect(event.data.success).toBe(false);
      expect(event.data.error).toBeDefined();
      expect(typeof event.data.executionTime).toBe('number');
    });
  });

  describe('MemoryManager Event Emission', () => {
    it('should emit MemoryAllocated when allocating memory', async () => {
      await memoryManager.initialize();

      // Clear event history
      eventHistory.length = 0;

      // Allocate memory
      const memoryData = {
        content: 'test memory content',
        emotionalIntensity: 0.5,
        emotions: ['happiness'],
        processId: 'test-process'
      };

      const memoryId = memoryManager.allocateMemory(memoryData, 'shortTerm');

      // Check that MemoryAllocated event was emitted
      const memoryAllocatedEvents = eventHistory.filter(e => e.type === 'MemoryAllocated');
      expect(memoryAllocatedEvents).toHaveLength(1);

      const event = memoryAllocatedEvents[0];
      expect(event.data.blockId).toBe(memoryId);
      expect(event.data.type).toBe('shortTerm');
      expect(event.data.processId).toBe('test-process');
      expect(typeof event.data.size).toBe('number');
      expect(typeof event.data.fragmentationLevel).toBe('number');
    });
  });

  describe('WebSocket Event Forwarding', () => {
    it('should forward process events to WebSocket clients', async () => {
      // Add a mock client
      const mockSocket = { emit: vi.fn() };
      mockIo.sockets.sockets.set('client1', mockSocket);

      // Create a process (which should emit ProcessCreated)
      const processConfig = { name: 'websocket_test_process' };
      await processManager.createBaseProcess(processConfig);

      // Check that the event was forwarded to WebSocket
      expect(mockSocket.emit).toHaveBeenCalledWith('consciousness-event', expect.objectContaining({
        type: 'ProcessCreated',
        data: expect.objectContaining({
          processName: 'websocket_test_process'
        })
      }));
    });

    it('should forward command events to WebSocket clients', async () => {
      // Add a mock client
      const mockSocket = { emit: vi.fn() };
      mockIo.sockets.sockets.set('client1', mockSocket);

      // Create and execute a command
      const processConfig = { name: 'command_test_process' };
      const processId = await processManager.createBaseProcess(processConfig);
      
      // Clear previous calls
      mockSocket.emit.mockClear();

      const killCommand = new KillProcessCommand(processManager, processId);
      await commandExecutor.execute(killCommand);

      // Check that the command event was forwarded
      expect(mockSocket.emit).toHaveBeenCalledWith('command-event', expect.objectContaining({
        type: 'CommandExecuted',
        data: expect.objectContaining({
          commandType: 'KillProcessCommand',
          success: true
        })
      }));
    });

    it('should forward memory events to WebSocket clients', async () => {
      await memoryManager.initialize();

      // Add a mock client
      const mockSocket = { emit: vi.fn() };
      mockIo.sockets.sockets.set('client1', mockSocket);

      // Allocate memory
      const memoryData = { content: 'websocket test memory' };
      memoryManager.allocateMemory(memoryData, 'shortTerm');

      // Check that the memory event was forwarded
      expect(mockSocket.emit).toHaveBeenCalledWith('memory-event', expect.objectContaining({
        type: 'MemoryAllocated',
        data: expect.objectContaining({
          type: 'shortTerm'
        })
      }));
    });
  });

  describe('Event History and Performance', () => {
    it('should maintain event history', async () => {
      // Generate multiple events
      const processConfig = { name: 'history_test_process' };
      const processId = await processManager.createBaseProcess(processConfig);
      await processManager.optimizeProcess(processId);
      await processManager.killProcess(processId);

      // Check event history
      const history = eventBus.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);

      const eventTypes = history.map(e => e.type);
      expect(eventTypes).toContain('ProcessCreated');
      expect(eventTypes).toContain('ProcessOptimized');
      expect(eventTypes).toContain('ProcessTerminated');
    });

    it('should track performance metrics', async () => {
      // Generate some events
      const processConfig = { name: 'performance_test_process' };
      await processManager.createBaseProcess(processConfig);

      // Check performance metrics
      const metrics = eventBus.getPerformanceMetrics();
      expect(metrics.ProcessCreated).toBeDefined();
      expect(metrics.ProcessCreated.totalEvents).toBeGreaterThan(0);
      expect(metrics.ProcessCreated.avgDispatchTime).toBeGreaterThanOrEqual(0);
    });

    it('should meet performance requirements', async () => {
      const startTime = performance.now();

      // Create multiple processes quickly
      for (let i = 0; i < 10; i++) {
        await processManager.createBaseProcess({ name: `perf_test_${i}` });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete 10 process creations in reasonable time
      expect(totalTime).toBeLessThan(100); // 100ms for 10 operations

      // Check that all events were processed
      const processCreatedEvents = eventHistory.filter(e => e.type === 'ProcessCreated');
      expect(processCreatedEvents).toHaveLength(10);
    });
  });

  describe('Backward Compatibility', () => {
    it('should not break existing ProcessManager APIs', async () => {
      // Test that existing methods still work
      const processConfig = { name: 'compatibility_test' };
      const processId = await processManager.createBaseProcess(processConfig);
      
      expect(processId).toBeDefined();
      expect(processManager.processes.has(processId)).toBe(true);

      const result = await processManager.killProcess(processId);
      expect(result.success).toBe(true);
    });

    it('should not break existing CommandExecutor APIs', async () => {
      // Test that existing command execution still works
      const processConfig = { name: 'command_compatibility_test' };
      const processId = await processManager.createBaseProcess(processConfig);

      const killCommand = new KillProcessCommand(processManager, processId);
      const result = await commandExecutor.execute(killCommand);

      expect(result.success).toBe(true);
      expect(result.processId).toBe(processId);
    });

    it('should not break existing MemoryManager APIs', async () => {
      await memoryManager.initialize();

      // Test that existing memory allocation still works
      const memoryData = { content: 'compatibility test memory' };
      const memoryId = memoryManager.allocateMemory(memoryData, 'shortTerm');

      expect(memoryId).toBeDefined();
      expect(memoryManager.memorySegments.has(memoryId)).toBe(true);
    });
  });
});
