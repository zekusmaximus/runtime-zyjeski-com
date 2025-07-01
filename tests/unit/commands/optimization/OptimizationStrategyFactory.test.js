// OptimizationStrategyFactory.test.js - Unit tests for OptimizationStrategyFactory
// Tests strategy creation, selection, and recommendation logic

import { describe, it, expect, beforeEach } from 'vitest';
import { OptimizationStrategyFactory } from '../../../../lib/commands/optimization/OptimizationStrategyFactory.js';
import { MemoryConsolidationStrategy } from '../../../../lib/commands/optimization/MemoryConsolidationStrategy.js';
import { CpuThrottlingStrategy } from '../../../../lib/commands/optimization/CpuThrottlingStrategy.js';
import { ThreadRebalancingStrategy } from '../../../../lib/commands/optimization/ThreadRebalancingStrategy.js';
import { HybridOptimizationStrategy } from '../../../../lib/commands/optimization/HybridOptimizationStrategy.js';

describe('OptimizationStrategyFactory', () => {
    let factory;

    beforeEach(() => {
        factory = new OptimizationStrategyFactory();
    });

    describe('constructor', () => {
        it('should initialize with all strategies', () => {
            expect(factory.strategies.size).toBe(4);
            expect(factory.strategies.has('memory_consolidation')).toBe(true);
            expect(factory.strategies.has('cpu_throttling')).toBe(true);
            expect(factory.strategies.has('thread_rebalancing')).toBe(true);
            expect(factory.strategies.has('hybrid_optimization')).toBe(true);
        });

        it('should initialize with strategy aliases', () => {
            expect(factory.strategyAliases.has('memory')).toBe(true);
            expect(factory.strategyAliases.has('cpu')).toBe(true);
            expect(factory.strategyAliases.has('thread')).toBe(true);
            expect(factory.strategyAliases.has('hybrid')).toBe(true);
        });
    });

    describe('createStrategy', () => {
        it('should create memory consolidation strategy', () => {
            const strategy = factory.createStrategy('memory_consolidation');
            expect(strategy).toBeInstanceOf(MemoryConsolidationStrategy);
        });

        it('should create CPU throttling strategy', () => {
            const strategy = factory.createStrategy('cpu_throttling');
            expect(strategy).toBeInstanceOf(CpuThrottlingStrategy);
        });

        it('should create thread rebalancing strategy', () => {
            const strategy = factory.createStrategy('thread_rebalancing');
            expect(strategy).toBeInstanceOf(ThreadRebalancingStrategy);
        });

        it('should create hybrid optimization strategy', () => {
            const strategy = factory.createStrategy('hybrid_optimization');
            expect(strategy).toBeInstanceOf(HybridOptimizationStrategy);
        });

        it('should resolve strategy aliases', () => {
            const memoryStrategy = factory.createStrategy('memory');
            const cpuStrategy = factory.createStrategy('cpu');
            const threadStrategy = factory.createStrategy('thread');
            const hybridStrategy = factory.createStrategy('hybrid');

            expect(memoryStrategy).toBeInstanceOf(MemoryConsolidationStrategy);
            expect(cpuStrategy).toBeInstanceOf(CpuThrottlingStrategy);
            expect(threadStrategy).toBeInstanceOf(ThreadRebalancingStrategy);
            expect(hybridStrategy).toBeInstanceOf(HybridOptimizationStrategy);
        });

        it('should pass configuration to strategy', () => {
            const config = { safeMode: true, targetMetrics: { cpuReduction: 0.3 } };
            const strategy = factory.createStrategy('cpu_throttling', config);

            expect(strategy.safeMode).toBe(true);
            expect(strategy.targetMetrics.cpuReduction).toBe(0.3);
        });

        it('should throw error for unknown strategy', () => {
            expect(() => factory.createStrategy('unknown_strategy'))
                .toThrow('Unknown optimization strategy: unknown_strategy');
        });
    });

    describe('getAvailableStrategies', () => {
        it('should return all available strategy names', () => {
            const strategies = factory.getAvailableStrategies();

            expect(strategies).toEqual([
                'memory_consolidation',
                'cpu_throttling',
                'thread_rebalancing',
                'hybrid_optimization'
            ]);
        });
    });

    describe('getStrategyAliases', () => {
        it('should return strategy aliases', () => {
            const aliases = factory.getStrategyAliases();

            expect(aliases.memory).toBe('memory_consolidation');
            expect(aliases.cpu).toBe('cpu_throttling');
            expect(aliases.thread).toBe('thread_rebalancing');
            expect(aliases.hybrid).toBe('hybrid_optimization');
        });
    });

    describe('recommendStrategy', () => {
        it('should recommend memory consolidation for memory fragmentation', () => {
            const analysis = {
                reasons: ['memory_fragmented'],
                currentMetrics: {
                    cpuUsage: 20,
                    memoryUsage: 200,
                    threadCount: 2,
                    effectivenessScore: 0.7,
                    emotionalImpact: 0.3
                },
                riskLevel: 'low'
            };

            const strategy = factory.recommendStrategy(analysis);
            expect(strategy).toBeInstanceOf(MemoryConsolidationStrategy);
        });

        it('should recommend CPU throttling for excessive CPU usage', () => {
            const analysis = {
                reasons: ['cpu_usage_excessive'],
                currentMetrics: {
                    cpuUsage: 70,
                    memoryUsage: 100,
                    threadCount: 2,
                    effectivenessScore: 0.6,
                    emotionalImpact: 0.3
                },
                riskLevel: 'moderate'
            };

            const strategy = factory.recommendStrategy(analysis);
            expect(strategy).toBeInstanceOf(CpuThrottlingStrategy);
        });

        it('should recommend thread rebalancing for thread contention', () => {
            const analysis = {
                reasons: ['thread_contention'],
                currentMetrics: {
                    cpuUsage: 30,
                    memoryUsage: 100,
                    threadCount: 8,
                    effectivenessScore: 0.4,
                    emotionalImpact: 0.2
                },
                riskLevel: 'low'
            };

            const strategy = factory.recommendStrategy(analysis);
            expect(strategy).toBeInstanceOf(ThreadRebalancingStrategy);
        });

        it('should recommend hybrid optimization for multiple issues', () => {
            const analysis = {
                reasons: ['memory_fragmented', 'cpu_usage_excessive', 'thread_contention'],
                currentMetrics: {
                    cpuUsage: 60,
                    memoryUsage: 300,
                    threadCount: 6,
                    effectivenessScore: 0.4,
                    emotionalImpact: 0.5
                },
                riskLevel: 'moderate'
            };

            const strategy = factory.recommendStrategy(analysis);
            expect(strategy).toBeInstanceOf(HybridOptimizationStrategy);
        });
    });

    describe('analyzeOptimizationNeeds', () => {
        it('should provide comprehensive recommendation analysis', () => {
            const analysis = {
                reasons: ['memory_fragmented', 'cpu_usage_excessive'],
                currentMetrics: {
                    cpuUsage: 50,
                    memoryUsage: 250,
                    threadCount: 3,
                    effectivenessScore: 0.5,
                    emotionalImpact: 0.6
                },
                riskLevel: 'moderate'
            };

            const recommendation = factory.analyzeOptimizationNeeds(analysis);

            expect(recommendation).toHaveProperty('strategyName');
            expect(recommendation).toHaveProperty('confidence');
            expect(recommendation).toHaveProperty('reasoning');
            expect(recommendation).toHaveProperty('alternativeStrategies');
            expect(recommendation).toHaveProperty('riskAssessment');
            expect(recommendation.reasoning).toBeInstanceOf(Array);
            expect(recommendation.reasoning.length).toBeGreaterThan(0);
        });

        it('should adjust recommendations for safe mode', () => {
            const analysis = {
                reasons: ['memory_fragmented', 'cpu_usage_excessive', 'thread_contention'],
                currentMetrics: {
                    cpuUsage: 60,
                    memoryUsage: 300,
                    threadCount: 6,
                    effectivenessScore: 0.4,
                    emotionalImpact: 0.8
                },
                riskLevel: 'high'
            };
            const config = { safeMode: true };

            const recommendation = factory.analyzeOptimizationNeeds(analysis, config);

            // Safe mode should favor conservative strategies
            expect(['memory_consolidation', 'cpu_throttling'].includes(recommendation.strategyName)).toBe(true);
        });

        it('should consider target metrics in recommendations', () => {
            const analysis = {
                reasons: ['cpu_usage_excessive'], // Only CPU issue to avoid hybrid
                currentMetrics: {
                    cpuUsage: 60, // Higher CPU usage
                    memoryUsage: 100, // Lower memory usage
                    threadCount: 3,
                    effectivenessScore: 0.6,
                    emotionalImpact: 0.4
                },
                riskLevel: 'low'
            };
            const config = { targetMetrics: { cpuReduction: 0.4 } };

            const recommendation = factory.analyzeOptimizationNeeds(analysis, config);

            // High CPU reduction target should favor CPU throttling
            expect(recommendation.strategyName).toBe('cpu_throttling');
        });
    });

    describe('calculateStrategyScores', () => {
        it('should score strategies based on optimization reasons', () => {
            const reasons = ['memory_fragmented', 'cpu_usage_excessive'];
            const metrics = {
                cpuUsage: 50,
                memoryUsage: 200,
                threadCount: 3,
                effectivenessScore: 0.6,
                emotionalImpact: 0.4
            };

            const scores = factory.calculateStrategyScores(reasons, metrics, 'moderate', false);

            expect(scores.memory_consolidation).toBeGreaterThan(0);
            expect(scores.cpu_throttling).toBeGreaterThan(0);
            expect(scores.hybrid_optimization).toBeGreaterThan(0);
        });

        it('should adjust scores for high emotional impact', () => {
            const reasons = ['cpu_usage_excessive'];
            const highEmotionalMetrics = {
                cpuUsage: 60,
                memoryUsage: 150,
                threadCount: 2,
                effectivenessScore: 0.5,
                emotionalImpact: 0.9
            };
            const lowEmotionalMetrics = { ...highEmotionalMetrics, emotionalImpact: 0.2 };

            const highEmotionalScores = factory.calculateStrategyScores(reasons, highEmotionalMetrics, 'moderate', false);
            const lowEmotionalScores = factory.calculateStrategyScores(reasons, lowEmotionalMetrics, 'moderate', false);

            // High emotional impact should reduce aggressive strategy scores
            expect(highEmotionalScores.cpu_throttling).toBeLessThan(lowEmotionalScores.cpu_throttling);
            expect(highEmotionalScores.hybrid_optimization).toBeLessThan(lowEmotionalScores.hybrid_optimization);
        });

        it('should favor conservative strategies in safe mode', () => {
            const reasons = ['memory_fragmented', 'cpu_usage_excessive'];
            const metrics = {
                cpuUsage: 50,
                memoryUsage: 200,
                threadCount: 3,
                effectivenessScore: 0.6,
                emotionalImpact: 0.5
            };

            const normalScores = factory.calculateStrategyScores(reasons, metrics, 'moderate', false);
            const safeModeScores = factory.calculateStrategyScores(reasons, metrics, 'moderate', true);

            expect(safeModeScores.memory_consolidation).toBeGreaterThan(normalScores.memory_consolidation);
            expect(safeModeScores.hybrid_optimization).toBeLessThan(normalScores.hybrid_optimization);
        });
    });

    describe('validateStrategyConfig', () => {
        it('should validate valid configuration', () => {
            const config = {
                safeMode: true,
                targetMetrics: {
                    cpuReduction: 0.3,
                    memoryReduction: 0.2,
                    maxRiskLevel: 'moderate'
                }
            };

            const validation = factory.validateStrategyConfig('memory_consolidation', config);

            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });

        it('should detect invalid CPU reduction values', () => {
            const config = {
                targetMetrics: { cpuReduction: 1.5 }
            };

            const validation = factory.validateStrategyConfig('cpu_throttling', config);

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('cpuReduction must be between 0 and 1');
        });

        it('should detect invalid memory reduction values', () => {
            const config = {
                targetMetrics: { memoryReduction: -0.1 }
            };

            const validation = factory.validateStrategyConfig('memory_consolidation', config);

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('memoryReduction must be between 0 and 1');
        });

        it('should detect invalid risk level values', () => {
            const config = {
                targetMetrics: { maxRiskLevel: 'extreme' }
            };

            const validation = factory.validateStrategyConfig('hybrid_optimization', config);

            expect(validation.valid).toBe(false);
            expect(validation.errors).toContain('maxRiskLevel must be low, moderate, or high');
        });

        it('should warn about hybrid optimization in safe mode', () => {
            const config = { safeMode: true };

            const validation = factory.validateStrategyConfig('hybrid_optimization', config);

            expect(validation.valid).toBe(true);
            expect(validation.warnings).toContain('Hybrid optimization in safe mode may have limited effectiveness');
        });
    });
});
