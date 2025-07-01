// OptimizeProcessCommand.js - Command to optimize mental processes for better performance
// Implements the Command pattern with strategy-based optimization and full undo capability

import { DebugCommand } from './base/DebugCommand.js';
import { OptimizationStrategyFactory } from './optimization/OptimizationStrategyFactory.js';

/**
 * Command to optimize a process in the consciousness system.
 * Implements the Command pattern with strategy-based optimization approaches:
 * - Memory consolidation to reduce fragmentation
 * - CPU throttling to prevent resource exhaustion  
 * - Thread rebalancing for better parallel processing
 * - Response time optimization for improved reactivity
 */
export class OptimizeProcessCommand extends DebugCommand {
    /**
     * Create a new optimize process command
     * @param {Object} params - Command parameters
     * @param {number} params.processId - The ID of the process to optimize
     * @param {string} params.characterId - Character being helped
     * @param {string} [params.strategy] - Optional: specific strategy name
     * @param {boolean} [params.autoSelect=true] - Let system choose best strategy
     * @param {Object} [params.targetMetrics] - Desired optimization targets
     * @param {boolean} [params.safeMode=false] - Avoid all high-risk optimizations
     * @param {Object} dependencies - Injected dependencies
     * @param {Object} dependencies.processManager - The process manager instance
     * @param {Object} dependencies.consciousnessEngine - The consciousness engine instance
     * @param {Object} dependencies.eventEmitter - Event emitter for narrative events
     */
    constructor(params, dependencies) {
        super({ ...params, ...dependencies });
        
        // Validate required parameters
        if (!params.processId) {
            throw new Error('processId is required for OptimizeProcessCommand');
        }
        if (!params.characterId) {
            throw new Error('characterId is required for OptimizeProcessCommand');
        }
        
        // Store parameters
        this.processId = params.processId;
        this.characterId = params.characterId;
        this.strategy = params.strategy || null;
        this.autoSelect = params.autoSelect !== false;
        this.targetMetrics = params.targetMetrics || {};
        this.safeMode = params.safeMode || false;
        
        // Store dependencies
        this.processManager = dependencies.processManager;
        this.consciousnessEngine = dependencies.consciousnessEngine;
        this.eventEmitter = dependencies.eventEmitter;
        
        // Initialize strategy factory
        this.strategyFactory = new OptimizationStrategyFactory();
        
        // State for undo
        this.processSnapshot = null;
        this.affectedMemories = null;
        this.strategyUsed = null;
        this.metricsSnapshot = null;
        this.optimizationResult = null;
    }

    /**
     * Check if the process can be optimized
     * @returns {Promise<boolean>} True if process exists and can be optimized
     */
    async canExecute() {
        const process = this.processManager.processes.get(this.processId);
        if (!process) {
            throw new Error(`Cannot optimize process ${this.processId}: process not found`);
        }
        
        if (process.status === 'terminated') {
            throw new Error(`Cannot optimize process ${this.processId}: process is terminated`);
        }
        
        // Safety constraints - never optimize system processes
        const systemProcesses = ['System_Core.exe', 'Reality_Anchor.dll', 'Self_Identity.exe'];
        if (systemProcesses.includes(process.name)) {
            throw new Error(`Cannot optimize system process ${process.name}: safety constraint violation`);
        }
        
        // Check if already optimized recently
        if (process.optimizationLevel >= 3) {
            throw new Error(`Process ${this.processId} is already heavily optimized (level ${process.optimizationLevel})`);
        }
        
        return true;
    }

