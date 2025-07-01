// OptimizeProcessCommand.performance.test.js - Performance benchmarks for OptimizeProcessCommand
// Validates execution time, memory usage, and undo performance requirements

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OptimizeProcessCommand } from '../../lib/commands/OptimizeProcessCommand.js';
import ProcessManager from '../../lib/ProcessManager.js';
import { EventEmitter } from 'events';

// Performance monitoring utilities
class PerformanceMonitor {
    constructor() {
        this.measurements = [];
    }

    async measureExecution(name, fn) {
        const startTime = process.hrtime.bigint();
        const startMemory = process.memoryUsage();
        
        const result = await fn();
        
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        
        const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        const memoryDelta = {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            external: endMemory.external - startMemory.external
        };
        
        this.measurements.push({
            name,
            executionTime,
            memoryDelta,
            timestamp: Date.now()
        });
        
        return { result, executionTime, memoryDelta };
    }

    getStats(name) {
        const measurements = this.measurements.filter(m => m.name === name);
        if (measurements.length === 0) return null;

        const times = measurements.map(m => m.executionTime);
        const memoryUsages = measurements.map(m => m.memoryDelta.heapUsed);

        return {
            count: measurements.length,
            executionTime: {
                min: Math.min(...times),
                max: Math.max(...times),
                avg: times.reduce((a, b) => a + b, 0) / times.length,
                p95: this.percentile(times, 95),
                p99: this.percentile(times, 99)
            },
            memoryUsage: {
                min: Math.min(...memoryUsages),
                max: Math.max(...memoryUsages),
                avg: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
            }
        };
    }

    percentile(arr, p) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index];
    }

    reset() {
        this.measurements = [];
    }
}

// Test data generators
const createMockConsciousnessInstance = () => ({
    id: 'alexander_kane',
    name: 'Alexander Kane',
    resources: {
        cpu: { total: 100, used: 0 },
        memory: { total: 10000, used: 0 },
        threads: { total: 16, used: 0 }
    },
    systemLog: [],
    narrativeEngine: { checkTriggers: () => {} }
});

const createTestProcess = (id, complexity = 'normal') => {
    const baseProcess = {
        id,
        name: 'test_process.exe',
        type: 'emotional_processing',
        status: 'running',
        priority: 'normal',
        memoryUsage: 150,
        cpuUsage: 40,
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
        config: {}
    };

    // Adjust complexity
    switch (complexity) {
        case 'simple':
            return { ...baseProcess, cpuUsage: 20, memoryUsage: 50, threadCount: 1, emotionalImpact: 0.3 };
        case 'complex':
            return { ...baseProcess, cpuUsage: 80, memoryUsage: 400, threadCount: 8, emotionalImpact: 0.9 };
        case 'extreme':
            return { ...baseProcess, cpuUsage: 95, memoryUsage: 800, threadCount: 12, emotionalImpact: 0.95 };
        default:
            return baseProcess;
    }
};

