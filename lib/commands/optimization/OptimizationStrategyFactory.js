// OptimizationStrategyFactory.js - Factory for creating and selecting optimization strategies
// Implements factory pattern for strategy creation and intelligent strategy recommendation

import { MemoryConsolidationStrategy } from './MemoryConsolidationStrategy.js';
import { CpuThrottlingStrategy } from './CpuThrottlingStrategy.js';
import { ThreadRebalancingStrategy } from './ThreadRebalancingStrategy.js';
import { HybridOptimizationStrategy } from './HybridOptimizationStrategy.js';

/**
 * Factory class for creating optimization strategies.
 * Provides strategy creation, selection, and recommendation capabilities.
 */
export class OptimizationStrategyFactory {
    constructor() {
        this.strategies = new Map([
            ['memory_consolidation', MemoryConsolidationStrategy],
            ['cpu_throttling', CpuThrottlingStrategy],
            ['thread_rebalancing', ThreadRebalancingStrategy],
            ['hybrid_optimization', HybridOptimizationStrategy]
        ]);
        
        this.strategyAliases = new Map([
            ['memory', 'memory_consolidation'],
            ['cpu', 'cpu_throttling'],
            ['thread', 'thread_rebalancing'],
            ['threads', 'thread_rebalancing'],
            ['hybrid', 'hybrid_optimization'],
            ['combined', 'hybrid_optimization'],
            ['comprehensive', 'hybrid_optimization']
        ]);
    }

    /**
     * Create a strategy instance by name
     * @param {string} strategyName - Name of the strategy to create
     * @param {Object} config - Configuration for the strategy
     * @returns {OptimizationStrategy} Strategy instance
     */
    createStrategy(strategyName, config = {}) {
        // Resolve aliases
        const resolvedName = this.strategyAliases.get(strategyName) || strategyName;
        
        const StrategyClass = this.strategies.get(resolvedName);
        if (!StrategyClass) {
            throw new Error(`Unknown optimization strategy: ${strategyName}`);
        }

        return new StrategyClass(config);
    }

    /**
     * Get list of available strategies
     * @returns {Array} Array of strategy names
     */
    getAvailableStrategies() {
        return Array.from(this.strategies.keys());
    }

    /**
     * Get strategy aliases
     * @returns {Object} Map of aliases to strategy names
     */
    getStrategyAliases() {
        return Object.fromEntries(this.strategyAliases);
    }

    /**
     * Recommend the best strategy for a process based on analysis
     * @param {Object} analysis - Process analysis results
     * @param {Object} config - Configuration options
     * @returns {OptimizationStrategy} Recommended strategy instance
     */
    recommendStrategy(analysis, config = {}) {
        const recommendation = this.analyzeOptimizationNeeds(analysis, config);
        return this.createStrategy(recommendation.strategyName, config);
    }

    /**
     * Analyze optimization needs and recommend strategy
     * @param {Object} analysis - Process analysis results
     * @param {Object} config - Configuration options
     * @returns {Object} Recommendation with strategy name and reasoning
     */
    analyzeOptimizationNeeds(analysis, config = {}) {
        const { reasons, currentMetrics, riskLevel } = analysis;
        const { safeMode, targetMetrics } = config;
        
        // Score each strategy based on the analysis
        const strategyScores = this.calculateStrategyScores(reasons, currentMetrics, riskLevel, safeMode);
        
        // Find the best strategy
        const bestStrategy = this.selectBestStrategy(strategyScores, targetMetrics);
        
        return {
            strategyName: bestStrategy.name,
            confidence: bestStrategy.score,
            reasoning: this.generateRecommendationReasoning(bestStrategy, reasons, riskLevel),
            alternativeStrategies: this.getAlternativeStrategies(strategyScores, bestStrategy.name),
            riskAssessment: this.assessStrategyRisk(bestStrategy.name, currentMetrics, riskLevel)
        };
    }

    /**
     * Calculate scores for each strategy based on process analysis
     * @param {Array} reasons - Optimization reasons
     * @param {Object} metrics - Current process metrics
     * @param {string} riskLevel - Risk level assessment
     * @param {boolean} safeMode - Whether safe mode is enabled
     * @returns {Object} Strategy scores
     */
    calculateStrategyScores(reasons, metrics, riskLevel, safeMode) {
        const scores = {
            memory_consolidation: 0,
            cpu_throttling: 0,
            thread_rebalancing: 0,
            hybrid_optimization: 0
        };

        // Score based on specific optimization reasons
        for (const reason of reasons) {
            switch (reason) {
                case 'memory_fragmented':
                    scores.memory_consolidation += 40;
                    scores.hybrid_optimization += 20;
                    break;
                case 'cpu_usage_excessive':
                    scores.cpu_throttling += 40;
                    scores.hybrid_optimization += 25;
                    break;
                case 'thread_contention':
                    scores.thread_rebalancing += 40;
                    scores.hybrid_optimization += 20;
                    break;
                case 'response_time_degraded':
                    scores.cpu_throttling += 20;
                    scores.thread_rebalancing += 20;
                    scores.hybrid_optimization += 30;
                    break;
            }
        }

        // Adjust scores based on metrics
        this.adjustScoresForMetrics(scores, metrics);
        
        // Adjust scores based on risk level and safe mode
        this.adjustScoresForRisk(scores, riskLevel, safeMode);
        
        // Multiple issues favor hybrid approach
        if (reasons.length >= 3) {
            scores.hybrid_optimization += 30;
        } else if (reasons.length >= 2) {
            scores.hybrid_optimization += 15;
        }

        return scores;
    }