    /**
     * Execute the optimize process command
     * @returns {Promise<Object>} Result of the optimization operation
     */
    async execute() {
        const startTime = Date.now();
        
        if (!await this.canExecute()) {
            throw new Error(`Cannot execute optimization for process ${this.processId}`);
        }

        const process = this.processManager.processes.get(this.processId);
        
        // Create complete process snapshot for undo
        this.processSnapshot = JSON.parse(JSON.stringify(process));
        this.metricsSnapshot = JSON.parse(JSON.stringify(this.processManager.performanceMetrics));
        
        // Analyze process to determine optimization needs
        const analysis = await this.analyzeProcess(process);
        
        if (!analysis.needsOptimization) {
            this.executed = true;
            this.timestamp = Date.now();
            this.result = {
                success: true,
                processId: this.processId,
                message: 'Process is already running optimally',
                analysis,
                executionTime: Date.now() - startTime
            };
            return this.result;
        }
        
        // Select optimization strategy
        let selectedStrategy;
        if (this.strategy) {
            selectedStrategy = this.strategyFactory.createStrategy(this.strategy, {
                safeMode: this.safeMode,
                targetMetrics: this.targetMetrics
            });
        } else if (this.autoSelect) {
            selectedStrategy = this.strategyFactory.recommendStrategy(analysis, {
                safeMode: this.safeMode,
                targetMetrics: this.targetMetrics
            });
        } else {
            throw new Error('No strategy specified and autoSelect is disabled');
        }
        
        this.strategyUsed = selectedStrategy.constructor.name;
        
        // Capture before metrics
        const beforeMetrics = this.captureProcessMetrics(process);
        
        // Execute optimization strategy
        const optimizationData = await selectedStrategy.optimize(process);
        this.affectedMemories = optimizationData.affectedMemories || [];
        
        // Capture after metrics
        const afterMetrics = this.captureProcessMetrics(process);
        
        // Calculate improvements
        const improvement = this.calculateImprovement(beforeMetrics, afterMetrics);
        
        // Update process optimization level
        process.optimizationLevel = (process.optimizationLevel || 0) + 1;
        process.lastOptimization = Date.now();
        
        // Update performance metrics
        this.processManager.performanceMetrics.optimizationAttempts++;
        
        // Get side effects from strategy
        const sideEffects = selectedStrategy.getSideEffects();
        
        // Emit narrative events
        await this.emitNarrativeEvents(selectedStrategy, sideEffects, improvement);
        
        this.executed = true;
        this.timestamp = Date.now();
        this.optimizationResult = {
            success: true,
            processId: this.processId,
            strategyUsed: this.strategyUsed,
            metrics: {
                before: beforeMetrics,
                after: afterMetrics,
                improvement
            },
            sideEffects,
            narrativeImpact: this.calculateNarrativeImpact(sideEffects),
            executionTime: Date.now() - startTime,
            undoData: {
                processSnapshot: this.processSnapshot,
                affectedMemories: this.affectedMemories,
                strategyUsed: this.strategyUsed,
                metricsSnapshot: this.metricsSnapshot
            }
        };
        
        this.result = this.optimizationResult;
        return this.result;
    }

    /**
     * Undo the optimize process command (restore the process to pre-optimization state)
     * @returns {Promise<Object>} Result of the undo operation
     */
    async undo() {
        if (!this.executed || !this.processSnapshot) {
            throw new Error('Nothing to undo: command was not executed or process state not stored');
        }

        // Restore the process to its complete previous state
        const restoredProcess = JSON.parse(JSON.stringify(this.processSnapshot));
        this.processManager.processes.set(this.processId, restoredProcess);

        // Restore metrics
        if (this.metricsSnapshot) {
            this.processManager.performanceMetrics = JSON.parse(JSON.stringify(this.metricsSnapshot));
        }

        // Emit undo events for narrative system
        if (this.eventEmitter) {
            this.eventEmitter.emit('optimization_undone', {
                processId: this.processId,
                characterId: this.characterId,
                strategyUsed: this.strategyUsed,
                timestamp: Date.now()
            });
        }

        this.executed = false;
        this.result = {
            success: true,
            processId: this.processId,
            message: `Process ${this.processSnapshot.name} (${this.processId}) optimization undone`,
            timestamp: Date.now(),
            restoredState: {
                cpuUsage: restoredProcess.cpuUsage,
                memoryUsage: restoredProcess.memoryUsage,
                threadCount: restoredProcess.threadCount,
                optimizationLevel: restoredProcess.optimizationLevel
            }
        };

        return this.result;
    }

    /**
     * Check if the command can be undone
     * @returns {boolean} True if command can be undone
     */
    canUndo() {
        return this.executed && this.processSnapshot !== null;
    }

