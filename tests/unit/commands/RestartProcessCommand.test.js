import { describe, it, expect, beforeEach, vi } from 'vitest';
import RestartProcessCommand from '../../../lib/commands/RestartProcessCommand.js';

describe('RestartProcessCommand', () => {
    let mockProcessManager;
    let testProcess;
    let command;

    beforeEach(() => {
        // Create a test process with some issues and resource usage
        testProcess = {
            id: 'proc_2001',
            name: 'test_restart_process',
            type: 'emotional_processing',
            status: 'running',
            priority: 'normal',
            memoryUsage: 150,
            cpuUsage: 75,
            threadCount: 3,
            lifetime: 5000,
            lastActivity: Date.now() - 2000,
            crashCount: 1,
            emotionSource: { type: 'anxiety', intensity: 0.7 },
            emotionalImpact: 0.7,
            debuggable: true,
            currentIssues: [
                { type: 'memory_leak', severity: 'high' },
                { type: 'cpu_spike', severity: 'medium' }
            ],
            interventionPoints: ['memory_cleanup', 'process_throttling'],
            effectivenessScore: 0.6,
            optimizationLevel: 2,
            config: { memoryUsage: 100, cpuUsage: 50, threadCount: 2 },
            restartCount: 2,
            lastRestart: Date.now() - 10000
        };

        // Create mock ProcessManager
        mockProcessManager = {
            processes: new Map([['proc_2001', testProcess]]),
            performanceMetrics: {
                totalProcesses: 8,
                averageLifetime: 3000,
                crashRate: 0.2,
                optimizationAttempts: 5,
                killedProcesses: 1,
                processRestarts: 3
            }
        };

        command = new RestartProcessCommand(mockProcessManager, 'proc_2001');
    });

    describe('constructor', () => {
        it('initializes with correct properties', () => {
            expect(command.processManager).toBe(mockProcessManager);
            expect(command.processId).toBe('proc_2001');
            expect(command.previousState).toBeNull();
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

        it('returns true for crashed process', async () => {
            testProcess.status = 'crashed';
            const canExecute = await command.canExecute();
            expect(canExecute).toBe(true);
        });

        it('throws error for non-existent process', async () => {
            const nonExistentCommand = new RestartProcessCommand(mockProcessManager, 'proc_9999');
            
            await expect(nonExistentCommand.canExecute()).rejects.toThrow(
                'Process proc_9999 not found'
            );
        });

        it('throws error for terminated process', async () => {
            testProcess.status = 'terminated';
            
            await expect(command.canExecute()).rejects.toThrow(
                'Process proc_2001 is terminated and cannot be restarted'
            );
        });
    });

    describe('execute', () => {
        it('successfully restarts a running process', async () => {
            const result = await command.execute();

            expect(result.success).toBe(true);
            expect(result.processId).toBe('proc_2001');
            expect(result.processName).toBe('test_restart_process');
            expect(result.message).toContain('restarted');
            expect(result.restartCount).toBe(3); // Original 2 + 1
            expect(typeof result.timestamp).toBe('number');
            expect(result.resetFields).toBeDefined();

            // Check process state changes
            expect(testProcess.status).toBe('running');
            expect(testProcess.lifetime).toBe(0);
            expect(testProcess.currentIssues).toEqual([]);
            expect(testProcess.memoryUsage).toBe(100); // Reset to config value
            expect(testProcess.cpuUsage).toBe(50); // Reset to config value
            expect(testProcess.threadCount).toBe(2); // Reset to config value
            expect(testProcess.restartCount).toBe(3);
            expect(typeof testProcess.lastRestart).toBe('number');
            expect(typeof testProcess.lastActivity).toBe('number');

            // Check command state
            expect(command.executed).toBe(true);
            expect(command.timestamp).toBe(result.timestamp);
            expect(command.previousState).not.toBeNull();
        });

        it('stores complete process state for undo', async () => {
            const originalLastActivity = testProcess.lastActivity;
            const originalLastRestart = testProcess.lastRestart;
            await command.execute();

            expect(command.previousState).toEqual({
                id: 'proc_2001',
                name: 'test_restart_process',
                type: 'emotional_processing',
                status: 'running',
                priority: 'normal',
                memoryUsage: 150,
                cpuUsage: 75,
                threadCount: 3,
                lifetime: 5000,
                lastActivity: originalLastActivity,
                crashCount: 1,
                emotionSource: { type: 'anxiety', intensity: 0.7 },
                emotionalImpact: 0.7,
                debuggable: true,
                currentIssues: [
                    { type: 'memory_leak', severity: 'high' },
                    { type: 'cpu_spike', severity: 'medium' }
                ],
                interventionPoints: ['memory_cleanup', 'process_throttling'],
                effectivenessScore: 0.6,
                optimizationLevel: 2,
                config: { memoryUsage: 100, cpuUsage: 50, threadCount: 2 },
                restartCount: 2,
                lastRestart: originalLastRestart
            });
        });

        it('updates performance metrics', async () => {
            const originalRestartCount = mockProcessManager.performanceMetrics.processRestarts;
            await command.execute();

            expect(mockProcessManager.performanceMetrics.processRestarts).toBe(originalRestartCount + 1);
            expect(command.originalMetrics.processRestarts).toBe(originalRestartCount);
        });

        it('initializes processRestarts metric if not present', async () => {
            delete mockProcessManager.performanceMetrics.processRestarts;
            await command.execute();

            expect(mockProcessManager.performanceMetrics.processRestarts).toBe(1);
            expect(command.originalMetrics.processRestarts).toBe(0);
        });

        it('resets process to config defaults when config is missing', async () => {
            delete testProcess.config;
            await command.execute();

            expect(testProcess.memoryUsage).toBe(50); // Default value
            expect(testProcess.cpuUsage).toBe(10); // Default value
            expect(testProcess.threadCount).toBe(1); // Default value
        });

        it('throws error for non-existent process', async () => {
            const nonExistentCommand = new RestartProcessCommand(mockProcessManager, 'proc_9999');
            
            await expect(nonExistentCommand.execute()).rejects.toThrow(
                'Process proc_9999 not found'
            );
        });

        it('throws error for terminated process', async () => {
            testProcess.status = 'terminated';
            
            await expect(command.execute()).rejects.toThrow(
                'Process proc_2001 is terminated and cannot be restarted'
            );
        });
    });

    describe('undo', () => {
        beforeEach(async () => {
            // Execute the command first
            await command.execute();
        });

        it('successfully restores process to pre-restart state', async () => {
            const undoResult = await command.undo();

            expect(undoResult.success).toBe(true);
            expect(undoResult.processId).toBe('proc_2001');
            expect(undoResult.processName).toBe('test_restart_process');
            expect(undoResult.message).toContain('restart undone');
            expect(typeof undoResult.timestamp).toBe('number');
            expect(undoResult.restoredState).toBeDefined();

            // Check process is restored to original state
            const restoredProcess = mockProcessManager.processes.get('proc_2001');
            expect(restoredProcess.status).toBe('running');
            expect(restoredProcess.lifetime).toBe(5000); // Original value
            expect(restoredProcess.memoryUsage).toBe(150); // Original value
            expect(restoredProcess.cpuUsage).toBe(75); // Original value
            expect(restoredProcess.threadCount).toBe(3); // Original value
            expect(restoredProcess.currentIssues).toHaveLength(2); // Original issues restored
            expect(restoredProcess.restartCount).toBe(2); // Original restart count
            expect(restoredProcess.crashCount).toBe(1); // Original crash count

            // Check command state is reset
            expect(command.executed).toBe(false);
            expect(command.timestamp).toBeNull();
        });

        it('restores performance metrics', async () => {
            const originalRestartCount = command.originalMetrics.processRestarts;
            await command.undo();

            expect(mockProcessManager.performanceMetrics.processRestarts).toBe(originalRestartCount);
        });

        it('throws error when nothing to undo', async () => {
            const freshCommand = new RestartProcessCommand(mockProcessManager, 'proc_2001');
            
            await expect(freshCommand.undo()).rejects.toThrow(
                'Nothing to undo: command was not executed or process state not stored'
            );
        });

        it('throws error when process state not stored', async () => {
            command.previousState = null;
            
            await expect(command.undo()).rejects.toThrow(
                'Nothing to undo: command was not executed or process state not stored'
            );
        });
    });

    describe('getDescription', () => {
        it('returns correct description', () => {
            expect(command.getDescription()).toBe('Restart process proc_2001');
        });
    });

    describe('getCommandInfo', () => {
        it('returns correct info before execution', () => {
            const info = command.getCommandInfo();
            
            expect(info.type).toBe('restart_process');
            expect(info.processId).toBe('proc_2001');
            expect(info.processName).toBe('unknown');
            expect(info.executed).toBe(false);
            expect(info.timestamp).toBeNull();
            expect(info.canUndo).toBe(false);
            expect(info.restartCount).toBe(0);
        });

        it('returns correct info after execution', async () => {
            await command.execute();
            const info = command.getCommandInfo();
            
            expect(info.type).toBe('restart_process');
            expect(info.processId).toBe('proc_2001');
            expect(info.processName).toBe('test_restart_process');
            expect(info.executed).toBe(true);
            expect(typeof info.timestamp).toBe('number');
            expect(info.canUndo).toBe(true);
            expect(info.restartCount).toBe(2); // Original restart count before execution
        });
    });

    describe('integration with base DebugCommand', () => {
        it('inherits base command properties', () => {
            expect(command.context).toEqual({ processManager: mockProcessManager, processId: 'proc_2001' });
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