    /**
     * Adjust strategy scores based on process metrics
     * @param {Object} scores - Current strategy scores
     * @param {Object} metrics - Process metrics
     */
    adjustScoresForMetrics(scores, metrics) {
        // High CPU usage favors CPU throttling
        if (metrics.cpuUsage > 60) {
            scores.cpu_throttling += 20;
        } else if (metrics.cpuUsage > 40) {
            scores.cpu_throttling += 10;
        }

        // High memory usage favors memory consolidation
        if (metrics.memoryUsage > 300) {
            scores.memory_consolidation += 20;
        } else if (metrics.memoryUsage > 150) {
            scores.memory_consolidation += 10;
        }

        // Many threads favor thread rebalancing
        if (metrics.threadCount > 6) {
            scores.thread_rebalancing += 20;
        } else if (metrics.threadCount > 4) {
            scores.thread_rebalancing += 10;
        }

        // Low effectiveness with high resource usage favors hybrid
        if (metrics.effectivenessScore < 0.5 && 
            (metrics.cpuUsage > 40 || metrics.memoryUsage > 200)) {
            scores.hybrid_optimization += 25;
        }

        // High emotional impact reduces aggressive strategies
        if (metrics.emotionalImpact > 0.7) {
            scores.cpu_throttling -= 10;
            scores.hybrid_optimization -= 15;
        }
    }

    /**
     * Adjust strategy scores based on risk level and safe mode
     * @param {Object} scores - Current strategy scores
     * @param {string} riskLevel - Risk level assessment
     * @param {boolean} safeMode - Whether safe mode is enabled
     */
    adjustScoresForRisk(scores, riskLevel, safeMode) {
        if (safeMode) {
            // Safe mode favors conservative approaches
            scores.memory_consolidation += 10;
            scores.cpu_throttling += 5;
            scores.thread_rebalancing += 5;
            scores.hybrid_optimization -= 20; // Hybrid is more aggressive
        }

        switch (riskLevel) {
            case 'high':
                scores.memory_consolidation += 5; // Safest option
                scores.cpu_throttling -= 5;
                scores.thread_rebalancing -= 10;
                scores.hybrid_optimization -= 25;
                break;
            case 'moderate':
                scores.cpu_throttling += 5;
                scores.thread_rebalancing += 5;
                scores.hybrid_optimization -= 10;
                break;
            case 'low':
                scores.hybrid_optimization += 15; // Can be more aggressive
                break;
        }
    }

    /**
     * Select the best strategy from calculated scores
     * @param {Object} scores - Strategy scores
     * @param {Object} targetMetrics - Target optimization metrics
     * @returns {Object} Best strategy with name and score
     */
    selectBestStrategy(scores, targetMetrics = {}) {
        // Apply target metric preferences
        if (targetMetrics.cpuReduction > 0.3) {
            scores.cpu_throttling += 15;
        }
        if (targetMetrics.memoryReduction > 0.2) {
            scores.memory_consolidation += 15;
        }

        // Find strategy with highest score
        let bestStrategy = { name: 'memory_consolidation', score: scores.memory_consolidation };
        
        for (const [strategyName, score] of Object.entries(scores)) {
            if (score > bestStrategy.score) {
                bestStrategy = { name: strategyName, score };
            }
        }

        // Ensure minimum score threshold
        if (bestStrategy.score < 10) {
            bestStrategy = { name: 'memory_consolidation', score: 10 }; // Default fallback
        }

        return bestStrategy;
    }

