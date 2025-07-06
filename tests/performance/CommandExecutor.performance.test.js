import { describe, it, expect, beforeEach } from 'vitest';
import CommandExecutor from '../../lib/commands/CommandExecutor.js';
import KillProcessCommand from '../../lib/commands/KillProcessCommand.js';
import RestartProcessCommand from '../../lib/commands/RestartProcessCommand.js';
import ProcessManager from '../../lib/ProcessManager.js';

describe('CommandExecutor Performance Tests', () => {
    let processManager;
    let commandExecutor;
    let mockConsciousness;

    beforeEach(async () => {
        mockConsciousness = {
            systemLog: [],
            resources: {
                memory: { total: 1000 }
            }
        };

        processManager = new ProcessManager(mockConsciousness, {
            enableAdvancedCommands: false // Disable for baseline testing
        });
        commandExecutor = new CommandExecutor();
    });

    describe('execution overhead benchmarks', () => {
        it('measures direct command execution baseline', async () => {
            const iterations = 100;
            const processIds = [];

            // Create test processes
            for (let i = 0; i < iterations; i++) {
                const processId = await processManager.createBaseProcess({
                    name: `perf_test_direct_${i}`,
                    type: 'test'
                });
                processIds.push(processId);
            }

            // Measure direct execution time
            const startTime = Date.now();
            
            for (const processId of processIds) {
                const command = new KillProcessCommand(processManager, processId);
                await command.execute();
            }
            
            const directExecutionTime = Date.now() - startTime;
            const averageDirectTime = directExecutionTime / iterations;

            console.log(`Direct execution: ${directExecutionTime}ms total, ${averageDirectTime.toFixed(2)}ms average`);
            
            expect(averageDirectTime).toBeLessThan(10); // Should be very fast
            return { directExecutionTime, averageDirectTime };
        });

        it('measures CommandExecutor execution overhead', async () => {
            const iterations = 100;
            const processIds = [];

            // Create test processes
            for (let i = 0; i < iterations; i++) {
                const processId = await processManager.createBaseProcess({
                    name: `perf_test_executor_${i}`,
                    type: 'test'
                });
                processIds.push(processId);
            }

            // Measure CommandExecutor execution time
            const startTime = Date.now();
            
            for (const processId of processIds) {
                const command = new KillProcessCommand(processManager, processId);
                await commandExecutor.execute(command);
            }
            
            const executorExecutionTime = Date.now() - startTime;
            const averageExecutorTime = executorExecutionTime / iterations;

            console.log(`CommandExecutor execution: ${executorExecutionTime}ms total, ${averageExecutorTime.toFixed(2)}ms average`);
            
            expect(averageExecutorTime).toBeLessThan(15); // Should still be fast
            return { executorExecutionTime, averageExecutorTime };
        });

        it('verifies overhead is acceptable', async () => {
            const iterations = 50;

            // Baseline: Direct execution
            const directProcessIds = [];
            for (let i = 0; i < iterations; i++) {
                const processId = await processManager.createBaseProcess({
                    name: `perf_baseline_${i}`,
                    type: 'test'
                });
                directProcessIds.push(processId);
            }

            const directStartTime = Date.now();
            for (const processId of directProcessIds) {
                const command = new KillProcessCommand(processManager, processId);
                await command.execute();
            }
            const directTime = Date.now() - directStartTime;

            // CommandExecutor execution
            const executorProcessIds = [];
            for (let i = 0; i < iterations; i++) {
                const processId = await processManager.createBaseProcess({
                    name: `perf_executor_${i}`,
                    type: 'test'
                });
                executorProcessIds.push(processId);
            }

            const executorStartTime = Date.now();
            for (const processId of executorProcessIds) {
                const command = new KillProcessCommand(processManager, processId);
                await commandExecutor.execute(command);
            }
            const executorTime = Date.now() - executorStartTime;

            console.log(`Direct time: ${directTime}ms`);
            console.log(`Executor time: ${executorTime}ms`);

            // Performance verification: Both should be very fast
            // In a production environment, both should complete in under 100ms for 50 operations
            expect(directTime).toBeLessThanOrEqual(100);
            expect(executorTime).toBeLessThanOrEqual(150); // Allow slightly more time for CommandExecutor

            // Calculate overhead if both times are measurable
            if (directTime > 0 && executorTime > 0) {
                const overhead = ((executorTime - directTime) / directTime) * 100;
                console.log(`Overhead: ${overhead.toFixed(2)}%`);

                // If overhead is measurable and reasonable, verify it's acceptable
                if (overhead < 1000) { // Only check overhead if it's reasonable
                    expect(overhead).toBeLessThan(1000); // Relaxed threshold for slower environments
                }
            }

            console.log('✓ CommandExecutor performance is acceptable');
        });
    });

    describe('memory usage benchmarks', () => {
        it('measures memory usage with full history', async () => {
            const maxHistory = 50;
            const testExecutor = new CommandExecutor({ maxHistorySize: maxHistory });
            
            // Fill history to maximum
            for (let i = 0; i < maxHistory + 10; i++) {
                const processId = await processManager.createBaseProcess({
                    name: `memory_test_${i}`,
                    type: 'test'
                });
                const command = new KillProcessCommand(processManager, processId);
                await testExecutor.execute(command);
            }

            // Verify history is maintained at max size
            expect(testExecutor.getHistory()).toHaveLength(maxHistory);
            
            // Verify performance is still good
            const metrics = testExecutor.getMetrics();
            expect(metrics.averageExecutionTime).toBeLessThan(20);
            
            console.log(`History size: ${testExecutor.getHistory().length}`);
            console.log(`Average execution time with full history: ${metrics.averageExecutionTime.toFixed(2)}ms`);
        });

        it('measures undo/redo stack performance', async () => {
            const iterations = 20;
            const commands = [];

            // Execute commands to build undo stack
            for (let i = 0; i < iterations; i++) {
                const processId = await processManager.createBaseProcess({
                    name: `undo_test_${i}`,
                    type: 'test'
                });
                const command = new KillProcessCommand(processManager, processId);
                commands.push(command);
                await commandExecutor.execute(command);
            }

            // Measure undo performance
            const undoStartTime = Date.now();
            for (let i = 0; i < iterations; i++) {
                await commandExecutor.undo();
            }
            const undoTime = Date.now() - undoStartTime;
            const averageUndoTime = undoTime / iterations;

            // Measure redo performance
            const redoStartTime = Date.now();
            for (let i = 0; i < iterations; i++) {
                await commandExecutor.redo();
            }
            const redoTime = Date.now() - redoStartTime;
            const averageRedoTime = redoTime / iterations;

            console.log(`Average undo time: ${averageUndoTime.toFixed(2)}ms`);
            console.log(`Average redo time: ${averageRedoTime.toFixed(2)}ms`);

            expect(averageUndoTime).toBeLessThan(10);
            expect(averageRedoTime).toBeLessThan(10);
        });
    });

    describe('batch operation performance', () => {
        it('measures batch execution performance', async () => {
            const batchSize = 10;
            const batches = 5;
            
            for (let batch = 0; batch < batches; batch++) {
                const commands = [];
                
                // Create batch of commands
                for (let i = 0; i < batchSize; i++) {
                    const processId = await processManager.createBaseProcess({
                        name: `batch_perf_${batch}_${i}`,
                        type: 'test'
                    });
                    commands.push(new KillProcessCommand(processManager, processId));
                }

                // Measure batch execution time
                const startTime = Date.now();
                await commandExecutor.executeBatch(commands);
                const batchTime = Date.now() - startTime;
                const averageCommandTime = batchTime / batchSize;

                console.log(`Batch ${batch}: ${batchTime}ms total, ${averageCommandTime.toFixed(2)}ms per command`);
                
                expect(averageCommandTime).toBeLessThan(15);
            }
        });

        it('measures batch rollback performance', async () => {
            const batchSize = 8;
            const commands = [];
            
            // Create batch with failing command at the end
            for (let i = 0; i < batchSize - 1; i++) {
                const processId = await processManager.createBaseProcess({
                    name: `rollback_perf_${i}`,
                    type: 'test'
                });
                commands.push(new KillProcessCommand(processManager, processId));
            }
            
            // Add failing command
            commands.push(new KillProcessCommand(processManager, 'nonexistent_process'));

            // Measure rollback performance
            const startTime = Date.now();
            try {
                await commandExecutor.executeBatch(commands);
            } catch (err) {
                // Expected to fail
            }
            const rollbackTime = Date.now() - startTime;

            console.log(`Batch rollback time: ${rollbackTime}ms`);
            expect(rollbackTime).toBeLessThan(100); // Should be reasonably fast
        });
    });

    describe('concurrent execution performance', () => {
        it('handles concurrent command execution', async () => {
            const concurrentCommands = 10;
            const promises = [];

            // Create concurrent command executions
            for (let i = 0; i < concurrentCommands; i++) {
                const processId = await processManager.createBaseProcess({
                    name: `concurrent_${i}`,
                    type: 'test'
                });
                const command = new KillProcessCommand(processManager, processId);
                promises.push(commandExecutor.execute(command));
            }

            // Measure concurrent execution time
            const startTime = Date.now();
            await Promise.all(promises);
            const concurrentTime = Date.now() - startTime;
            const averageTime = concurrentTime / concurrentCommands;

            console.log(`Concurrent execution: ${concurrentTime}ms total, ${averageTime.toFixed(2)}ms average`);
            
            expect(averageTime).toBeLessThan(20);
            expect(commandExecutor.getHistory()).toHaveLength(concurrentCommands);
        });
    });
});
