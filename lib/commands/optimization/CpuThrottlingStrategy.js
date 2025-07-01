// CpuThrottlingStrategy.js - Strategy for CPU usage optimization through adaptive throttling
// Implements adaptive CPU limits to prevent resource exhaustion

import { OptimizationStrategy } from './OptimizationStrategy.js';

/**
 * CPU Throttling Strategy
 * Implements adaptive CPU limits to prevent resource exhaustion.
 * Reduces CPU usage through intelligent throttling and priority adjustment.
 * Side effects: processing_delay, slower_responses
 */
export class CpuThrottlingStrategy extends OptimizationStrategy {
    constructor(config = {}) {
        super(config);
        this.strategyName = 'cpu_throttling';
        this.maxCpuReduction = 0.5; // Maximum 50% CPU reduction
    }

    /**
     * Analyze process for CPU throttling potential
     * @param {Object} process - Process to analyze
     * @returns {Promise<Object>} Analysis result
     */
    async analyze(process) {
        const cpuOptimizationPotential = this.calculateCpuOptimizationPotential(process);
        const throttlingBenefit = this.calculateThrottlingBenefit(process);
        
        const canOptimize = this.isSafeToOptimize(process) && process.cpuUsage > 20;
        
        return {
            canOptimize,
            currentCpuUsage: process.cpuUsage,
            optimizationPotential: cpuOptimizationPotential,
            throttlingBenefit,
            estimatedReduction: Math.min(50, process.cpuUsage * 0.4),
            riskLevel: this.calculateRiskLevel(process),
            recommendations: this.generateRecommendations(process)
        };
    }

    /**
     * Optimize process through CPU throttling
     * @param {Object} process - Process to optimize
     * @returns {Promise<Object>} Optimization result
     */
    async optimize(process) {
        const analysis = await this.analyze(process);
        
        if (!analysis.canOptimize) {
            throw new Error('Process cannot be optimized with CPU throttling strategy');
        }

        // Calculate CPU reduction based on target metrics and analysis
        const targetReduction = this.targetMetrics.cpuReduction || 0.3;
        const maxSafeReduction = this.calculateMaxSafeReduction(process);
        const actualReduction = Math.min(targetReduction, maxSafeReduction, this.maxCpuReduction);

        // Store original values
        const originalCpuUsage = process.cpuUsage;
        const originalPriority = process.priority;

        // Apply CPU throttling
        const newCpuUsage = originalCpuUsage * (1 - actualReduction);
        
        this.applyOptimizationChanges(process, {
            cpuUsage: newCpuUsage
        });

        // Adjust process priority if significant throttling
        if (actualReduction > 0.3) {
            process.priority = this.adjustPriority(process.priority, 'lower');
        }

        // Generate side effects
        this.sideEffects = this.generateSideEffects('cpu_throttling', process);
        
        // Add specific CPU throttling effects
        this.sideEffects.push({
            type: 'processing_delay',
            description: `CPU usage reduced by ${Math.round(actualReduction * 100)}%`,
            severity: actualReduction > 0.4 ? 'moderate' : 'low',
            impact: 'slower_responses',
            delayIncrease: actualReduction * 100 // milliseconds
        });

        // If this is an emotional process, add emotional dampening effect
        if (process.emotionalImpact > 0.5 && actualReduction > 0.3) {
            this.sideEffects.push({
                type: 'emotional_dampening',
                description: 'Emotional processing intensity reduced',
                severity: 'moderate',
                emotion: process.emotionSource?.type || 'unknown',
                dampeningLevel: actualReduction * 0.5,
                consequence: 'reduced_emotional_intensity'
            });
        }

        return {
            success: true,
            cpuReduced: originalCpuUsage - newCpuUsage,
            reductionPercentage: actualReduction * 100,
            priorityAdjusted: process.priority !== originalPriority,
            newPriority: process.priority,
            sideEffects: this.sideEffects
        };
    }

    /**
     * Revert CPU throttling optimization
     * @param {Object} process - Process to revert
     * @param {Object} undoData - Undo data containing original state
     * @returns {Promise<Object>} Revert result
     */
    async revert(process, undoData) {
        if (!undoData || !undoData.processSnapshot) {
            throw new Error('Cannot revert: missing undo data');
        }

        const originalProcess = undoData.processSnapshot;
        
        // Restore CPU usage and priority
        process.cpuUsage = originalProcess.cpuUsage;
        process.priority = originalProcess.priority;

        return {
            success: true,
            cpuRestored: originalProcess.cpuUsage - process.cpuUsage,
            priorityRestored: originalProcess.priority
        };
    }

