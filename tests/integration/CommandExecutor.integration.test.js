import { describe, it, expect, beforeEach } from 'vitest';
import CommandExecutor from '../../lib/commands/CommandExecutor.js';
import KillProcessCommand from '../../lib/commands/KillProcessCommand.js';
import RestartProcessCommand from '../../lib/commands/RestartProcessCommand.js';
import ProcessManager from '../../lib/ProcessManager.js';

describe('CommandExecutor Integration Tests', () => {
    let executor;
    let processManager;
    let mockConsciousness;
    let testProcessId;

    beforeEach(async () => {
        // Setup mock consciousness
        mockConsciousness = {
            systemLog: [],
            resources: {
                memory: { total: 1000 }
            }
        };

        // Create process manager
        processManager = new ProcessManager(mockConsciousness);
        
        // Create command executor
        executor = new CommandExecutor({
            maxHistorySize: 10
        });

        // Create a test process
        testProcessId = await processManager.createBaseProcess({
            name: 'integration_test_process',
            type: 'test',
            memoryUsage: 100,
            cpuUsage: 50
        });
    });

    describe('KillProcessCommand integration', () => {
        it('executes kill command through CommandExecutor', async () => {
            const killCommand = new KillProcessCommand(processManager, testProcessId);
            
            // Verify process exists and is running
            const processBefore = processManager.processes.get(testProcessId);
            expect(processBefore.status).toBe('running');
            
            // Execute through CommandExecutor
            const result = await executor.execute(killCommand);
            
            // Verify execution result
            expect(result.success).toBe(true);
            expect(result.processId).toBe(testProcessId);
            expect(result.exitCode).toBe(-9);
            
            // Verify process state
            const processAfter = processManager.processes.get(testProcessId);
            expect(processAfter.status).toBe('terminated');
            
            // Verify command is in history and undo stack
            expect(executor.getHistory()).toHaveLength(1);
            expect(executor.canUndo()).toBe(true);
        });

        it('undoes kill command successfully', async () => {
            const killCommand = new KillProcessCommand(processManager, testProcessId);
            
            // Execute and then undo
            await executor.execute(killCommand);
            const undoResult = await executor.undo();
            
            // Verify undo result
            expect(undoResult.success).toBe(true);
            expect(undoResult.processId).toBe(testProcessId);
            
            // Verify process is restored
            const restoredProcess = processManager.processes.get(testProcessId);
            expect(restoredProcess.status).toBe('running');
            expect(restoredProcess.endTime).toBeUndefined();
            expect(restoredProcess.exitCode).toBeUndefined();
            
            // Verify undo/redo stacks
            expect(executor.canUndo()).toBe(false);
            expect(executor.canRedo()).toBe(true);
        });

        it('redoes kill command after undo', async () => {
            const killCommand = new KillProcessCommand(processManager, testProcessId);
            
            // Execute, undo, then redo
            await executor.execute(killCommand);
            await executor.undo();
            const redoResult = await executor.redo();
            
            // Verify redo result
            expect(redoResult.success).toBe(true);
            expect(redoResult.processId).toBe(testProcessId);
            
            // Verify process is killed again
            const processAfter = processManager.processes.get(testProcessId);
            expect(processAfter.status).toBe('terminated');
            
            // Verify stacks
            expect(executor.canUndo()).toBe(true);
            expect(executor.canRedo()).toBe(false);
        });
    });

    describe('RestartProcessCommand integration', () => {
        it('executes restart command through CommandExecutor', async () => {
            const restartCommand = new RestartProcessCommand(processManager, testProcessId);
            
            // Get initial restart count
            const processBefore = processManager.processes.get(testProcessId);
            const initialRestartCount = processBefore.restartCount || 0;
            
            // Execute through CommandExecutor
            const result = await executor.execute(restartCommand);
            
            // Verify execution result
            expect(result.success).toBe(true);
            expect(result.processId).toBe(testProcessId);
            
            // Verify process state
            const processAfter = processManager.processes.get(testProcessId);
            expect(processAfter.restartCount).toBe(initialRestartCount + 1);
            expect(processAfter.status).toBe('running');
            
            // Verify command tracking
            expect(executor.getHistory()).toHaveLength(1);
            expect(executor.canUndo()).toBe(true);
        });

        it('undoes restart command successfully', async () => {
            const restartCommand = new RestartProcessCommand(processManager, testProcessId);
            
            // Get initial state
            const processBefore = processManager.processes.get(testProcessId);
            const initialRestartCount = processBefore.restartCount || 0;
            
            // Execute and undo
            await executor.execute(restartCommand);
            const undoResult = await executor.undo();
            
            // Verify undo result
            expect(undoResult.success).toBe(true);
            
            // Verify process state is restored
            const processAfter = processManager.processes.get(testProcessId);
            expect(processAfter.restartCount).toBe(initialRestartCount);
        });
    });

    describe('batch operations with real commands', () => {
        it('executes batch of mixed commands', async () => {
            // Create multiple test processes
            const processId2 = await processManager.createBaseProcess({
                name: 'batch_test_process_2',
                type: 'test'
            });

            const killCommand = new KillProcessCommand(processManager, testProcessId);
            const restartCommand = new RestartProcessCommand(processManager, processId2);
            
            const batchResult = await executor.executeBatch([killCommand, restartCommand]);
            
            // Verify batch execution
            expect(batchResult.success).toBe(true);
            expect(batchResult.commandCount).toBe(2);
            expect(batchResult.results).toHaveLength(2);
            
            // Verify individual command effects
            const killedProcess = processManager.processes.get(testProcessId);
            const restartedProcess = processManager.processes.get(processId2);
            
            expect(killedProcess.status).toBe('terminated');
            expect(restartedProcess.restartCount).toBe(1);
            
            // Verify batch is in history
            expect(executor.getHistory()).toHaveLength(1);
            expect(executor.getHistory()[0].type).toBe('batch');
        });

        it('rolls back batch on failure', async () => {
            const killCommand = new KillProcessCommand(processManager, testProcessId);
            const invalidRestartCommand = new RestartProcessCommand(processManager, 'nonexistent_process');
            
            // Batch should fail on second command
            await expect(executor.executeBatch([killCommand, invalidRestartCommand]))
                .rejects.toThrow();
            
            // First command should be rolled back
            const process = processManager.processes.get(testProcessId);
            expect(process.status).toBe('running'); // Should be restored
            
            // No history entry should exist
            expect(executor.getHistory()).toHaveLength(0);
        });
    });

    describe('command validation with real commands', () => {
        it('validates KillProcessCommand correctly', () => {
            const killCommand = new KillProcessCommand(processManager, testProcessId);
            expect(() => executor.validateCommand(killCommand)).not.toThrow();
        });

        it('validates RestartProcessCommand correctly', () => {
            const restartCommand = new RestartProcessCommand(processManager, testProcessId);
            expect(() => executor.validateCommand(restartCommand)).not.toThrow();
        });

        it('handles command execution failure gracefully', async () => {
            const invalidKillCommand = new KillProcessCommand(processManager, 'nonexistent_process');
            
            await expect(executor.execute(invalidKillCommand)).rejects.toThrow();
            
            // Should not affect executor state
            expect(executor.getHistory()).toHaveLength(0);
            expect(executor.canUndo()).toBe(false);
        });
    });

    describe('performance with real commands', () => {
        it('executes commands with minimal overhead', async () => {
            const iterations = 10;
            const commands = [];
            
            // Create multiple processes and commands
            for (let i = 0; i < iterations; i++) {
                const processId = await processManager.createBaseProcess({
                    name: `perf_test_process_${i}`,
                    type: 'test'
                });
                commands.push(new KillProcessCommand(processManager, processId));
            }
            
            // Measure execution time
            const startTime = Date.now();
            
            for (const command of commands) {
                await executor.execute(command);
            }
            
            const executionTime = Date.now() - startTime;
            const averageTime = executionTime / iterations;
            
            // Verify performance metrics
            const metrics = executor.getMetrics();
            expect(metrics.totalExecutions).toBe(iterations);
            expect(metrics.averageExecutionTime).toBeGreaterThan(0);
            expect(averageTime).toBeLessThan(100); // Should be fast
            
            // Verify all commands executed successfully
            expect(metrics.failedExecutions).toBe(0);
        });

        it('maintains performance with history management', async () => {
            const maxHistory = 5;
            const testExecutor = new CommandExecutor({ maxHistorySize: maxHistory });
            
            // Execute more commands than history size
            for (let i = 0; i < maxHistory + 3; i++) {
                const processId = await processManager.createBaseProcess({
                    name: `history_test_process_${i}`,
                    type: 'test'
                });
                const command = new KillProcessCommand(processManager, processId);
                await testExecutor.execute(command);
            }
            
            // Verify history is maintained at max size
            expect(testExecutor.getHistory()).toHaveLength(maxHistory);
            
            // Verify performance is still good
            const metrics = testExecutor.getMetrics();
            expect(metrics.averageExecutionTime).toBeLessThan(50);
        });
    });

    describe('event emission with real commands', () => {
        it('emits events for real command execution', async () => {
            const events = [];
            
            executor.on('command-executed', (data) => events.push({ type: 'executed', data }));
            executor.on('command-undone', (data) => events.push({ type: 'undone', data }));
            
            const killCommand = new KillProcessCommand(processManager, testProcessId);
            
            // Execute and undo
            await executor.execute(killCommand);
            await executor.undo();
            
            // Verify events were emitted
            expect(events).toHaveLength(2);
            expect(events[0].type).toBe('executed');
            expect(events[1].type).toBe('undone');
            
            // Verify event data
            expect(events[0].data.command).toBe(killCommand);
            expect(events[0].data.success).toBe(true);
            expect(events[1].data.command).toBe(killCommand);
        });
    });
});
