// OptimizeProcessCommand.integration.test.js - Integration tests for OptimizeProcessCommand
// Tests integration with ProcessManager, CommandExecutor, and event systems

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OptimizeProcessCommand } from '../../lib/commands/OptimizeProcessCommand.js';
import { CommandExecutor } from '../../lib/commands/CommandExecutor.js';
import ProcessManager from '../../lib/ProcessManager.js';
import { EventEmitter } from 'events';

// Mock consciousness instance
const createMockConsciousnessInstance = () => ({
    id: 'alexander_kane',
    name: 'Alexander Kane',
    resources: {
        cpu: { total: 100, used: 0 },
        memory: { total: 10000, used: 0 },
        threads: { total: 16, used: 0 }
    },
    systemLog: [],
    narrativeEngine: {
        checkTriggers: vi.fn()
    }
});

const createTestProcess = (id, overrides = {}) => ({
    id,
    name: 'grief_processor.exe',
    type: 'emotional_processing',
    status: 'running',
    priority: 'normal',
    memoryUsage: 180,
    cpuUsage: 45,
    threadCount: 4,
    lifetime: 8000,
    lastActivity: Date.now(),
    crashCount: 0,
    emotionSource: { type: 'grief', intensity: 0.8 },
    emotionalImpact: 0.8,
    debuggable: true,
    currentIssues: [],
    interventionPoints: [],
    effectivenessScore: 0.5,
    optimizationLevel: 0,
    config: {},
    ...overrides
});

