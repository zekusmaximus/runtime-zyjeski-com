import { describe, it, expect, beforeEach, vi } from 'vitest';
import KillProcessCommand from '../../../lib/commands/KillProcessCommand.js';

describe('KillProcessCommand', () => {
    let mockProcessManager;
    let testProcess;
    let command;

    beforeEach(() => {
        // Create a test process
        testProcess = {
            id: 'proc_1001',
            name: 'test_process',
            type: 'emotional_processing',
            status: 'running',
            priority: 'normal',
            memoryUsage: 100,
            cpuUsage: 50,
            threadCount: 2,
            lifetime: 1000,
            lastActivity: Date.now() - 1000,
            crashCount: 0,
            emotionSource: { type: 'grief', intensity: 0.8 },
            emotionalImpact: 0.8,
            debuggable: true,
            currentIssues: [{ type: 'memory_leak', severity: 'high' }],
            interventionPoints: ['memory_cleanup', 'process_throttling'],
            effectivenessScore: 0.9,
            optimizationLevel: 1,
            config: { memoryUsage: 100, cpuUsage: 50 }
        };

        // Create mock ProcessManager
        mockProcessManager = {
            processes: new Map([['proc_1001', testProcess]]),
            performanceMetrics: {
                totalProcesses: 5,
                averageLifetime: 2000,
                crashRate: 0.1,
                optimizationAttempts: 3,
                killedProcesses: 2
            }
        };

        command = new KillProcessCommand(mockProcessManager, 'proc_1001');
    });

    describe('constructor', () => {
        it('initializes with correct properties', () => {
            expect(command.processManager).toBe(mockProcessManager);
            expect(command.processId).toBe('proc_1001');
            expect(command.killedProcess).toBeNull();
            expect(command.originalMetrics).toBeNull();
            expect(command.executed).toBe(false);
            expect(command.result).toBeNull();
            expect(command.timestamp).toBeNull();
        });
    });

    describe('canExecute', () => {
        it('returns true for existing running process', async () => {
            const canExecute = await command.canExecute();
            expect(canExecute).toBe(true);
        });

        it('returns false for non-existent process', async () => {
            const nonExistentCommand = new KillProcessCommand(mockProcessManager, 'proc_9999');
            const canExecute = await nonExistentCommand.canExecute();
            expect(canExecute).toBe(false);
        });

        it('returns false for already terminated process', async () => {
            testProcess.status = 'terminated';
            const canExecute = await command.canExecute();
            expect(canExecute).toBe(false);
        });
    });

    describe('execute', () => {
        it('successfully kills a running process', async () => {
            const result = await command.execute();

            expect(result.success).toBe(true);
            expect(result.processId).toBe('proc_1001');
            expect(result.processName).toBe('test_process');
            expect(result.message).toContain('terminated');
            expect(result.exitCode).toBe(-9);
            expect(typeof result.timestamp).toBe('number');

            // Check process state changes
            expect(testProcess.status).toBe('terminated');
            expect(testProcess.exitCode).toBe(-9);
            expect(typeof testProcess.endTime).toBe('number');

            // Check command state
            expect(command.executed).toBe(true);
            expect(command.timestamp).toBe(result.timestamp);
            expect(command.killedProcess).not.toBeNull();
        });

        it('stores complete process state for undo', async () => {
            await command.execute();

            expect(command.killedProcess).toEqual({
                id: 'proc_1001',
                name: 'test_process',
                type: 'emotional_processing',
                status: 'running', // Original status before kill
                priority: 'normal',
                memoryUsage: 100,
                cpuUsage: 50,
                threadCount: 2,
                lifetime: 1000,
                lastActivity: testProcess.lastActivity,
                crashCount: 0,
                emotionSource: { type: 'grief', intensity: 0.8 },
                emotionalImpact: 0.8,
                debuggable: true,
                currentIssues: [{ type: 'memory_leak', severity: 'high' }],
                interventionPoints: ['memory_cleanup', 'process_throttling'],
                effectivenessScore: 0.9,
                optimizationLevel: 1,
                config: { memoryUsage: 100, cpuUsage: 50 }
            });
        });

        it('updates performance metrics', async () => {
            const originalKilledCount = mockProcessManager.performanceMetrics.killedProcesses;
            await command.execute();

            expect(mockProcessManager.performanceMetrics.killedProcesses).toBe(originalKilledCount + 1);
            expect(command.originalMetrics.killedProcesses).toBe(originalKilledCount);
        });

        it('initializes killedProcesses metric if not present', async () => {
            delete mockProcessManager.performanceMetrics.killedProcesses;
            await command.execute();

            expect(mockProcessManager.performanceMetrics.killedProcesses).toBe(1);
            expect(command.originalMetrics.killedProcesses).toBe(0);
        });

        it('throws error for non-existent process', async () => {
            const nonExistentCommand = new KillProcessCommand(mockProcessManager, 'proc_9999');
            
            await expect(nonExistentCommand.execute()).rejects.toThrow(
                'Cannot kill process proc_9999: process not found or already terminated'
            );
        });

        it('throws error for already terminated process', async () => {
            testProcess.status = 'terminated';
            
            await expect(command.execute()).rejects.toThrow(
                'Cannot kill process proc_1001: process not found or already terminated'
            );
        });
    });

    describe('undo', () => {
        beforeEach(async () => {
            // Execute the command first
            await command.execute();
        });

        it('successfully restores killed process', async () => {
            const undoResult = await command.undo();

            expect(undoResult.success).toBe(true);
            expect(undoResult.processId).toBe('proc_1001');
            expect(undoResult.processName).toBe('test_process');
            expect(undoResult.message).toContain('restored');
            expect(typeof undoResult.timestamp).toBe('number');

            // Check process is restored
            const restoredProcess = mockProcessManager.processes.get('proc_1001');
            expect(restoredProcess.status).toBe('running');
            expect(restoredProcess.name).toBe('test_process');
            expect(restoredProcess.memoryUsage).toBe(100);
            expect(restoredProcess.cpuUsage).toBe(50);
            expect(restoredProcess.endTime).toBeUndefined();
            expect(restoredProcess.exitCode).toBeUndefined();

            // Check command state is reset
            expect(command.executed).toBe(false);
            expect(command.timestamp).toBeNull();
        });

        it('restores performance metrics', async () => {
            const originalKilledCount = command.originalMetrics.killedProcesses;
            await command.undo();

            expect(mockProcessManager.performanceMetrics.killedProcesses).toBe(originalKilledCount);
        });

        it('throws error when nothing to undo', async () => {
            const freshCommand = new KillProcessCommand(mockProcessManager, 'proc_1001');
            
            await expect(freshCommand.undo()).rejects.toThrow(
                'Nothing to undo: command was not executed or process state not stored'
            );
        });

        it('throws error when process state not stored', async () => {
            command.killedProcess = null;
            
            await expect(command.undo()).rejects.toThrow(
                'Nothing to undo: command was not executed or process state not stored'
            );
        });
    });

    describe('getDescription', () => {
        it('returns correct description', () => {
            expect(command.getDescription()).toBe('Kill process proc_1001');
        });
    });

    describe('getCommandInfo', () => {
        it('returns correct info before execution', () => {
            const info = command.getCommandInfo();
            
            expect(info.type).toBe('kill_process');
            expect(info.processId).toBe('proc_1001');
            expect(info.processName).toBe('unknown');
            expect(info.executed).toBe(false);
            expect(info.timestamp).toBeNull();
            expect(info.canUndo).toBe(false);
        });

        it('returns correct info after execution', async () => {
            await command.execute();
            const info = command.getCommandInfo();
            
            expect(info.type).toBe('kill_process');
            expect(info.processId).toBe('proc_1001');
            expect(info.processName).toBe('test_process');
            expect(info.executed).toBe(true);
            expect(typeof info.timestamp).toBe('number');
            expect(info.canUndo).toBe(true);
        });
    });

    describe('integration with base DebugCommand', () => {
        it('inherits base command properties', () => {
            expect(command.context).toEqual({ processManager: mockProcessManager, processId: 'proc_1001' });
            expect(command.isExecuted()).toBe(false);
            expect(command.getResult()).toBeNull();
            expect(command.getTimestamp()).toBeNull();
        });

        it('updates base command properties after execution', async () => {
            const result = await command.execute();
            
            expect(command.isExecuted()).toBe(true);
            expect(command.getResult()).toBe(result);
            expect(command.getTimestamp()).toBe(result.timestamp);
        });
    });
});
