// ThreadRebalancingStrategy.js - Strategy for thread optimization and rebalancing
// Redistributes threads across cores for better parallel processing

import { OptimizationStrategy } from './OptimizationStrategy.js';

/**
 * Thread Rebalancing Strategy
 * Redistributes threads across cores for better parallel processing.
 * Optimizes thread count and assignments to reduce contention and improve efficiency.
 * Side effects: thread_rebalancing, temporary_instability
 */
export class ThreadRebalancingStrategy extends OptimizationStrategy {
    constructor(config = {}) {
        super(config);
        this.strategyName = 'thread_rebalancing';
        this.maxThreads = 8; // Maximum threads per process
        this.optimalThreadRatio = 2; // Optimal threads per CPU core
    }

    /**
     * Analyze process for thread rebalancing potential
     * @param {Object} process - Process to analyze
     * @returns {Promise<Object>} Analysis result
     */
    async analyze(process) {
        const threadEfficiency = this.calculateThreadEfficiency(process);
        const contentionLevel = this.calculateContentionLevel(process);
        const rebalancingPotential = this.calculateRebalancingPotential(process);
        
        const canOptimize = this.isSafeToOptimize(process) && 
                           (process.threadCount > 5 || threadEfficiency < 0.6);
        
        return {
            canOptimize,
            currentThreadCount: process.threadCount,
            threadEfficiency,
            contentionLevel,
            rebalancingPotential,
            optimalThreadCount: this.calculateOptimalThreadCount(process),
            riskLevel: this.calculateRiskLevel(process),
            recommendations: this.generateRecommendations(process, threadEfficiency, contentionLevel)
        };
    }

    /**
     * Optimize process through thread rebalancing
     * @param {Object} process - Process to optimize
     * @returns {Promise<Object>} Optimization result
     */
    async optimize(process) {
        const analysis = await this.analyze(process);
        
        if (!analysis.canOptimize) {
            throw new Error('Process cannot be optimized with thread rebalancing strategy');
        }

        // Store original values
        const originalThreadCount = process.threadCount;
        const originalCpuUsage = process.cpuUsage;
        const originalEffectiveness = process.effectivenessScore;

        // Calculate optimal thread count
        const optimalThreads = analysis.optimalThreadCount;
        const threadReduction = originalThreadCount - optimalThreads;

        // Apply thread rebalancing
        this.applyOptimizationChanges(process, {
            threadCount: optimalThreads,
            effectivenessScore: originalEffectiveness + this.calculateEffectivenessGain(threadReduction),
            cpuUsage: this.calculateNewCpuUsage(process, optimalThreads)
        });

        // Generate side effects
        this.sideEffects = this.generateSideEffects('thread_rebalancing', process);
        
        // Add specific thread rebalancing effects
        this.sideEffects.push({
            type: 'thread_rebalancing',
            description: `Threads optimized from ${originalThreadCount} to ${optimalThreads}`,
            severity: Math.abs(threadReduction) > 3 ? 'moderate' : 'low',
            impact: 'improved_parallel_processing',
            threadsChanged: threadReduction,
            efficiencyGain: this.calculateEffectivenessGain(threadReduction)
        });

        // Add temporary instability if major rebalancing
        if (Math.abs(threadReduction) > 3) {
            this.sideEffects.push({
                type: 'temporary_instability',
                description: 'Temporary processing instability during thread rebalancing',
                severity: 'low',
                duration: 1000, // milliseconds
                impact: 'brief_performance_dip'
            });

            // Simulate temporary instability
            const tempEffectivenessReduction = 0.1;
            process.effectivenessScore -= tempEffectivenessReduction;
            
            // Schedule recovery
            setTimeout(() => {
                process.effectivenessScore += tempEffectivenessReduction;
            }, 1000);
        }

        return {
            success: true,
            threadsRebalanced: threadReduction,
            newThreadCount: optimalThreads,
            efficiencyImprovement: this.calculateEffectivenessGain(threadReduction),
            cpuImpact: process.cpuUsage - originalCpuUsage,
            sideEffects: this.sideEffects
        };
    }

    /**
     * Revert thread rebalancing optimization
     * @param {Object} process - Process to revert
     * @param {Object} undoData - Undo data containing original state
     * @returns {Promise<Object>} Revert result
     */
    async revert(process, undoData) {
        if (!undoData || !undoData.processSnapshot) {
            throw new Error('Cannot revert: missing undo data');
        }

        const originalProcess = undoData.processSnapshot;
        
        // Restore thread configuration
        process.threadCount = originalProcess.threadCount;
        process.cpuUsage = originalProcess.cpuUsage;
        process.effectivenessScore = originalProcess.effectivenessScore;

        return {
            success: true,
            threadsRestored: originalProcess.threadCount,
            efficiencyRestored: originalProcess.effectivenessScore
        };
    }

    /**
     * Calculate thread efficiency
     * @param {Object} process - Process to analyze
     * @returns {number} Efficiency score (0-1)
     */
    calculateThreadEfficiency(process) {
        // Efficiency decreases with too many or too few threads
        const optimalThreads = this.calculateOptimalThreadCount(process);
        const threadDifference = Math.abs(process.threadCount - optimalThreads);
        
        // Base efficiency from process effectiveness
        let efficiency = process.effectivenessScore;
        
        // Penalty for suboptimal thread count
        const threadPenalty = threadDifference * 0.1;
        efficiency -= threadPenalty;
        
        // Bonus for processes with good CPU/thread ratio
        const cpuPerThread = process.cpuUsage / process.threadCount;
        if (cpuPerThread > 5 && cpuPerThread < 20) {
            efficiency += 0.1;
        }
        
        return Math.max(0, Math.min(1, efficiency));
    }