    /**
     * Calculate CPU optimization potential
     * @param {Object} process - Process to analyze
     * @returns {number} Optimization potential score (0-100)
     */
    calculateCpuOptimizationPotential(process) {
        let potential = 0;

        // High CPU usage indicates good optimization potential
        if (process.cpuUsage > 60) potential += 40;
        else if (process.cpuUsage > 40) potential += 25;
        else if (process.cpuUsage > 20) potential += 10;

        // Low effectiveness with high CPU suggests inefficiency
        if (process.cpuUsage > 30 && process.effectivenessScore < 0.6) {
            potential += 30;
        }

        // Long-running processes may have accumulated inefficiencies
        if (process.lifetime > 10000) potential += 15;

        // Multiple threads with high CPU usage
        if (process.threadCount > 3 && process.cpuUsage > 30) {
            potential += 15;
        }

        return Math.min(100, potential);
    }

    /**
     * Calculate throttling benefit score
     * @param {Object} process - Process to analyze
     * @returns {number} Benefit score (0-100)
     */
    calculateThrottlingBenefit(process) {
        let benefit = 0;

        // Higher CPU usage = more benefit from throttling
        benefit += Math.min(40, process.cpuUsage);

        // Processes with many issues benefit from throttling
        const issueCount = process.currentIssues ? process.currentIssues.length : 0;
        benefit += issueCount * 10;

        // Background processes can be throttled more aggressively
        if (process.type === 'background') benefit += 20;

        // Emotional processes may benefit but with risks
        if (process.emotionalImpact > 0.5) {
            benefit += 10; // Some benefit
            if (this.safeMode) benefit -= 15; // But reduced in safe mode
        }

        return Math.min(100, benefit);
    }

    /**
     * Calculate maximum safe CPU reduction
     * @param {Object} process - Process to analyze
     * @returns {number} Maximum safe reduction (0-1)
     */
    calculateMaxSafeReduction(process) {
        let maxReduction = 0.5; // Start with 50% max

        // Reduce max for critical processes
        if (process.priority === 'high' || process.priority === 'critical') {
            maxReduction = 0.2;
        }

        // Reduce max for emotional processes in safe mode
        if (this.safeMode && process.emotionalImpact > 0.5) {
            maxReduction = 0.15;
        }

        // Reduce max for processes with low effectiveness
        if (process.effectivenessScore < 0.3) {
            maxReduction = 0.3; // Don't throttle struggling processes too much
        }

        // Background processes can be throttled more
        if (process.type === 'background') {
            maxReduction = 0.6;
        }

        return maxReduction;
    }

    /**
     * Calculate risk level for CPU throttling
     * @param {Object} process - Process to analyze
     * @returns {string} Risk level: 'low', 'moderate', 'high'
     */
    calculateRiskLevel(process) {
        if (process.priority === 'critical' || process.emotionalImpact > 0.8) {
            return 'high';
        }
        
        if (process.priority === 'high' || process.emotionalImpact > 0.5 || process.effectivenessScore < 0.3) {
            return 'moderate';
        }
        
        return 'low';
    }

    /**
     * Adjust process priority
     * @param {string} currentPriority - Current priority level
     * @param {string} direction - 'higher' or 'lower'
     * @returns {string} New priority level
     */
    adjustPriority(currentPriority, direction) {
        const priorities = ['low', 'normal', 'high', 'critical'];
        const currentIndex = priorities.indexOf(currentPriority);
        
        if (direction === 'lower' && currentIndex > 0) {
            return priorities[currentIndex - 1];
        } else if (direction === 'higher' && currentIndex < priorities.length - 1) {
            return priorities[currentIndex + 1];
        }
        
        return currentPriority;
    }

    /**
     * Generate optimization recommendations
     * @param {Object} process - Process to analyze
     * @returns {Array} Array of recommendations
     */
    generateRecommendations(process) {
        const recommendations = [];

        if (process.cpuUsage > 60) {
            recommendations.push('High CPU usage detected - significant throttling recommended');
        } else if (process.cpuUsage > 40) {
            recommendations.push('Moderate CPU usage - throttling will improve system performance');
        }

        if (process.emotionalImpact > 0.7) {
            recommendations.push('Warning: High emotional impact - throttling may affect emotional processing');
        }

        if (this.safeMode) {
            recommendations.push('Safe mode active - conservative throttling will be applied');
        }

        if (process.effectivenessScore < 0.3) {
            recommendations.push('Low effectiveness detected - gentle throttling recommended');
        }

        return recommendations;
    }
}
