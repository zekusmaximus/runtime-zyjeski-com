// MemoryConsolidationStrategy.js - Strategy for memory defragmentation and consolidation
// Reduces memory fragmentation by consolidating related memory blocks

import { OptimizationStrategy } from './OptimizationStrategy.js';

/**
 * Memory Consolidation Strategy
 * Defragments and consolidates memory blocks to reduce fragmentation.
 * Target: 30% memory reduction
 * Side effects: temporary_slowdown, cache_invalidation, possible_memory_merge
 */
export class MemoryConsolidationStrategy extends OptimizationStrategy {
    constructor(config = {}) {
        super(config);
        this.strategyName = 'memory_consolidation';
    }

    /**
     * Analyze process for memory consolidation potential
     * @param {Object} process - Process to analyze
     * @returns {Promise<Object>} Analysis result
     */
    async analyze(process) {
        const memoryFragmentation = this.calculateMemoryFragmentation(process);
        const consolidationPotential = this.calculateOptimizationPotential(process);
        
        const canOptimize = this.isSafeToOptimize(process) && memoryFragmentation > 20;
        
        return {
            canOptimize,
            memoryFragmentation,
            consolidationPotential,
            estimatedReduction: Math.min(30, memoryFragmentation * 0.8),
            riskLevel: process.emotionalImpact > 0.7 ? 'high' : 'moderate',
            recommendations: this.generateRecommendations(process, memoryFragmentation)
        };
    }

    /**
     * Optimize process through memory consolidation
     * @param {Object} process - Process to optimize
     * @returns {Promise<Object>} Optimization result
     */
    async optimize(process) {
        const analysis = await this.analyze(process);
        
        if (!analysis.canOptimize) {
            throw new Error('Process cannot be optimized with memory consolidation strategy');
        }

        // Calculate memory reduction
        const memoryReduction = Math.min(
            this.targetMetrics.memoryReduction || 0.3,
            analysis.estimatedReduction / 100
        );

        // Apply memory consolidation
        const originalMemoryUsage = process.memoryUsage;
        const newMemoryUsage = originalMemoryUsage * (1 - memoryReduction);
        
        this.applyOptimizationChanges(process, {
            memoryUsage: newMemoryUsage,
            effectivenessScore: process.effectivenessScore + 0.1
        });

        // Generate side effects
        this.sideEffects = this.generateSideEffects('memory_consolidation', process);
        
        // Add specific memory consolidation effects
        if (process.emotionalImpact > 0.6 && !this.safeMode) {
            this.sideEffects.push({
                type: 'memory_merge',
                description: `Consolidated ${Math.floor(memoryReduction * 100)}% of fragmented memories`,
                severity: 'moderate',
                originalMemories: this.generateAffectedMemories(process),
                mergedMemory: this.generateMergedMemory(process),
                emotionalImpact: 'reduced_grief_intensity'
            });
        }

        // Simulate temporary performance impact during consolidation
        // Note: In a real system, this would be handled by the system tick
        // For testing purposes, we'll skip the async CPU normalization

        return {
            success: true,
            memoryReduced: originalMemoryUsage - newMemoryUsage,
            reductionPercentage: memoryReduction * 100,
            affectedMemories: this.sideEffects.find(e => e.type === 'memory_merge')?.originalMemories || [],
            sideEffects: this.sideEffects
        };
    }

    /**
     * Revert memory consolidation optimization
     * @param {Object} process - Process to revert
     * @param {Object} undoData - Undo data containing original state
     * @returns {Promise<Object>} Revert result
     */
    async revert(process, undoData) {
        if (!undoData || !undoData.processSnapshot) {
            throw new Error('Cannot revert: missing undo data');
        }

        const originalProcess = undoData.processSnapshot;
        
        // Restore memory usage
        process.memoryUsage = originalProcess.memoryUsage;
        process.effectivenessScore = originalProcess.effectivenessScore;
        
        // Restore any merged memories (simulated)
        if (undoData.affectedMemories && undoData.affectedMemories.length > 0) {
            // In a real implementation, this would restore individual memory objects
            // For now, we simulate by reducing effectiveness slightly
            process.effectivenessScore = Math.max(0.1, process.effectivenessScore - 0.05);
        }

        return {
            success: true,
            memoryRestored: process.memoryUsage - originalProcess.memoryUsage,
            memoriesRestored: undoData.affectedMemories?.length || 0
        };
    }

    /**
     * Calculate memory fragmentation percentage
     * @param {Object} process - Process to analyze
     * @returns {number} Fragmentation percentage
     */
    calculateMemoryFragmentation(process) {
        // Simulate fragmentation based on memory usage, lifetime, and activity
        const baseFragmentation = Math.min(process.memoryUsage / 10, 50);
        const lifetimeImpact = Math.min(process.lifetime / 1000, 20);
        const activityImpact = (Date.now() - process.lastActivity) / 10000;
        const optimizationReduction = (process.optimizationLevel || 0) * 5;
        
        return Math.max(0, baseFragmentation + lifetimeImpact + activityImpact - optimizationReduction);
    }

    /**
     * Generate optimization recommendations
     * @param {Object} process - Process to analyze
     * @param {number} fragmentation - Current fragmentation level
     * @returns {Array} Array of recommendations
     */
    generateRecommendations(process, fragmentation) {
        const recommendations = [];

        if (fragmentation > 40) {
            recommendations.push('Immediate consolidation recommended - high fragmentation detected');
        } else if (fragmentation > 20) {
            recommendations.push('Consolidation beneficial - moderate fragmentation present');
        }

        if (process.emotionalImpact > 0.7 && !this.safeMode) {
            recommendations.push('Warning: High emotional impact - memory merging may occur');
        }

        if (this.safeMode) {
            recommendations.push('Safe mode active - emotional memories will be preserved');
        }

        return recommendations;
    }

    /**
     * Generate list of affected memories for narrative purposes
     * @param {Object} process - Process being optimized
     * @returns {Array} Array of memory identifiers
     */
    generateAffectedMemories(process) {
        // Simulate affected memories based on process type and emotional impact
        const memories = [];
        
        if (process.emotionSource?.type === 'grief') {
            memories.push('memory_sarah_last_conversation', 'memory_sarah_laugh', 'memory_empty_apartment');
        } else if (process.emotionSource?.type === 'anxiety') {
            memories.push('memory_timeline_confusion', 'memory_reality_doubt');
        }

        return memories;
    }

    /**
     * Generate merged memory for narrative purposes
     * @param {Object} process - Process being optimized
     * @returns {Object} Merged memory object
     */
    generateMergedMemory(process) {
        if (process.emotionSource?.type === 'grief') {
            return {
                id: 'memory_sarah_composite',
                type: 'consolidated_grief',
                intensity: process.emotionalImpact * 0.7, // Reduced intensity
                description: 'Consolidated memories of Sarah with reduced emotional charge'
            };
        }

        return {
            id: 'memory_consolidated_' + Date.now(),
            type: 'consolidated',
            intensity: process.emotionalImpact * 0.8,
            description: 'Consolidated memory block with optimized emotional processing'
        };
    }
}
