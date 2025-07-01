// HybridOptimizationStrategy.js - Strategy combining multiple optimization approaches
// Combines memory consolidation, CPU throttling, and thread rebalancing for comprehensive optimization

import { OptimizationStrategy } from './OptimizationStrategy.js';
import { MemoryConsolidationStrategy } from './MemoryConsolidationStrategy.js';
import { CpuThrottlingStrategy } from './CpuThrottlingStrategy.js';
import { ThreadRebalancingStrategy } from './ThreadRebalancingStrategy.js';

/**
 * Hybrid Optimization Strategy
 * Combines multiple optimization approaches for comprehensive process improvement.
 * Applies memory consolidation, CPU throttling, and thread rebalancing in coordinated fashion.
 * Side effects: combination of all strategy effects, potential_instability
 */
export class HybridOptimizationStrategy extends OptimizationStrategy {
    constructor(config = {}) {
        super(config);
        this.strategyName = 'hybrid_optimization';
        
        // Initialize component strategies
        this.memoryStrategy = new MemoryConsolidationStrategy(config);
        this.cpuStrategy = new CpuThrottlingStrategy(config);
        this.threadStrategy = new ThreadRebalancingStrategy(config);
        
        // Hybrid-specific configuration
        this.maxCombinedRisk = config.maxCombinedRisk || 0.7;
        this.coordinatedOptimization = config.coordinatedOptimization !== false;
    }

    /**
     * Analyze process for hybrid optimization potential
     * @param {Object} process - Process to analyze
     * @returns {Promise<Object>} Analysis result
     */
    async analyze(process) {
        // Get analysis from each component strategy
        const memoryAnalysis = await this.memoryStrategy.analyze(process);
        const cpuAnalysis = await this.cpuStrategy.analyze(process);
        const threadAnalysis = await this.threadStrategy.analyze(process);
        
        // Determine which optimizations are beneficial
        const applicableStrategies = [];
        if (memoryAnalysis.canOptimize && memoryAnalysis.memoryFragmentation > 25) {
            applicableStrategies.push('memory');
        }
        if (cpuAnalysis.canOptimize && cpuAnalysis.currentCpuUsage > 30) {
            applicableStrategies.push('cpu');
        }
        if (threadAnalysis.canOptimize && threadAnalysis.threadEfficiency < 0.7) {
            applicableStrategies.push('thread');
        }
        
        const canOptimize = this.isSafeToOptimize(process) && applicableStrategies.length >= 2;
        const combinedRisk = this.calculateCombinedRisk(process, applicableStrategies);
        
        return {
            canOptimize,
            applicableStrategies,
            combinedRisk,
            memoryAnalysis,
            cpuAnalysis,
            threadAnalysis,
            estimatedImprovement: this.calculateEstimatedImprovement(memoryAnalysis, cpuAnalysis, threadAnalysis),
            riskLevel: combinedRisk > 0.6 ? 'high' : combinedRisk > 0.3 ? 'moderate' : 'low',
            recommendations: this.generateRecommendations(process, applicableStrategies, combinedRisk)
        };
    }

    /**
     * Optimize process using hybrid approach
     * @param {Object} process - Process to optimize
     * @returns {Promise<Object>} Optimization result
     */
    async optimize(process) {
        const analysis = await this.analyze(process);
        
        if (!analysis.canOptimize) {
            throw new Error('Process cannot be optimized with hybrid strategy');
        }

        // Check combined risk
        if (analysis.combinedRisk > this.maxCombinedRisk && !this.safeMode) {
            throw new Error(`Combined optimization risk too high: ${analysis.combinedRisk}`);
        }

        // Store original state
        const originalState = {
            cpuUsage: process.cpuUsage,
            memoryUsage: process.memoryUsage,
            threadCount: process.threadCount,
            effectivenessScore: process.effectivenessScore
        };

        let results = {};
        this.sideEffects = [];

        // Apply optimizations in coordinated order
        if (this.coordinatedOptimization) {
            results = await this.applyCoordinatedOptimization(process, analysis);
        } else {
            results = await this.applySequentialOptimization(process, analysis);
        }

        // Calculate combined improvements
        const finalState = {
            cpuUsage: process.cpuUsage,
            memoryUsage: process.memoryUsage,
            threadCount: process.threadCount,
            effectivenessScore: process.effectivenessScore
        };

        const combinedImprovement = this.calculateCombinedImprovement(originalState, finalState);

        // Add hybrid-specific side effects
        this.addHybridSideEffects(analysis.applicableStrategies, combinedImprovement);

        return {
            success: true,
            strategiesApplied: analysis.applicableStrategies,
            individualResults: results,
            combinedImprovement,
            originalState,
            finalState,
            sideEffects: this.sideEffects
        };
    }

