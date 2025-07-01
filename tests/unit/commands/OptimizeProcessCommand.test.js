// OptimizeProcessCommand.test.js - Unit tests for OptimizeProcessCommand
// Tests command pattern implementation, strategy integration, and undo functionality

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OptimizeProcessCommand } from '../../../lib/commands/OptimizeProcessCommand.js';
import { DebugCommand } from '../../../lib/commands/base/DebugCommand.js';
import { EventEmitter } from 'events';

// Mock dependencies
const createMockProcessManager = () => ({
    processes: new Map(),
    performanceMetrics: {
        optimizationAttempts: 0,
        totalProcesses: 10,
        averageLifetime: 5000,
        crashRate: 0.1
    }
});

const createMockConsciousnessEngine = () => ({
    instances: new Map(),
    getState: vi.fn().mockReturnValue({ consciousness: {} })
});

const createMockEventEmitter = () => new EventEmitter();

const createTestProcess = (overrides = {}) => ({
    id: 'proc_1001',
    name: 'test_process.exe',
    type: 'emotional_processing',
    status: 'running',
    priority: 'normal',
    memoryUsage: 150,
    cpuUsage: 45,
    threadCount: 3,
    lifetime: 5000,
    lastActivity: Date.now(),
    crashCount: 0,
    emotionSource: { type: 'grief', intensity: 0.7 },
    emotionalImpact: 0.7,
    debuggable: true,
    currentIssues: [],
    interventionPoints: [],
    effectivenessScore: 0.6,
    optimizationLevel: 0,
    config: {},
    ...overrides
});

