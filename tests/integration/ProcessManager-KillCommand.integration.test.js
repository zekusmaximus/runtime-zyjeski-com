import { describe, it, expect, beforeEach } from 'vitest';
import ProcessManager from '../../lib/ProcessManager.js';

describe('ProcessManager KillCommand Integration', () => {
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

    describe('killProcess method integration', () => {
        it('uses KillProcessCommand internally and maintains backward compatibility', async () => {
            // Create a test process
            const processId = await processManager.createBaseProcess({
                name: 'test_integration_process',
                type: 'test',
                memoryUsage: 100,
                cpuUsage: 50
            });

            // Verify process exists and is running
            const process = processManager.processes.get(processId);
            expect(process).toBeDefined();
            expect(process.status).toBe('running');

            // Kill the process using the original API
            const result = await processManager.killProcess(processId);

            // Verify the result matches the expected format
            expect(result.success).toBe(true);
            expect(result.processId).toBe(processId);
            expect(result.processName).toBe('test_integration_process');
            expect(result.message).toContain('terminated');
            expect(result.exitCode).toBe(-9);
            expect(typeof result.timestamp).toBe('number');

            // Verify the process is actually terminated
            const killedProcess = processManager.processes.get(processId);
            expect(killedProcess.status).toBe('terminated');
            expect(killedProcess.exitCode).toBe(-9);
            expect(typeof killedProcess.endTime).toBe('number');

            // Verify metrics were updated
            expect(processManager.performanceMetrics.killedProcesses).toBe(1);
        });

        it('throws error for non-existent process (backward compatibility)', async () => {
            await expect(processManager.killProcess('non_existent_process')).rejects.toThrow(
                'Cannot kill process non_existent_process'
            );
        });

        it('maintains process in map after kill (new behavior)', async () => {
            // Create a test process
            const processId = await processManager.createBaseProcess({
                name: 'test_persistence_process',
                type: 'test'
            });

            // Kill the process
            await processManager.killProcess(processId);

            // Verify process remains in map (new behavior - no setTimeout deletion)
            expect(processManager.processes.has(processId)).toBe(true);
            
            const process = processManager.processes.get(processId);
            expect(process.status).toBe('terminated');
        });

        it('handles multiple kills correctly', async () => {
            // Create multiple test processes
            const processIds = [];
            for (let i = 0; i < 3; i++) {
                const id = await processManager.createBaseProcess({
                    name: `test_multi_process_${i}`,
                    type: 'test'
                });
                processIds.push(id);
            }

            // Kill all processes
            const results = [];
            for (const id of processIds) {
                const result = await processManager.killProcess(id);
                results.push(result);
            }

            // Verify all kills were successful
            results.forEach((result, index) => {
                expect(result.success).toBe(true);
                expect(result.processId).toBe(processIds[index]);
                expect(result.processName).toBe(`test_multi_process_${index}`);
            });

            // Verify metrics
            expect(processManager.performanceMetrics.killedProcesses).toBe(3);

            // Verify all processes are terminated
            processIds.forEach(id => {
                const process = processManager.processes.get(id);
                expect(process.status).toBe('terminated');
            });
        });
    });

    describe('performance metrics integration', () => {
        it('initializes killedProcesses metric correctly', () => {
            expect(processManager.performanceMetrics.killedProcesses).toBe(0);
        });

        it('increments killedProcesses metric with each kill', async () => {
            const processId1 = await processManager.createBaseProcess({ name: 'test1' });
            const processId2 = await processManager.createBaseProcess({ name: 'test2' });

            expect(processManager.performanceMetrics.killedProcesses).toBe(0);

            await processManager.killProcess(processId1);
            expect(processManager.performanceMetrics.killedProcesses).toBe(1);

            await processManager.killProcess(processId2);
            expect(processManager.performanceMetrics.killedProcesses).toBe(2);
        });
    });
});