    /**
     * Apply coordinated optimization (strategies work together)
     * @param {Object} process - Process to optimize
     * @param {Object} analysis - Analysis results
     * @returns {Promise<Object>} Optimization results
     */
    async applyCoordinatedOptimization(process, analysis) {
        const results = {};

        // Phase 1: Memory consolidation (creates foundation for other optimizations)
        if (analysis.applicableStrategies.includes('memory')) {
            results.memory = await this.memoryStrategy.optimize(process);
            this.sideEffects.push(...this.memoryStrategy.getSideEffects());
        }

        // Phase 2: Thread rebalancing (optimizes parallelism)
        if (analysis.applicableStrategies.includes('thread')) {
            // Adjust thread strategy based on memory optimization results
            if (results.memory) {
                this.threadStrategy.targetMetrics.memoryAware = true;
            }
            results.thread = await this.threadStrategy.optimize(process);
            this.sideEffects.push(...this.threadStrategy.getSideEffects());
        }

        // Phase 3: CPU throttling (final efficiency tuning)
        if (analysis.applicableStrategies.includes('cpu')) {
            // Adjust CPU strategy based on previous optimizations
            const adjustedCpuTarget = this.calculateAdjustedCpuTarget(results);
            this.cpuStrategy.targetMetrics.cpuReduction = adjustedCpuTarget;
            results.cpu = await this.cpuStrategy.optimize(process);
            this.sideEffects.push(...this.cpuStrategy.getSideEffects());
        }

        return results;
    }

    /**
     * Apply sequential optimization (strategies applied independently)
     * @param {Object} process - Process to optimize
     * @param {Object} analysis - Analysis results
     * @returns {Promise<Object>} Optimization results
     */
    async applySequentialOptimization(process, analysis) {
        const results = {};

        // Apply each strategy independently
        for (const strategy of analysis.applicableStrategies) {
            try {
                switch (strategy) {
                    case 'memory':
                        results.memory = await this.memoryStrategy.optimize(process);
                        this.sideEffects.push(...this.memoryStrategy.getSideEffects());
                        break;
                    case 'cpu':
                        results.cpu = await this.cpuStrategy.optimize(process);
                        this.sideEffects.push(...this.cpuStrategy.getSideEffects());
                        break;
                    case 'thread':
                        results.thread = await this.threadStrategy.optimize(process);
                        this.sideEffects.push(...this.threadStrategy.getSideEffects());
                        break;
                }
            } catch (error) {
                // Continue with other strategies if one fails
                console.warn(`Strategy ${strategy} failed:`, error.message);
            }
        }

        return results;
    }

    /**
     * Revert hybrid optimization
     * @param {Object} process - Process to revert
     * @param {Object} undoData - Undo data containing original state
     * @returns {Promise<Object>} Revert result
     */
    async revert(process, undoData) {
        if (!undoData || !undoData.processSnapshot) {
            throw new Error('Cannot revert: missing undo data');
        }

        const originalProcess = undoData.processSnapshot;
        
        // Restore all process properties
        process.cpuUsage = originalProcess.cpuUsage;
        process.memoryUsage = originalProcess.memoryUsage;
        process.threadCount = originalProcess.threadCount;
        process.effectivenessScore = originalProcess.effectivenessScore;
        process.priority = originalProcess.priority;

        return {
            success: true,
            strategiesReverted: ['memory', 'cpu', 'thread'],
            restoredState: {
                cpuUsage: originalProcess.cpuUsage,
                memoryUsage: originalProcess.memoryUsage,
                threadCount: originalProcess.threadCount,
                effectivenessScore: originalProcess.effectivenessScore
            }
        };
    }

    /**
     * Calculate combined risk of multiple optimizations
     * @param {Object} process - Process to analyze
     * @param {Array} strategies - Applicable strategies
     * @returns {number} Combined risk score (0-1)
     */
    calculateCombinedRisk(process, strategies) {
        let baseRisk = 0;

        // Base risk from process characteristics
        if (process.emotionalImpact > 0.7) baseRisk += 0.3;
        if (process.priority === 'critical') baseRisk += 0.2;
        if (process.effectivenessScore < 0.3) baseRisk += 0.2;

        // Risk multiplier based on number of strategies
        const strategyMultiplier = 1 + (strategies.length - 1) * 0.2;
        
        // Specific strategy combination risks
        if (strategies.includes('memory') && strategies.includes('cpu') && process.emotionalImpact > 0.5) {
            baseRisk += 0.15; // Memory + CPU on emotional processes is risky
        }

        return Math.min(1, baseRisk * strategyMultiplier);
    }

    /**
     * Calculate estimated improvement from hybrid optimization
     * @param {Object} memoryAnalysis - Memory analysis results
     * @param {Object} cpuAnalysis - CPU analysis results
     * @param {Object} threadAnalysis - Thread analysis results
     * @returns {Object} Estimated improvement metrics
     */
    calculateEstimatedImprovement(memoryAnalysis, cpuAnalysis, threadAnalysis) {
        return {
            memoryReduction: memoryAnalysis.canOptimize ? memoryAnalysis.estimatedReduction : 0,
            cpuReduction: cpuAnalysis.canOptimize ? cpuAnalysis.estimatedReduction : 0,
            threadEfficiencyGain: threadAnalysis.canOptimize ? 
                (threadAnalysis.rebalancingPotential / 100) * 0.3 : 0,
            overallEfficiencyGain: this.calculateOverallEfficiencyGain(memoryAnalysis, cpuAnalysis, threadAnalysis)
        };
    }