describe('OptimizeProcessCommand', () => {
    let processManager;
    let consciousnessEngine;
    let eventEmitter;
    let testProcess;

    beforeEach(() => {
        processManager = createMockProcessManager();
        consciousnessEngine = createMockConsciousnessEngine();
        eventEmitter = createMockEventEmitter();
        testProcess = createTestProcess();
        processManager.processes.set('proc_1001', testProcess);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create command with required parameters', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };

            const command = new OptimizeProcessCommand(params, dependencies);

            expect(command).toBeInstanceOf(DebugCommand);
            expect(command.processId).toBe('proc_1001');
            expect(command.characterId).toBe('alexander_kane');
            expect(command.autoSelect).toBe(true);
            expect(command.safeMode).toBe(false);
        });

        it('should throw error if processId is missing', () => {
            const params = { characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };

            expect(() => new OptimizeProcessCommand(params, dependencies))
                .toThrow('processId is required for OptimizeProcessCommand');
        });

        it('should throw error if characterId is missing', () => {
            const params = { processId: 'proc_1001' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };

            expect(() => new OptimizeProcessCommand(params, dependencies))
                .toThrow('characterId is required for OptimizeProcessCommand');
        });

        it('should accept optional parameters', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                strategy: 'memory_consolidation',
                autoSelect: false,
                safeMode: true,
                targetMetrics: { cpuReduction: 0.3 }
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };

            const command = new OptimizeProcessCommand(params, dependencies);

            expect(command.strategy).toBe('memory_consolidation');
            expect(command.autoSelect).toBe(false);
            expect(command.safeMode).toBe(true);
            expect(command.targetMetrics).toEqual({ cpuReduction: 0.3 });
        });
    });

    describe('canExecute', () => {
        it('should return true for valid process', async () => {
            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const result = await command.canExecute();

            expect(result).toBe(true);
        });

        it('should throw error if process not found', async () => {
            const params = { processId: 'nonexistent', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await expect(command.canExecute())
                .rejects.toThrow('Cannot optimize process nonexistent: process not found');
        });

        it('should throw error if process is terminated', async () => {
            testProcess.status = 'terminated';
            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await expect(command.canExecute())
                .rejects.toThrow('Cannot optimize process proc_1001: process is terminated');
        });

        it('should throw error for system processes', async () => {
            testProcess.name = 'System_Core.exe';
            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await expect(command.canExecute())
                .rejects.toThrow('Cannot optimize system process System_Core.exe: safety constraint violation');
        });

        it('should throw error if already heavily optimized', async () => {
            testProcess.optimizationLevel = 3;
            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await expect(command.canExecute())
                .rejects.toThrow('Process proc_1001 is already heavily optimized (level 3)');
        });
    });

    describe('execute', () => {
        it('should execute optimization successfully', async () => {
            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const result = await command.execute();

            expect(result.success).toBe(true);
            expect(result.processId).toBe('proc_1001');
            expect(result.strategyUsed).toBeDefined();
            expect(result.metrics).toBeDefined();
            expect(result.metrics.before).toBeDefined();
            expect(result.metrics.after).toBeDefined();
            expect(result.metrics.improvement).toBeDefined();
            expect(command.executed).toBe(true);
            expect(command.timestamp).toBeDefined();
        });

        it('should handle process that does not need optimization', async () => {
            // Create a process that's already optimal
            testProcess.cpuUsage = 5;
            testProcess.memoryUsage = 30;
            testProcess.threadCount = 1;
            testProcess.effectivenessScore = 0.95;

            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const result = await command.execute();

            expect(result.success).toBe(true);
            expect(result.message).toBe('Process is already running optimally');
        });

        it('should use specified strategy', async () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                strategy: 'cpu_throttling'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const result = await command.execute();

            expect(result.strategyUsed).toBe('CpuThrottlingStrategy');
        });

        it('should emit narrative events', async () => {
            const events = [];
            eventEmitter.on('process_optimized', (data) => events.push({ type: 'process_optimized', data }));
            eventEmitter.on('memory_merged', (data) => events.push({ type: 'memory_merged', data }));

            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await command.execute();

            expect(events.length).toBeGreaterThan(0);
            expect(events.some(e => e.type === 'process_optimized')).toBe(true);
        });

        it('should update process optimization level', async () => {
            const originalLevel = testProcess.optimizationLevel;
            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await command.execute();

            expect(testProcess.optimizationLevel).toBe(originalLevel + 1);
            expect(testProcess.lastOptimization).toBeDefined();
        });

        it('should update performance metrics', async () => {
            const originalAttempts = processManager.performanceMetrics.optimizationAttempts;
            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await command.execute();

            expect(processManager.performanceMetrics.optimizationAttempts).toBe(originalAttempts + 1);
        });

        it('should throw error if autoSelect is disabled and no strategy specified', async () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                autoSelect: false
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await expect(command.execute())
                .rejects.toThrow('No strategy specified and autoSelect is disabled');
        });
    });

    describe('undo', () => {
        it('should undo optimization successfully', async () => {
            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            // Store original values
            const originalCpuUsage = testProcess.cpuUsage;
            const originalMemoryUsage = testProcess.memoryUsage;
            const originalOptimizationLevel = testProcess.optimizationLevel;

            // Execute first
            await command.execute();

            // Then undo
            const undoResult = await command.undo();

            expect(undoResult.success).toBe(true);
            expect(undoResult.processId).toBe('proc_1001');
            expect(command.executed).toBe(false);

            // Get the restored process from the manager (undo creates a new object)
            const restoredProcess = processManager.processes.get('proc_1001');

            // Process should be restored to original state
            expect(restoredProcess.cpuUsage).toBe(originalCpuUsage);
            expect(restoredProcess.memoryUsage).toBe(originalMemoryUsage);
            expect(restoredProcess.optimizationLevel).toBe(originalOptimizationLevel);
        });

        it('should throw error if nothing to undo', async () => {
            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await expect(command.undo())
                .rejects.toThrow('Nothing to undo: command was not executed or process state not stored');
        });

        it('should emit undo events', async () => {
            const events = [];
            eventEmitter.on('optimization_undone', (data) => events.push(data));

            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await command.execute();
            await command.undo();

            expect(events.length).toBe(1);
            expect(events[0].processId).toBe('proc_1001');
            expect(events[0].characterId).toBe('alexander_kane');
        });
    });

    describe('getDescription', () => {
        it('should return description with auto-selected strategy', () => {
            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const description = command.getDescription();

            expect(description).toBe('Optimize process proc_1001 with auto-selected strategy');
        });

        it('should return description with specified strategy', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                strategy: 'memory_consolidation'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const description = command.getDescription();

            expect(description).toBe('Optimize process proc_1001 using memory_consolidation');
        });

        it('should include safe mode in description', () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                safeMode: true
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const description = command.getDescription();

            expect(description).toBe('Optimize process proc_1001 with auto-selected strategy (safe mode)');
        });
    });
});