    /**
     * Get a human-readable description of what this command does
     * @returns {string} Command description
     */
    getDescription() {
        const strategyDesc = this.strategy ? ` using ${this.strategy}` : ' with auto-selected strategy';
        const safeModeDesc = this.safeMode ? ' (safe mode)' : '';
        return `Optimize process ${this.processId}${strategyDesc}${safeModeDesc}`;
    }

    /**
     * Analyze process to determine optimization needs
     * @param {Object} process - Process to analyze
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeProcess(process) {
        const reasons = [];
        let needsOptimization = false;
        let riskLevel = 'low';
        let recommendedStrategy = 'memory_consolidation';

        // Check CPU usage (> 40% for single process is excessive)
        if (process.cpuUsage > 40) {
            reasons.push('cpu_usage_excessive');
            needsOptimization = true;
            recommendedStrategy = 'cpu_throttling';
            riskLevel = 'moderate';
        }

        // Check memory fragmentation (simulate fragmentation calculation)
        const memoryFragmentation = this.calculateMemoryFragmentation(process);
        if (memoryFragmentation > 30) {
            reasons.push('memory_fragmented');
            needsOptimization = true;
            recommendedStrategy = 'memory_consolidation';
        }

        // Check thread contention (high thread count with low efficiency)
        if (process.threadCount > 5 && process.effectivenessScore < 0.6) {
            reasons.push('thread_contention');
            needsOptimization = true;
            recommendedStrategy = 'thread_rebalancing';
            riskLevel = 'moderate';
        }

        // Check response time degradation (based on lifetime and effectiveness)
        const responseTimeDegraded = process.lifetime > 10000 && process.effectivenessScore < 0.7;
        if (responseTimeDegraded) {
            reasons.push('response_time_degraded');
            needsOptimization = true;
        }

        // Determine risk level based on process type and emotional impact
        if (process.emotionalImpact > 0.8) {
            riskLevel = 'high';
        } else if (process.emotionalImpact > 0.5 || process.type === 'emotional_processing') {
            riskLevel = 'moderate';
        }

        // If multiple issues, recommend hybrid approach
        if (reasons.length > 2) {
            recommendedStrategy = 'hybrid_optimization';
            riskLevel = 'high';
        }

        return {
            needsOptimization,
            reasons,
            recommendedStrategy,
            riskLevel,
            currentMetrics: {
                cpuUsage: process.cpuUsage,
                memoryUsage: process.memoryUsage,
                memoryFragmentation,
                threadCount: process.threadCount,
                effectivenessScore: process.effectivenessScore,
                emotionalImpact: process.emotionalImpact
            }
        };
    }

    /**
     * Calculate memory fragmentation percentage
     * @param {Object} process - Process to analyze
     * @returns {number} Fragmentation percentage
     */
    calculateMemoryFragmentation(process) {
        // Simulate fragmentation based on memory usage, lifetime, and optimization level
        const baseFragmentation = Math.min(process.memoryUsage / 10, 50);
        const lifetimeImpact = Math.min(process.lifetime / 1000, 20);
        const optimizationReduction = (process.optimizationLevel || 0) * 5;

        return Math.max(0, baseFragmentation + lifetimeImpact - optimizationReduction);
    }

    /**
     * Capture comprehensive process metrics
     * @param {Object} process - Process to capture metrics from
     * @returns {Object} Metrics snapshot
     */
    captureProcessMetrics(process) {
        return {
            cpuUsage: process.cpuUsage,
            memoryUsage: process.memoryUsage,
            memoryFragmentation: this.calculateMemoryFragmentation(process),
            responseTime: this.calculateResponseTime(process),
            threadCount: process.threadCount,
            errorRate: this.calculateErrorRate(process),
            effectivenessScore: process.effectivenessScore,
            timestamp: Date.now()
        };
    }

    /**
     * Calculate simulated response time
     * @param {Object} process - Process to analyze
     * @returns {number} Response time in milliseconds
     */
    calculateResponseTime(process) {
        // Base response time affected by CPU usage, memory fragmentation, and thread contention
        const basetime = 50;
        const cpuImpact = process.cpuUsage * 2;
        const memoryImpact = this.calculateMemoryFragmentation(process) * 1.5;
        const threadImpact = Math.max(0, (process.threadCount - 2) * 10);

        return basetime + cpuImpact + memoryImpact + threadImpact;
    }