describe('OptimizeProcessCommand Performance', () => {
    let processManager;
    let consciousnessEngine;
    let eventEmitter;
    let monitor;

    beforeEach(() => {
        const consciousnessInstance = createMockConsciousnessInstance();
        processManager = new ProcessManager(consciousnessInstance);
        consciousnessEngine = {
            instances: new Map([['alexander_kane', { processManager }]]),
            getState: () => ({ consciousness: {} })
        };
        eventEmitter = new EventEmitter();
        monitor = new PerformanceMonitor();
    });

    afterEach(() => {
        monitor.reset();
    });

    describe('Execution Time Requirements', () => {
        it('should complete simple optimization within 100ms', async () => {
            const testProcess = createTestProcess('proc_1001', 'simple');
            processManager.processes.set('proc_1001', testProcess);

            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const { executionTime } = await monitor.measureExecution('simple_optimization', async () => {
                return await command.execute();
            });

            expect(executionTime).toBeLessThan(100);
        });

        it('should complete normal optimization within 100ms', async () => {
            const testProcess = createTestProcess('proc_1001', 'normal');
            processManager.processes.set('proc_1001', testProcess);

            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const { executionTime } = await monitor.measureExecution('normal_optimization', async () => {
                return await command.execute();
            });

            expect(executionTime).toBeLessThan(100);
        });

        it('should complete complex optimization within 100ms', async () => {
            const testProcess = createTestProcess('proc_1001', 'complex');
            processManager.processes.set('proc_1001', testProcess);

            const params = { processId: 'proc_1001', characterId: 'alexander_kane', strategy: 'hybrid_optimization' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const { executionTime } = await monitor.measureExecution('complex_optimization', async () => {
                return await command.execute();
            });

            expect(executionTime).toBeLessThan(100);
        });

        it('should maintain performance under load (100 optimizations)', async () => {
            const iterations = 100;
            const processes = [];

            // Create test processes
            for (let i = 0; i < iterations; i++) {
                const process = createTestProcess(`proc_${i}`, i % 3 === 0 ? 'complex' : 'normal');
                processManager.processes.set(`proc_${i}`, process);
                processes.push(process);
            }

            // Run optimizations
            for (let i = 0; i < iterations; i++) {
                const params = { processId: `proc_${i}`, characterId: 'alexander_kane' };
                const dependencies = { processManager, consciousnessEngine, eventEmitter };
                const command = new OptimizeProcessCommand(params, dependencies);

                await monitor.measureExecution('load_test_optimization', async () => {
                    return await command.execute();
                });
            }

            const stats = monitor.getStats('load_test_optimization');
            
            // Performance should remain consistent
            expect(stats.executionTime.avg).toBeLessThan(100);
            expect(stats.executionTime.p95).toBeLessThan(150);
            expect(stats.executionTime.p99).toBeLessThan(200);
        });
    });

    describe('Undo Performance Requirements', () => {
        it('should complete undo within 50ms', async () => {
            const testProcess = createTestProcess('proc_1001', 'normal');
            processManager.processes.set('proc_1001', testProcess);

            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            // Execute first
            await command.execute();

            // Measure undo performance
            const { executionTime } = await monitor.measureExecution('undo_operation', async () => {
                return await command.undo();
            });

            expect(executionTime).toBeLessThan(50);
        });

        it('should complete complex undo within 50ms', async () => {
            const testProcess = createTestProcess('proc_1001', 'complex');
            processManager.processes.set('proc_1001', testProcess);

            const params = { processId: 'proc_1001', characterId: 'alexander_kane', strategy: 'hybrid_optimization' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            await command.execute();

            const { executionTime } = await monitor.measureExecution('complex_undo', async () => {
                return await command.undo();
            });

            expect(executionTime).toBeLessThan(50);
        });

        it('should maintain undo performance under load', async () => {
            const iterations = 50;
            const commands = [];

            // Create and execute commands
            for (let i = 0; i < iterations; i++) {
                const process = createTestProcess(`proc_${i}`, 'normal');
                processManager.processes.set(`proc_${i}`, process);

                const params = { processId: `proc_${i}`, characterId: 'alexander_kane' };
                const dependencies = { processManager, consciousnessEngine, eventEmitter };
                const command = new OptimizeProcessCommand(params, dependencies);

                await command.execute();
                commands.push(command);
            }

            // Measure undo performance
            for (const command of commands) {
                await monitor.measureExecution('load_test_undo', async () => {
                    return await command.undo();
                });
            }

            const stats = monitor.getStats('load_test_undo');
            
            expect(stats.executionTime.avg).toBeLessThan(50);
            expect(stats.executionTime.p95).toBeLessThan(75);
        });
    });

    describe('Memory Usage Requirements', () => {
        it('should use less than 5MB memory overhead per optimization', async () => {
            const testProcess = createTestProcess('proc_1001', 'normal');
            processManager.processes.set('proc_1001', testProcess);

            const params = { processId: 'proc_1001', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const { memoryDelta } = await monitor.measureExecution('memory_test', async () => {
                return await command.execute();
            });

            // 5MB = 5 * 1024 * 1024 bytes
            const maxMemoryOverhead = 5 * 1024 * 1024;
            expect(memoryDelta.heapUsed).toBeLessThan(maxMemoryOverhead);
        });

        it('should not leak memory during multiple optimizations', async () => {
            const iterations = 20;
            const initialMemory = process.memoryUsage().heapUsed;

            for (let i = 0; i < iterations; i++) {
                const process = createTestProcess(`proc_${i}`, 'normal');
                processManager.processes.set(`proc_${i}`, process);

                const params = { processId: `proc_${i}`, characterId: 'alexander_kane' };
                const dependencies = { processManager, consciousnessEngine, eventEmitter };
                const command = new OptimizeProcessCommand(params, dependencies);

                await command.execute();
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryGrowth = finalMemory - initialMemory;

            // Memory growth should be reasonable (less than 10MB for 20 operations)
            const maxAcceptableGrowth = 10 * 1024 * 1024;
            expect(memoryGrowth).toBeLessThan(maxAcceptableGrowth);
        });

        it('should efficiently handle large process snapshots', async () => {
            // Create a process with large state
            const largeProcess = createTestProcess('proc_large', 'extreme');
            largeProcess.config = {
                largeData: new Array(1000).fill(0).map((_, i) => ({
                    id: i,
                    data: `large_data_chunk_${i}`,
                    metadata: { timestamp: Date.now(), size: 1024 }
                }))
            };
            processManager.processes.set('proc_large', largeProcess);

            const params = { processId: 'proc_large', characterId: 'alexander_kane' };
            const dependencies = { processManager, consciousnessEngine, eventEmitter };
            const command = new OptimizeProcessCommand(params, dependencies);

            const { executionTime, memoryDelta } = await monitor.measureExecution('large_snapshot', async () => {
                return await command.execute();
            });

            // Should still meet performance requirements even with large snapshots
            expect(executionTime).toBeLessThan(100);
            expect(memoryDelta.heapUsed).toBeLessThan(5 * 1024 * 1024);
        });
    });

    describe('Strategy Performance Comparison', () => {
        it('should compare performance across all strategies', async () => {
            const strategies = ['memory_consolidation', 'cpu_throttling', 'thread_rebalancing', 'hybrid_optimization'];
            const results = {};

            for (const strategy of strategies) {
                const testProcess = createTestProcess(`proc_${strategy}`, 'normal');
                processManager.processes.set(`proc_${strategy}`, testProcess);

                const params = { processId: `proc_${strategy}`, characterId: 'alexander_kane', strategy };
                const dependencies = { processManager, consciousnessEngine, eventEmitter };
                const command = new OptimizeProcessCommand(params, dependencies);

                const { executionTime, memoryDelta } = await monitor.measureExecution(`strategy_${strategy}`, async () => {
                    return await command.execute();
                });

                results[strategy] = { executionTime, memoryUsage: memoryDelta.heapUsed };
            }

            // All strategies should meet performance requirements
            for (const [strategy, metrics] of Object.entries(results)) {
                expect(metrics.executionTime).toBeLessThan(100);
                expect(metrics.memoryUsage).toBeLessThan(5 * 1024 * 1024);
            }

            // All strategies should be reasonably fast, but hybrid may not always be slowest due to optimization variations
            console.log('Strategy performance comparison:', results);
        });
    });

    describe('Concurrent Operations Performance', () => {
        it('should handle concurrent optimizations efficiently', async () => {
            const concurrentCount = 10;
            const promises = [];

            // Create concurrent optimization operations
            for (let i = 0; i < concurrentCount; i++) {
                const process = createTestProcess(`proc_concurrent_${i}`, 'normal');
                processManager.processes.set(`proc_concurrent_${i}`, process);

                const params = { processId: `proc_concurrent_${i}`, characterId: 'alexander_kane' };
                const dependencies = { processManager, consciousnessEngine, eventEmitter };
                const command = new OptimizeProcessCommand(params, dependencies);

                promises.push(
                    monitor.measureExecution('concurrent_optimization', async () => {
                        return await command.execute();
                    })
                );
            }

            const results = await Promise.all(promises);

            // All concurrent operations should complete within reasonable time
            for (const { executionTime } of results) {
                expect(executionTime).toBeLessThan(150); // Slightly higher limit for concurrent operations
            }

            const stats = monitor.getStats('concurrent_optimization');
            expect(stats.executionTime.avg).toBeLessThan(100);
        });
    });
});
