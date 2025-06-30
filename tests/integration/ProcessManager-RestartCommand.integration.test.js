import { describe, it, expect, beforeEach } from 'vitest';
import ProcessManager from '../../lib/ProcessManager.js';

describe('ProcessManager RestartCommand Integration', () => {
    let processManager;
    let mockConsciousness;

    beforeEach(() => {
        mockConsciousness = {
            systemLog: [],
            resources: {
                memory: { total: 1000 }
            }
        };
        
        processManager = new ProcessManager(mockConsciousness);
    });

    describe('restartProcess method integration', () => {
        it('uses RestartProcessCommand internally and maintains backward compatibility', async () => {
            // Create a test process with some issues
            const processId = await processManager.createBaseProcess({
                name: 'test_integration_restart_process',
                type: 'test',
                memoryUsage: 150,
                cpuUsage: 80,
                threadCount: 3
            });

            // Add some issues and modify the process to simulate runtime state
            const process = processManager.processes.get(processId);
            process.currentIssues = [{ type: 'memory_leak', severity: 'high' }];
            process.lifetime = 5000;
            process.crashCount = 1;
            process.memoryUsage = 200; // Increased from original
            process.cpuUsage = 95; // Increased from original

            // Restart the process using the original API
            const result = await processManager.restartProcess(processId);

            // Verify the result matches the expected format
            expect(result.success).toBe(true);
            expect(result.processId).toBe(processId);
            expect(result.processName).toBe('test_integration_restart_process');
            expect(result.message).toContain('restarted');
            expect(result.restartCount).toBe(1);
            expect(typeof result.timestamp).toBe('number');
            expect(result.resetFields).toBeDefined();

            // Verify the process is actually restarted
            const restartedProcess = processManager.processes.get(processId);
            expect(restartedProcess.status).toBe('running');
            expect(restartedProcess.lifetime).toBe(0);
            expect(restartedProcess.currentIssues).toEqual([]);
            expect(restartedProcess.memoryUsage).toBe(150); // Reset to config value
            expect(restartedProcess.cpuUsage).toBe(80); // Reset to config value
            expect(restartedProcess.threadCount).toBe(3); // Reset to config value
            expect(restartedProcess.restartCount).toBe(1);
            expect(typeof restartedProcess.lastRestart).toBe('number');
            expect(typeof restartedProcess.lastActivity).toBe('number');

            // Verify metrics were updated
            expect(processManager.performanceMetrics.processRestarts).toBe(1);
        });

        it('throws error for non-existent process (backward compatibility)', async () => {
            await expect(processManager.restartProcess('non_existent_process')).rejects.toThrow(
                'Process non_existent_process not found'
            );
        });

        it('throws error for terminated process', async () => {
            // Create and kill a process
            const processId = await processManager.createBaseProcess({
                name: 'test_terminated_process',
                type: 'test'
            });

            await processManager.killProcess(processId);

            // Try to restart the terminated process
            await expect(processManager.restartProcess(processId)).rejects.toThrow(
                `Process ${processId} is terminated and cannot be restarted`
            );
        });

        it('handles multiple restarts correctly', async () => {
            // Create a test process
            const processId = await processManager.createBaseProcess({
                name: 'test_multi_restart_process',
                type: 'test',
                memoryUsage: 100,
                cpuUsage: 50
            });

            // Perform multiple restarts
            const results = [];
            for (let i = 0; i < 3; i++) {
                // Add some issues before each restart
                const process = processManager.processes.get(processId);
                process.currentIssues = [{ type: 'test_issue', severity: 'medium' }];
                process.memoryUsage += 50; // Simulate memory growth
                
                const result = await processManager.restartProcess(processId);
                results.push(result);
            }

            // Verify all restarts were successful
            results.forEach((result, index) => {
                expect(result.success).toBe(true);
                expect(result.processId).toBe(processId);
                expect(result.restartCount).toBe(index + 1);
            });

            // Verify final state
            const finalProcess = processManager.processes.get(processId);
            expect(finalProcess.restartCount).toBe(3);
            expect(finalProcess.currentIssues).toEqual([]);
            expect(finalProcess.memoryUsage).toBe(100); // Reset to config value
            expect(processManager.performanceMetrics.processRestarts).toBe(3);
        });

        it('resets crashed process correctly', async () => {
            // Create a process
            const processId = await processManager.createBaseProcess({
                name: 'test_crashed_process',
                type: 'test'
            });

            // Simulate a crash
            const process = processManager.processes.get(processId);
            process.status = 'crashed';
            process.crashCount = 2;
            process.currentIssues = [
                { type: 'critical_error', severity: 'critical' },
                { type: 'memory_corruption', severity: 'high' }
            ];

            // Restart the crashed process
            const result = await processManager.restartProcess(processId);

            expect(result.success).toBe(true);
            expect(result.message).toContain('restarted');

            // Verify the process is properly reset
            const restartedProcess = processManager.processes.get(processId);
            expect(restartedProcess.status).toBe('running');
            expect(restartedProcess.currentIssues).toEqual([]);
            expect(restartedProcess.lifetime).toBe(0);
            expect(restartedProcess.crashCount).toBe(2); // Crash count should be preserved
        });
    });

    describe('performance metrics integration', () => {
        it('initializes processRestarts metric correctly', () => {
            expect(processManager.performanceMetrics.processRestarts).toBe(0);
        });

        it('increments processRestarts metric with each restart', async () => {
            const processId1 = await processManager.createBaseProcess({ name: 'test1' });
            const processId2 = await processManager.createBaseProcess({ name: 'test2' });

            expect(processManager.performanceMetrics.processRestarts).toBe(0);

            await processManager.restartProcess(processId1);
            expect(processManager.performanceMetrics.processRestarts).toBe(1);

            await processManager.restartProcess(processId2);
            expect(processManager.performanceMetrics.processRestarts).toBe(2);

            // Restart the same process again
            await processManager.restartProcess(processId1);
            expect(processManager.performanceMetrics.processRestarts).toBe(3);
        });
    });

    describe('process state preservation', () => {
        it('preserves non-resettable process properties', async () => {
            const processId = await processManager.createBaseProcess({
                name: 'test_preservation_process',
                type: 'emotional_processing',
                emotionSource: { type: 'grief', intensity: 0.8 },
                emotionalImpact: 0.8
            });

            const process = processManager.processes.get(processId);
            const originalId = process.id;
            const originalName = process.name;
            const originalType = process.type;
            const originalEmotionSource = process.emotionSource;
            const originalEmotionalImpact = process.emotionalImpact;

            // Restart the process
            await processManager.restartProcess(processId);

            const restartedProcess = processManager.processes.get(processId);
            
            // These should be preserved
            expect(restartedProcess.id).toBe(originalId);
            expect(restartedProcess.name).toBe(originalName);
            expect(restartedProcess.type).toBe(originalType);
            expect(restartedProcess.emotionSource).toEqual(originalEmotionSource);
            expect(restartedProcess.emotionalImpact).toBe(originalEmotionalImpact);
        });
    });
});