    /**
     * Calculate overall efficiency gain from combined optimizations
     * @param {Object} memoryAnalysis - Memory analysis results
     * @param {Object} cpuAnalysis - CPU analysis results
     * @param {Object} threadAnalysis - Thread analysis results
     * @returns {number} Overall efficiency gain (0-1)
     */
    calculateOverallEfficiencyGain(memoryAnalysis, cpuAnalysis, threadAnalysis) {
        let gain = 0;

        if (memoryAnalysis.canOptimize) gain += 0.2;
        if (cpuAnalysis.canOptimize) gain += 0.25;
        if (threadAnalysis.canOptimize) gain += 0.15;

        // Synergy bonus for multiple optimizations
        const activeOptimizations = [memoryAnalysis.canOptimize, cpuAnalysis.canOptimize, threadAnalysis.canOptimize]
            .filter(Boolean).length;
        
        if (activeOptimizations >= 2) {
            gain += 0.1; // Synergy bonus
        }

        return Math.min(0.6, gain); // Cap at 60% improvement
    }

    /**
     * Calculate combined improvement metrics
     * @param {Object} originalState - Original process state
     * @param {Object} finalState - Final process state
     * @returns {Object} Combined improvement metrics
     */
    calculateCombinedImprovement(originalState, finalState) {
        const cpuReduction = ((originalState.cpuUsage - finalState.cpuUsage) / originalState.cpuUsage) * 100;
        const memoryReduction = originalState.memoryUsage - finalState.memoryUsage;
        const effectivenessGain = ((finalState.effectivenessScore - originalState.effectivenessScore) / originalState.effectivenessScore) * 100;
        
        return {
            cpuReduction: Math.max(0, Math.round(cpuReduction * 100) / 100),
            memoryReduction: Math.max(0, Math.round(memoryReduction)),
            effectivenessGain: Math.round(effectivenessGain * 100) / 100,
            threadOptimization: originalState.threadCount !== finalState.threadCount,
            overallImprovement: (cpuReduction * 0.4 + (memoryReduction / 10) * 0.3 + effectivenessGain * 0.3)
        };
    }

    /**
     * Calculate adjusted CPU target based on other optimizations
     * @param {Object} results - Results from previous optimizations
     * @returns {number} Adjusted CPU reduction target
     */
    calculateAdjustedCpuTarget(results) {
        let target = this.targetMetrics.cpuReduction || 0.3;

        // Reduce CPU target if memory was significantly optimized
        if (results.memory && results.memory.reductionPercentage > 20) {
            target *= 0.8; // Less aggressive CPU throttling needed
        }

        // Adjust based on thread optimization
        if (results.thread && results.thread.efficiencyImprovement > 0.1) {
            target *= 0.9; // Thread efficiency reduces need for CPU throttling
        }

        return target;
    }

    /**
     * Add hybrid-specific side effects
     * @param {Array} strategies - Applied strategies
     * @param {Object} improvement - Combined improvement metrics
     */
    addHybridSideEffects(strategies, improvement) {
        // Add combined optimization effect
        this.sideEffects.push({
            type: 'hybrid_optimization',
            description: `Combined optimization using ${strategies.join(', ')} strategies`,
            severity: strategies.length > 2 ? 'moderate' : 'low',
            impact: 'comprehensive_performance_improvement',
            strategiesUsed: strategies,
            overallImprovement: improvement.overallImprovement
        });

        // Add potential instability warning for complex optimizations
        if (strategies.length >= 3 || improvement.overallImprovement > 40) {
            this.sideEffects.push({
                type: 'potential_instability',
                description: 'Complex optimization may cause temporary instability',
                severity: 'low',
                impact: 'monitor_for_issues',
                duration: 5000 // milliseconds
            });
        }
    }

    /**
     * Generate optimization recommendations
     * @param {Object} process - Process to analyze
     * @param {Array} strategies - Applicable strategies
     * @param {number} combinedRisk - Combined risk score
     * @returns {Array} Array of recommendations
     */
    generateRecommendations(process, strategies, combinedRisk) {
        const recommendations = [];

        if (strategies.length >= 3) {
            recommendations.push('Comprehensive optimization recommended - all major inefficiencies detected');
        } else if (strategies.length === 2) {
            recommendations.push(`Dual optimization recommended: ${strategies.join(' and ')}`);
        }

        if (combinedRisk > 0.6) {
            recommendations.push('Warning: High combined risk - consider safe mode or sequential optimization');
        } else if (combinedRisk > 0.3) {
            recommendations.push('Moderate risk detected - coordinated optimization recommended');
        }

        if (process.emotionalImpact > 0.7) {
            recommendations.push('Critical: High emotional impact - monitor for emotional side effects');
        }

        if (this.safeMode) {
            recommendations.push('Safe mode active - conservative hybrid optimization will be applied');
        }

        return recommendations;
    }
}