    /**
     * Generate reasoning for strategy recommendation
     * @param {Object} bestStrategy - Selected strategy
     * @param {Array} reasons - Optimization reasons
     * @param {string} riskLevel - Risk level
     * @returns {Array} Array of reasoning statements
     */
    generateRecommendationReasoning(bestStrategy, reasons, riskLevel) {
        const reasoning = [];
        
        switch (bestStrategy.name) {
            case 'memory_consolidation':
                reasoning.push('Memory consolidation selected for fragmentation reduction');
                if (reasons.includes('memory_fragmented')) {
                    reasoning.push('High memory fragmentation detected');
                }
                break;
                
            case 'cpu_throttling':
                reasoning.push('CPU throttling selected for resource management');
                if (reasons.includes('cpu_usage_excessive')) {
                    reasoning.push('Excessive CPU usage requires throttling');
                }
                break;
                
            case 'thread_rebalancing':
                reasoning.push('Thread rebalancing selected for parallelism optimization');
                if (reasons.includes('thread_contention')) {
                    reasoning.push('Thread contention detected');
                }
                break;
                
            case 'hybrid_optimization':
                reasoning.push('Hybrid optimization selected for comprehensive improvement');
                reasoning.push(`Multiple issues detected: ${reasons.join(', ')}`);
                break;
        }

        // Add risk-based reasoning
        if (riskLevel === 'high') {
            reasoning.push('Conservative approach due to high risk level');
        } else if (riskLevel === 'low') {
            reasoning.push('Aggressive optimization possible due to low risk');
        }

        return reasoning;
    }

    /**
     * Get alternative strategies ranked by score
     * @param {Object} scores - All strategy scores
     * @param {string} selectedStrategy - Currently selected strategy
     * @returns {Array} Alternative strategies with scores
     */
    getAlternativeStrategies(scores, selectedStrategy) {
        const alternatives = [];
        
        for (const [strategyName, score] of Object.entries(scores)) {
            if (strategyName !== selectedStrategy && score > 5) {
                alternatives.push({ name: strategyName, score });
            }
        }
        
        return alternatives.sort((a, b) => b.score - a.score);
    }

    /**
     * Assess risk for selected strategy
     * @param {string} strategyName - Selected strategy name
     * @param {Object} metrics - Process metrics
     * @param {string} riskLevel - Overall risk level
     * @returns {Object} Risk assessment
     */
    assessStrategyRisk(strategyName, metrics, riskLevel) {
        const risks = [];
        let overallRisk = riskLevel;

        switch (strategyName) {
            case 'memory_consolidation':
                if (metrics.emotionalImpact > 0.6) {
                    risks.push('Potential memory merging may affect emotional processing');
                }
                break;
                
            case 'cpu_throttling':
                if (metrics.cpuUsage > 70) {
                    risks.push('Aggressive throttling may cause significant slowdown');
                }
                break;
                
            case 'thread_rebalancing':
                if (metrics.threadCount > 6) {
                    risks.push('Major thread changes may cause temporary instability');
                }
                break;
                
            case 'hybrid_optimization':
                risks.push('Complex optimization may have unpredictable interactions');
                if (overallRisk !== 'high') {
                    overallRisk = 'moderate'; // Hybrid always increases risk
                }
                break;
        }

        return {
            level: overallRisk,
            risks,
            mitigation: this.generateRiskMitigation(strategyName, risks)
        };
    }

    /**
     * Generate risk mitigation strategies
     * @param {string} strategyName - Strategy name
     * @param {Array} risks - Identified risks
     * @returns {Array} Mitigation strategies
     */
    generateRiskMitigation(strategyName, risks) {
        const mitigation = [];

        if (risks.length > 0) {
            mitigation.push('Monitor process stability after optimization');
            mitigation.push('Prepare for immediate rollback if issues occur');
        }

        switch (strategyName) {
            case 'memory_consolidation':
                mitigation.push('Backup emotional memory states before consolidation');
                break;
            case 'cpu_throttling':
                mitigation.push('Apply throttling gradually to avoid sudden performance drops');
                break;
            case 'thread_rebalancing':
                mitigation.push('Test thread configuration in safe environment first');
                break;
            case 'hybrid_optimization':
                mitigation.push('Apply optimizations sequentially rather than simultaneously');
                mitigation.push('Validate each optimization step before proceeding');
                break;
        }

        return mitigation;
    }

    /**
     * Validate strategy configuration
     * @param {string} strategyName - Strategy name to validate
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result
     */
    validateStrategyConfig(strategyName, config) {
        const errors = [];
        const warnings = [];

        // Validate target metrics
        if (config.targetMetrics) {
            const { cpuReduction, memoryReduction, maxRiskLevel } = config.targetMetrics;
            
            if (cpuReduction && (cpuReduction < 0 || cpuReduction > 1)) {
                errors.push('cpuReduction must be between 0 and 1');
            }
            
            if (memoryReduction && (memoryReduction < 0 || memoryReduction > 1)) {
                errors.push('memoryReduction must be between 0 and 1');
            }
            
            if (maxRiskLevel && !['low', 'moderate', 'high'].includes(maxRiskLevel)) {
                errors.push('maxRiskLevel must be low, moderate, or high');
            }
        }

        // Strategy-specific validation
        if (strategyName === 'hybrid_optimization' && config.safeMode) {
            warnings.push('Hybrid optimization in safe mode may have limited effectiveness');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
}
