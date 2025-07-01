// OptimizationStrategy.js - Base class for process optimization strategies
// Implements the Strategy pattern for different optimization approaches

/**
 * Base class for all optimization strategies.
 * Defines the interface that all concrete strategies must implement.
 */
export class OptimizationStrategy {
    /**
     * Create a new optimization strategy
     * @param {Object} config - Strategy configuration
     * @param {boolean} config.safeMode - Whether to avoid high-risk operations
     * @param {Object} config.targetMetrics - Target optimization metrics
     */
    constructor(config = {}) {
        this.config = config;
        this.safeMode = config.safeMode || false;
        this.targetMetrics = config.targetMetrics || {};
        this.sideEffects = [];
    }

    /**
     * Analyze a process to determine optimization potential
     * @param {Object} process - Process to analyze
     * @returns {Promise<Object>} Analysis result with recommendations
     */
    async analyze(process) {
        throw new Error('Must implement analyze method');
    }

    /**
     * Optimize the given process
     * @param {Object} process - Process to optimize
     * @returns {Promise<Object>} Optimization result with affected data
     */
    async optimize(process) {
        throw new Error('Must implement optimize method');
    }

    /**
     * Revert optimization changes
     * @param {Object} process - Process to revert
     * @param {Object} undoData - Data needed for reversal
     * @returns {Promise<Object>} Revert result
     */
    async revert(process, undoData) {
        throw new Error('Must implement revert method');
    }

    /**
     * Get side effects that may occur from this optimization
     * @returns {Array} Array of side effect objects
     */
    getSideEffects() {
        return this.sideEffects;
    }

    /**
     * Check if optimization is safe to perform
     * @param {Object} process - Process to check
     * @returns {boolean} True if safe to optimize
     */
    isSafeToOptimize(process) {
        // Never optimize system processes
        const systemProcesses = ['System_Core.exe', 'Reality_Anchor.dll', 'Self_Identity.exe'];
        if (systemProcesses.includes(process.name)) {
            return false;
        }

        // In safe mode, avoid high emotional impact processes
        if (this.safeMode && process.emotionalImpact > 0.7) {
            return false;
        }

        return true;
    }

    /**
     * Calculate optimization potential score
     * @param {Object} process - Process to evaluate
     * @returns {number} Score from 0-100 indicating optimization potential
     */
    calculateOptimizationPotential(process) {
        let score = 0;

        // CPU usage factor (higher usage = more potential)
        if (process.cpuUsage > 40) score += 30;
        else if (process.cpuUsage > 20) score += 15;

        // Memory usage factor
        if (process.memoryUsage > 200) score += 25;
        else if (process.memoryUsage > 100) score += 10;

        // Effectiveness factor (lower effectiveness = more potential)
        if (process.effectivenessScore < 0.5) score += 25;
        else if (process.effectivenessScore < 0.8) score += 15;

        // Thread count factor
        if (process.threadCount > 5) score += 20;
        else if (process.threadCount > 3) score += 10;

        return Math.min(100, score);
    }

    /**
     * Apply common optimization effects
     * @param {Object} process - Process being optimized
     * @param {Object} changes - Changes to apply
     */
    applyOptimizationChanges(process, changes) {
        if (changes.cpuUsage !== undefined) {
            process.cpuUsage = Math.max(1, changes.cpuUsage);
        }
        if (changes.memoryUsage !== undefined) {
            process.memoryUsage = Math.max(10, changes.memoryUsage);
        }
        if (changes.threadCount !== undefined) {
            process.threadCount = Math.max(1, changes.threadCount);
        }
        if (changes.effectivenessScore !== undefined) {
            process.effectivenessScore = Math.min(1.5, Math.max(0.1, changes.effectivenessScore));
        }

        // Update last activity
        process.lastActivity = Date.now();
    }

    /**
     * Generate realistic side effects based on optimization type
     * @param {string} optimizationType - Type of optimization performed
     * @param {Object} process - Process being optimized
     * @returns {Array} Array of side effects
     */
    generateSideEffects(optimizationType, process) {
        const effects = [];

        switch (optimizationType) {
            case 'memory_consolidation':
                if (process.emotionalImpact > 0.6) {
                    effects.push({
                        type: 'memory_merge',
                        description: 'Related memories consolidated',
                        severity: 'moderate',
                        emotionalImpact: 'reduced_intensity'
                    });
                }
                effects.push({
                    type: 'cache_invalidation',
                    description: 'Memory cache cleared for optimization',
                    severity: 'low',
                    impact: 'temporary_slowdown'
                });
                break;

            case 'cpu_throttling':
                effects.push({
                    type: 'processing_delay',
                    description: 'Reduced processing speed',
                    severity: 'low',
                    impact: 'slower_responses'
                });
                break;

            case 'thread_rebalancing':
                effects.push({
                    type: 'thread_rebalancing',
                    description: 'Threads redistributed across cores',
                    severity: 'low',
                    impact: 'improved_parallel_processing'
                });
                break;

            case 'emotion_suppression':
                if (!this.safeMode && process.emotionalImpact > 0.5) {
                    effects.push({
                        type: 'emotion_suppression',
                        description: 'Emotional processing reduced',
                        severity: 'moderate',
                        emotion: process.emotionSource?.type || 'unknown',
                        suppressionLevel: 0.3,
                        consequence: 'delayed_acceptance'
                    });
                }
                break;
        }

        return effects;
    }
}
