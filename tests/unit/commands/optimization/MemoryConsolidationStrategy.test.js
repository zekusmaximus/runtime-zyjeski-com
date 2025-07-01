// MemoryConsolidationStrategy.test.js - Unit tests for MemoryConsolidationStrategy
// Tests memory consolidation optimization logic and side effects

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryConsolidationStrategy } from '../../../../lib/commands/optimization/MemoryConsolidationStrategy.js';
import { OptimizationStrategy } from '../../../../lib/commands/optimization/OptimizationStrategy.js';

const createTestProcess = (overrides = {}) => ({
    id: 'proc_1001',
    name: 'grief_processor.exe',
    type: 'emotional_processing',
    status: 'running',
    priority: 'normal',
    memoryUsage: 200,
    cpuUsage: 35,
    threadCount: 3,
    lifetime: 8000,
    lastActivity: Date.now() - 5000,
    crashCount: 0,
    emotionSource: { type: 'grief', intensity: 0.8 },
    emotionalImpact: 0.8,
    debuggable: true,
    currentIssues: [],
    interventionPoints: [],
    effectivenessScore: 0.6,
    optimizationLevel: 0,
    config: {},
    ...overrides
});

describe('MemoryConsolidationStrategy', () => {
    let strategy;
    let testProcess;

    beforeEach(() => {
        strategy = new MemoryConsolidationStrategy();
        testProcess = createTestProcess();
    });

    describe('constructor', () => {
        it('should create strategy with default config', () => {
            expect(strategy).toBeInstanceOf(OptimizationStrategy);
            expect(strategy.strategyName).toBe('memory_consolidation');
            expect(strategy.safeMode).toBe(false);
        });

        it('should accept configuration', () => {
            const config = { safeMode: true, targetMetrics: { memoryReduction: 0.4 } };
            const configuredStrategy = new MemoryConsolidationStrategy(config);

            expect(configuredStrategy.safeMode).toBe(true);
            expect(configuredStrategy.targetMetrics.memoryReduction).toBe(0.4);
        });
    });

    describe('analyze', () => {
        it('should analyze process for memory consolidation potential', async () => {
            const analysis = await strategy.analyze(testProcess);

            expect(analysis).toHaveProperty('canOptimize');
            expect(analysis).toHaveProperty('memoryFragmentation');
            expect(analysis).toHaveProperty('consolidationPotential');
            expect(analysis).toHaveProperty('estimatedReduction');
            expect(analysis).toHaveProperty('riskLevel');
            expect(analysis).toHaveProperty('recommendations');
        });

        it('should identify high fragmentation process as optimizable', async () => {
            testProcess.memoryUsage = 300;
            testProcess.lifetime = 15000;

            const analysis = await strategy.analyze(testProcess);

            expect(analysis.canOptimize).toBe(true);
            expect(analysis.memoryFragmentation).toBeGreaterThan(20);
        });

        it('should not optimize system processes', async () => {
            testProcess.name = 'System_Core.exe';

            const analysis = await strategy.analyze(testProcess);

            expect(analysis.canOptimize).toBe(false);
        });

        it('should assess risk level based on emotional impact', async () => {
            testProcess.emotionalImpact = 0.9;

            const analysis = await strategy.analyze(testProcess);

            expect(analysis.riskLevel).toBe('high');
        });

        it('should provide recommendations', async () => {
            testProcess.memoryUsage = 400;

            const analysis = await strategy.analyze(testProcess);

            expect(analysis.recommendations).toBeInstanceOf(Array);
            expect(analysis.recommendations.length).toBeGreaterThan(0);
        });
    });

    describe('optimize', () => {
        it('should optimize process memory usage', async () => {
            const originalMemoryUsage = testProcess.memoryUsage;

            const result = await strategy.optimize(testProcess);

            expect(result.success).toBe(true);
            expect(testProcess.memoryUsage).toBeLessThan(originalMemoryUsage);
            expect(result.memoryReduced).toBeGreaterThan(0);
            expect(result.reductionPercentage).toBeGreaterThan(0);
        });

        it('should improve effectiveness score', async () => {
            const originalEffectiveness = testProcess.effectivenessScore;

            await strategy.optimize(testProcess);

            expect(testProcess.effectivenessScore).toBeGreaterThan(originalEffectiveness);
        });

        it('should generate side effects', async () => {
            await strategy.optimize(testProcess);

            const sideEffects = strategy.getSideEffects();
            expect(sideEffects).toBeInstanceOf(Array);
            expect(sideEffects.length).toBeGreaterThan(0);
            expect(sideEffects.some(effect => effect.type === 'cache_invalidation')).toBe(true);
        });

        it('should generate memory merge effects for emotional processes', async () => {
            testProcess.emotionalImpact = 0.8;
            // Ensure the process has enough fragmentation to be optimizable
            testProcess.memoryUsage = 300;
            testProcess.lifetime = 15000;

            await strategy.optimize(testProcess);

            const sideEffects = strategy.getSideEffects();
            const memoryMergeEffects = sideEffects.filter(effect => effect.type === 'memory_merge');

            expect(memoryMergeEffects.length).toBeGreaterThan(0);
            // Find the detailed memory merge effect (not the generic one from base class)
            const detailedMemoryMergeEffect = memoryMergeEffects.find(effect => effect.originalMemories);
            expect(detailedMemoryMergeEffect).toBeDefined();
            expect(detailedMemoryMergeEffect.originalMemories).toBeDefined();
            expect(detailedMemoryMergeEffect.mergedMemory).toBeDefined();
        });

        it('should not generate memory merge in safe mode', async () => {
            strategy.safeMode = true;
            testProcess.emotionalImpact = 0.6; // Below 0.7 threshold for safe mode
            // Ensure the process has enough fragmentation to be optimizable
            testProcess.memoryUsage = 300;
            testProcess.lifetime = 15000;

            await strategy.optimize(testProcess);

            const sideEffects = strategy.getSideEffects();
            const memoryMergeEffect = sideEffects.find(effect => effect.type === 'memory_merge');

            expect(memoryMergeEffect).toBeUndefined();
        });

        it('should respect target metrics', async () => {
            strategy.targetMetrics = { memoryReduction: 0.2 };
            const originalMemoryUsage = testProcess.memoryUsage;

            await strategy.optimize(testProcess);

            const actualReduction = (originalMemoryUsage - testProcess.memoryUsage) / originalMemoryUsage;
            expect(actualReduction).toBeLessThanOrEqual(0.2);
        });

        it('should throw error if process cannot be optimized', async () => {
            testProcess.name = 'System_Core.exe';

            await expect(strategy.optimize(testProcess))
                .rejects.toThrow('Process cannot be optimized with memory consolidation strategy');
        });

        it('should complete optimization without CPU spike', async () => {
            const originalCpuUsage = testProcess.cpuUsage;

            await strategy.optimize(testProcess);

            // CPU should remain stable (we removed the temporary spike for testing)
            expect(testProcess.cpuUsage).toBeLessThanOrEqual(originalCpuUsage);
        });
    });

    describe('revert', () => {
        it('should revert memory optimization', async () => {
            const originalMemoryUsage = testProcess.memoryUsage;
            const originalEffectiveness = testProcess.effectivenessScore;

            // Optimize first
            await strategy.optimize(testProcess);

            // Create undo data
            const undoData = {
                processSnapshot: {
                    memoryUsage: originalMemoryUsage,
                    effectivenessScore: originalEffectiveness
                },
                affectedMemories: ['memory_1', 'memory_2']
            };

            // Revert
            const result = await strategy.revert(testProcess, undoData);

            expect(result.success).toBe(true);
            expect(testProcess.memoryUsage).toBe(originalMemoryUsage);
            expect(testProcess.effectivenessScore).toBeCloseTo(originalEffectiveness, 0);
        });

        it('should handle memory restoration', async () => {
            const undoData = {
                processSnapshot: {
                    memoryUsage: 200,
                    effectivenessScore: 0.6
                },
                affectedMemories: ['memory_1', 'memory_2', 'memory_3']
            };

            const result = await strategy.revert(testProcess, undoData);

            expect(result.success).toBe(true);
            expect(result.memoriesRestored).toBe(3);
        });

        it('should throw error if undo data is missing', async () => {
            await expect(strategy.revert(testProcess, null))
                .rejects.toThrow('Cannot revert: missing undo data');
        });
    });

    describe('calculateMemoryFragmentation', () => {
        it('should calculate fragmentation based on process characteristics', () => {
            const fragmentation = strategy.calculateMemoryFragmentation(testProcess);

            expect(fragmentation).toBeGreaterThanOrEqual(0);
            expect(fragmentation).toBeLessThanOrEqual(100);
        });

        it('should increase fragmentation with memory usage', () => {
            const lowMemoryProcess = { ...testProcess, memoryUsage: 50 };
            const highMemoryProcess = { ...testProcess, memoryUsage: 300 };

            const lowFragmentation = strategy.calculateMemoryFragmentation(lowMemoryProcess);
            const highFragmentation = strategy.calculateMemoryFragmentation(highMemoryProcess);

            expect(highFragmentation).toBeGreaterThan(lowFragmentation);
        });

        it('should increase fragmentation with lifetime', () => {
            const newProcess = { ...testProcess, lifetime: 1000 };
            const oldProcess = { ...testProcess, lifetime: 20000 };

            const newFragmentation = strategy.calculateMemoryFragmentation(newProcess);
            const oldFragmentation = strategy.calculateMemoryFragmentation(oldProcess);

            expect(oldFragmentation).toBeGreaterThan(newFragmentation);
        });

        it('should reduce fragmentation with optimization level', () => {
            const unoptimizedProcess = { ...testProcess, optimizationLevel: 0 };
            const optimizedProcess = { ...testProcess, optimizationLevel: 2 };

            const unoptimizedFragmentation = strategy.calculateMemoryFragmentation(unoptimizedProcess);
            const optimizedFragmentation = strategy.calculateMemoryFragmentation(optimizedProcess);

            expect(optimizedFragmentation).toBeLessThan(unoptimizedFragmentation);
        });
    });

    describe('generateAffectedMemories', () => {
        it('should generate grief-related memories for grief processes', () => {
            testProcess.emotionSource = { type: 'grief', intensity: 0.8 };

            const memories = strategy.generateAffectedMemories(testProcess);

            expect(memories).toBeInstanceOf(Array);
            expect(memories.some(memory => memory.includes('sarah'))).toBe(true);
        });

        it('should generate anxiety-related memories for anxiety processes', () => {
            testProcess.emotionSource = { type: 'anxiety', intensity: 0.6 };

            const memories = strategy.generateAffectedMemories(testProcess);

            expect(memories).toBeInstanceOf(Array);
            expect(memories.some(memory => memory.includes('timeline') || memory.includes('reality'))).toBe(true);
        });
    });

    describe('generateMergedMemory', () => {
        it('should generate appropriate merged memory for grief', () => {
            testProcess.emotionSource = { type: 'grief', intensity: 0.8 };

            const mergedMemory = strategy.generateMergedMemory(testProcess);

            expect(mergedMemory).toHaveProperty('id');
            expect(mergedMemory).toHaveProperty('type');
            expect(mergedMemory).toHaveProperty('intensity');
            expect(mergedMemory).toHaveProperty('description');
            expect(mergedMemory.intensity).toBeLessThan(testProcess.emotionalImpact);
        });

        it('should generate generic merged memory for other emotions', () => {
            testProcess.emotionSource = { type: 'anger', intensity: 0.6 };

            const mergedMemory = strategy.generateMergedMemory(testProcess);

            expect(mergedMemory.type).toBe('consolidated');
            expect(mergedMemory.intensity).toBeLessThan(testProcess.emotionalImpact);
        });
    });
});