    /**
     * Calculate thread contention level
     * @param {Object} process - Process to analyze
     * @returns {number} Contention level (0-1)
     */
    calculateContentionLevel(process) {
        let contention = 0;
        
        // High thread count increases contention
        if (process.threadCount > 6) {
            contention += (process.threadCount - 6) * 0.1;
        }
        
        // High CPU usage with many threads suggests contention
        if (process.threadCount > 4 && process.cpuUsage > 50) {
            contention += 0.3;
        }
        
        // Low effectiveness with many threads indicates contention
        if (process.threadCount > 3 && process.effectivenessScore < 0.5) {
            contention += 0.4;
        }
        
        // Issues may indicate thread problems
        const issueCount = process.currentIssues ? process.currentIssues.length : 0;
        contention += issueCount * 0.1;
        
        return Math.min(1, contention);
    }

    /**
     * Calculate rebalancing potential
     * @param {Object} process - Process to analyze
     * @returns {number} Potential score (0-100)
     */
    calculateRebalancingPotential(process) {
        let potential = 0;
        
        const threadEfficiency = this.calculateThreadEfficiency(process);
        const contentionLevel = this.calculateContentionLevel(process);
        
        // Low efficiency indicates high potential
        potential += (1 - threadEfficiency) * 50;
        
        // High contention indicates high potential
        potential += contentionLevel * 40;
        
        // Suboptimal thread count
        const optimalThreads = this.calculateOptimalThreadCount(process);
        const threadDifference = Math.abs(process.threadCount - optimalThreads);
        potential += Math.min(20, threadDifference * 5);
        
        return Math.min(100, potential);
    }

    /**
     * Calculate optimal thread count for process
     * @param {Object} process - Process to analyze
     * @returns {number} Optimal thread count
     */
    calculateOptimalThreadCount(process) {
        // Base calculation on CPU usage and process type
        let optimal = Math.ceil(process.cpuUsage / 15); // Rough heuristic
        
        // Adjust based on process type
        switch (process.type) {
            case 'emotional_processing':
                optimal = Math.min(4, optimal); // Emotional processes don't need many threads
                break;
            case 'background':
                optimal = Math.max(1, optimal - 1); // Background can use fewer
                break;
            case 'memory_search':
                optimal = Math.min(6, optimal + 1); // Search benefits from parallelism
                break;
        }
        
        // Consider emotional impact
        if (process.emotionalImpact > 0.7) {
            optimal = Math.min(3, optimal); // High emotional impact should be single-threaded
        }
        
        // Ensure within bounds
        return Math.max(1, Math.min(this.maxThreads, optimal));
    }

    /**
     * Calculate effectiveness gain from thread optimization
     * @param {number} threadReduction - Number of threads reduced (can be negative)
     * @returns {number} Effectiveness gain
     */
    calculateEffectivenessGain(threadReduction) {
        // Reducing excess threads improves effectiveness
        if (threadReduction > 0) {
            return Math.min(0.2, threadReduction * 0.05);
        }
        // Adding needed threads also improves effectiveness (but less)
        else if (threadReduction < 0) {
            return Math.min(0.1, Math.abs(threadReduction) * 0.02);
        }
        return 0;
    }

    /**
     * Calculate new CPU usage after thread optimization
     * @param {Object} process - Process being optimized
     * @param {number} newThreadCount - New thread count
     * @returns {number} New CPU usage
     */
    calculateNewCpuUsage(process, newThreadCount) {
        const threadRatio = newThreadCount / process.threadCount;
        
        // CPU usage generally scales with thread count, but with diminishing returns
        let newCpuUsage = process.cpuUsage * Math.pow(threadRatio, 0.8);
        
        // Efficiency improvements from better thread management
        if (newThreadCount < process.threadCount) {
            newCpuUsage *= 0.95; // 5% efficiency bonus for reducing threads
        }
        
        return Math.max(1, newCpuUsage);
    }

    /**
     * Calculate risk level for thread rebalancing
     * @param {Object} process - Process to analyze
     * @returns {string} Risk level: 'low', 'moderate', 'high'
     */
    calculateRiskLevel(process) {
        if (process.priority === 'critical' || process.emotionalImpact > 0.8) {
            return 'high';
        }
        
        if (process.threadCount > 6 || process.emotionalImpact > 0.5) {
            return 'moderate';
        }
        
        return 'low';
    }

    /**
     * Generate optimization recommendations
     * @param {Object} process - Process to analyze
     * @param {number} threadEfficiency - Current thread efficiency
     * @param {number} contentionLevel - Current contention level
     * @returns {Array} Array of recommendations
     */
    generateRecommendations(process, threadEfficiency, contentionLevel) {
        const recommendations = [];
        const optimalThreads = this.calculateOptimalThreadCount(process);

        if (process.threadCount > optimalThreads) {
            recommendations.push(`Reduce threads from ${process.threadCount} to ${optimalThreads} for better efficiency`);
        } else if (process.threadCount < optimalThreads) {
            recommendations.push(`Increase threads from ${process.threadCount} to ${optimalThreads} for better parallelism`);
        }

        if (threadEfficiency < 0.5) {
            recommendations.push('Low thread efficiency detected - rebalancing will significantly improve performance');
        }

        if (contentionLevel > 0.6) {
            recommendations.push('High thread contention detected - reducing thread count recommended');
        }

        if (process.emotionalImpact > 0.7) {
            recommendations.push('Warning: High emotional impact - thread changes may affect emotional processing stability');
        }

        if (this.safeMode) {
            recommendations.push('Safe mode active - conservative thread adjustments will be applied');
        }

        return recommendations;
    }
}