    /**
     * Calculate error rate based on process issues
     * @param {Object} process - Process to analyze
     * @returns {number} Error rate percentage
     */
    calculateErrorRate(process) {
        const issueCount = process.currentIssues ? process.currentIssues.length : 0;
        const crashImpact = process.crashCount * 5;
        const effectivenessImpact = (1 - process.effectivenessScore) * 20;

        return Math.min(100, issueCount * 2 + crashImpact + effectivenessImpact);
    }

    /**
     * Calculate improvement metrics
     * @param {Object} before - Before metrics
     * @param {Object} after - After metrics
     * @returns {Object} Improvement calculations
     */
    calculateImprovement(before, after) {
        const cpuReduction = Math.max(0, ((before.cpuUsage - after.cpuUsage) / before.cpuUsage) * 100);
        const memoryReclaimed = Math.max(0, before.memoryUsage - after.memoryUsage);
        const responseTimeGain = Math.max(0, ((before.responseTime - after.responseTime) / before.responseTime) * 100);

        // Calculate overall efficiency score (0-100)
        const efficiencyScore = Math.min(100,
            (cpuReduction * 0.3) +
            (memoryReclaimed / 10 * 0.3) +
            (responseTimeGain * 0.4)
        );

        return {
            cpuReduction: Math.round(cpuReduction * 100) / 100,
            memoryReclaimed: Math.round(memoryReclaimed),
            responseTimeGain: Math.round(responseTimeGain * 100) / 100,
            efficiencyScore: Math.round(efficiencyScore * 100) / 100
        };
    }

    /**
     * Emit narrative events for optimization consequences
     * @param {Object} strategy - Strategy used
     * @param {Array} sideEffects - Side effects from optimization
     * @param {Object} improvement - Improvement metrics
     */
    async emitNarrativeEvents(strategy, sideEffects, improvement) {
        if (!this.eventEmitter) return;

        // Main optimization event
        this.eventEmitter.emit('process_optimized', {
            processId: this.processId,
            characterId: this.characterId,
            strategy: strategy.constructor.name,
            sideEffects: sideEffects.map(effect => effect.type),
            improvement,
            timestamp: Date.now()
        });

        // Specific side effect events
        for (const effect of sideEffects) {
            switch (effect.type) {
                case 'memory_merge':
                    this.eventEmitter.emit('memory_merged', {
                        characterId: this.characterId,
                        originalMemories: effect.originalMemories || [],
                        mergedMemory: effect.mergedMemory || null,
                        emotionalImpact: effect.emotionalImpact || 'reduced_intensity',
                        timestamp: Date.now()
                    });
                    break;

                case 'emotion_suppression':
                    this.eventEmitter.emit('emotion_suppressed', {
                        characterId: this.characterId,
                        emotion: effect.emotion || 'unknown',
                        suppressionLevel: effect.suppressionLevel || 0.3,
                        consequence: effect.consequence || 'delayed_processing',
                        timestamp: Date.now()
                    });
                    break;

                case 'cache_invalidation':
                    this.eventEmitter.emit('cache_invalidated', {
                        characterId: this.characterId,
                        cacheType: effect.cacheType || 'memory',
                        impact: effect.impact || 'temporary_slowdown',
                        timestamp: Date.now()
                    });
                    break;
            }
        }
    }

    /**
     * Calculate narrative impact of optimization
     * @param {Array} sideEffects - Side effects from optimization
     * @returns {Object} Narrative impact assessment
     */
    calculateNarrativeImpact(sideEffects) {
        const immediate = ['reduced_processing_load'];
        const delayed = [];

        for (const effect of sideEffects) {
            switch (effect.type) {
                case 'memory_merge':
                    delayed.push('possible_memory_loss');
                    break;
                case 'emotion_suppression':
                    delayed.push('possible_emotional_numbness');
                    break;
                case 'cache_invalidation':
                    immediate.push('temporary_performance_dip');
                    break;
                case 'thread_rebalancing':
                    immediate.push('improved_parallel_processing');
                    break;
            }
        }

        return { immediate, delayed };
    }
}