describe('OptimizeProcessCommand Integration', () => {
    let processManager;
    let commandExecutor;
    let consciousnessEngine;
    let eventEmitter;
    let consciousnessInstance;

    beforeEach(() => {
        consciousnessInstance = createMockConsciousnessInstance();
        processManager = new ProcessManager(consciousnessInstance);
        commandExecutor = new CommandExecutor();
        consciousnessEngine = {
            instances: new Map([['alexander_kane', { processManager }]]),
            getState: vi.fn().mockReturnValue({ consciousness: {} })
        };
        eventEmitter = new EventEmitter();

        // Add test processes
        const testProcess1 = createTestProcess('proc_1001');
        const testProcess2 = createTestProcess('proc_1002', {
            name: 'search_protocol.exe',
            cpuUsage: 75,
            memoryUsage: 300,
            threadCount: 6,
            emotionalImpact: 0.9
        });

        processManager.processes.set('proc_1001', testProcess1);
        processManager.processes.set('proc_1002', testProcess2);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('ProcessManager Integration', () => {
        it('should integrate with ProcessManager process operations', async () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const originalProcess = processManager.processes.get('proc_1001');
            const originalCpuUsage = originalProcess.cpuUsage;

            const result = await command.execute();

            expect(result.success).toBe(true);
            expect(processManager.performanceMetrics.optimizationAttempts).toBe(1);
            
            // Process should be modified
            const modifiedProcess = processManager.processes.get('proc_1001');
            expect(modifiedProcess.optimizationLevel).toBe(1);
            expect(modifiedProcess.lastOptimization).toBeDefined();
        });

        it('should handle process state changes correctly', async () => {
            const params = {
                processId: 'proc_1002',
                characterId: 'alexander_kane',
                strategy: 'hybrid_optimization'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const originalProcess = { ...processManager.processes.get('proc_1002') };

            await command.execute();

            const optimizedProcess = processManager.processes.get('proc_1002');
            
            // Verify multiple aspects were optimized
            expect(optimizedProcess.cpuUsage).toBeLessThan(originalProcess.cpuUsage);
            expect(optimizedProcess.memoryUsage).toBeLessThan(originalProcess.memoryUsage);
            expect(optimizedProcess.effectivenessScore).toBeGreaterThan(originalProcess.effectivenessScore);
        });

        it('should maintain process integrity during optimization', async () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await command.execute();

            const process = processManager.processes.get('proc_1001');
            
            // Essential process properties should remain valid
            expect(process.id).toBe('proc_1001');
            expect(process.status).toBe('running');
            expect(process.cpuUsage).toBeGreaterThan(0);
            expect(process.memoryUsage).toBeGreaterThan(0);
            expect(process.threadCount).toBeGreaterThan(0);
            expect(process.effectivenessScore).toBeGreaterThan(0);
        });
    });

    describe('CommandExecutor Integration', () => {
        it('should work with CommandExecutor execution', async () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const result = await commandExecutor.execute(command);

            expect(result.success).toBe(true);
            expect(commandExecutor.getHistory()).toHaveLength(1);
            expect(commandExecutor.canUndo()).toBe(true);
        });

        it('should support undo through CommandExecutor', async () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const originalProcess = { ...processManager.processes.get('proc_1001') };

            // Execute through CommandExecutor
            await commandExecutor.execute(command);
            
            // Undo through CommandExecutor
            const undoResult = await commandExecutor.undo();

            expect(undoResult.success).toBe(true);
            
            const restoredProcess = processManager.processes.get('proc_1001');
            expect(restoredProcess.cpuUsage).toBe(originalProcess.cpuUsage);
            expect(restoredProcess.memoryUsage).toBe(originalProcess.memoryUsage);
            expect(restoredProcess.optimizationLevel).toBe(originalProcess.optimizationLevel);
        });

        it('should handle batch operations with multiple optimizations', async () => {
            const command1 = new OptimizeProcessCommand(
                { processId: 'proc_1001', characterId: 'alexander_kane' },
                { processManager, consciousnessEngine, eventEmitter }
            );
            const command2 = new OptimizeProcessCommand(
                { processId: 'proc_1002', characterId: 'alexander_kane' },
                { processManager, consciousnessEngine, eventEmitter }
            );

            const batchResult = await commandExecutor.executeBatch([command1, command2]);

            expect(batchResult.success).toBe(true);
            expect(batchResult.results).toHaveLength(2);
            expect(processManager.performanceMetrics.optimizationAttempts).toBe(2);
        });

        it('should handle command execution errors gracefully', async () => {
            // Try to optimize a non-existent process
            const params = {
                processId: 'nonexistent',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await expect(commandExecutor.execute(command))
                .rejects.toThrow();

            // CommandExecutor should remain in valid state
            expect(commandExecutor.getHistory()).toHaveLength(0);
            expect(commandExecutor.canUndo()).toBe(false);
        });
    });

    describe('Event System Integration', () => {
        it('should emit process optimization events', async () => {
            const events = [];
            eventEmitter.on('process_optimized', (data) => events.push({ type: 'process_optimized', data }));
            eventEmitter.on('memory_merged', (data) => events.push({ type: 'memory_merged', data }));
            eventEmitter.on('emotion_suppressed', (data) => events.push({ type: 'emotion_suppressed', data }));

            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await command.execute();

            expect(events.length).toBeGreaterThan(0);
            const processOptimizedEvent = events.find(e => e.type === 'process_optimized');
            expect(processOptimizedEvent).toBeDefined();
            expect(processOptimizedEvent.data.processId).toBe('proc_1001');
            expect(processOptimizedEvent.data.characterId).toBe('alexander_kane');
        });

        it('should emit strategy-specific events', async () => {
            const events = [];
            eventEmitter.on('memory_merged', (data) => events.push({ type: 'memory_merged', data }));

            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane',
                strategy: 'memory_consolidation'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await command.execute();

            // High emotional impact process should trigger memory merge events
            const memoryMergedEvents = events.filter(e => e.type === 'memory_merged');
            expect(memoryMergedEvents.length).toBeGreaterThan(0);
        });

        it('should emit undo events', async () => {
            const events = [];
            eventEmitter.on('optimization_undone', (data) => events.push(data));

            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await command.execute();
            await command.undo();

            expect(events.length).toBe(1);
            expect(events[0].processId).toBe('proc_1001');
            expect(events[0].characterId).toBe('alexander_kane');
        });
    });

    describe('Safety Constraints Integration', () => {
        it('should prevent optimization of system processes', async () => {
            // Add a system process
            const systemProcess = createTestProcess('sys_001', {
                name: 'System_Core.exe',
                priority: 'critical'
            });
            processManager.processes.set('sys_001', systemProcess);

            const params = {
                processId: 'sys_001',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await expect(command.execute())
                .rejects.toThrow('Cannot optimize system process System_Core.exe: safety constraint violation');
        });

        it('should respect safe mode restrictions', async () => {
            // Create a process that can be optimized but has emotional impact
            const safeTestProcess = createTestProcess('proc_safe', {
                name: 'safe_test_process.exe',
                cpuUsage: 50, // High enough to need optimization
                memoryUsage: 200,
                emotionalImpact: 0.6 // Below the 0.7 threshold for safe mode blocking
            });
            processManager.processes.set('proc_safe', safeTestProcess);

            const params = {
                processId: 'proc_safe',
                characterId: 'alexander_kane',
                safeMode: true
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const result = await command.execute();

            expect(result.success).toBe(true);

            // Safe mode should result in more conservative optimization
            const sideEffects = result.sideEffects || [];
            const riskyEffects = sideEffects.filter(effect =>
                effect.type === 'emotion_suppression' || effect.severity === 'high'
            );
            expect(riskyEffects.length).toBe(0);
        });

        it('should handle heavily optimized processes', async () => {
            const heavilyOptimizedProcess = createTestProcess('proc_1003', {
                optimizationLevel: 3
            });
            processManager.processes.set('proc_1003', heavilyOptimizedProcess);

            const params = {
                processId: 'proc_1003',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await expect(command.execute())
                .rejects.toThrow('Process proc_1003 is already heavily optimized (level 3)');
        });
    });

    describe('Performance Integration', () => {
        it('should complete optimization within performance requirements', async () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const startTime = Date.now();
            await command.execute();
            const executionTime = Date.now() - startTime;

            // Should complete within 100ms requirement
            expect(executionTime).toBeLessThan(100);
        });

        it('should complete undo within performance requirements', async () => {
            const params = {
                processId: 'proc_1001',
                characterId: 'alexander_kane'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await command.execute();

            const startTime = Date.now();
            await command.undo();
            const undoTime = Date.now() - startTime;

            // Should complete undo within 50ms requirement
            expect(undoTime).toBeLessThan(50);
        });

        it('should maintain system stability during optimization', async () => {
            const params = {
                processId: 'proc_1002',
                characterId: 'alexander_kane',
                strategy: 'hybrid_optimization'
            };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            // Verify system state before
            const beforeProcessCount = processManager.processes.size;
            const beforeMetrics = { ...processManager.performanceMetrics };

            await command.execute();

            // Verify system stability after
            expect(processManager.processes.size).toBe(beforeProcessCount);
            expect(processManager.performanceMetrics.optimizationAttempts).toBe(beforeMetrics.optimizationAttempts + 1);
            
            // All processes should still be in valid state
            for (const process of processManager.processes.values()) {
                expect(process.cpuUsage).toBeGreaterThan(0);
                expect(process.memoryUsage).toBeGreaterThan(0);
                expect(process.effectivenessScore).toBeGreaterThan(0);
            }
        });
    });
});
