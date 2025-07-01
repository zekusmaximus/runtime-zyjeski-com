// AllocateMemoryCommand.js - Command to allocate memory resources to mental processes
// Implements the Command pattern with strategy-based allocation and full undo capability

import { DebugCommand } from './base/DebugCommand.js';
import { MemoryCalculator } from '../memory/MemoryCalculator.js';

/**
 * Command to allocate memory to a process in the consciousness system.
 * Implements the Command pattern with strategy-based allocation approaches:
 * - Focused allocation for concentrated processing
 * - Distributed allocation across related processes
 * - Dynamic allocation based on adaptive needs
 * - Emergency allocation with reclamation from non-critical processes
 */
export class AllocateMemoryCommand extends DebugCommand {
    /**
     * Create a new allocate memory command
     * @param {Object} params - Command parameters
     * @param {number} params.processId - The ID of the process to allocate memory to
     * @param {string} params.characterId - Character being helped
     * @param {number} params.size - Memory size in MB
     * @param {string} params.strategy - Allocation strategy ('focused', 'distributed', 'dynamic', 'emergency')
     * @param {string} params.priority - Allocation priority ('low', 'normal', 'high', 'critical')
     * @param {Object} params.source - Memory source configuration
     * @param {string} params.source.type - Source type ('free', 'reclaim', 'redistribute')
     * @param {number[]} [params.source.targetProcesses] - Target processes for redistribution
     * @param {number} [params.duration] - Optional duration in ms (0 or undefined = permanent)
     * @param {boolean} [params.force] - Optional: override safety checks
     * @param {Object} dependencies - Injected dependencies
     * @param {Object} dependencies.memoryManager - The memory manager instance
     * @param {Object} dependencies.memoryCalculator - The memory calculator utility
     * @param {Object} dependencies.consciousnessEngine - The consciousness engine instance
     * @param {Object} dependencies.eventEmitter - Event emitter for narrative events
     */
    constructor(params, dependencies) {
        super({ ...params, ...dependencies });
        
        // Validate required parameters
        if (!params.processId) {
            throw new Error('processId is required for AllocateMemoryCommand');
        }
        if (!params.characterId) {
            throw new Error('characterId is required for AllocateMemoryCommand');
        }
        if (!params.size || params.size <= 0) {
            throw new Error('size must be a positive number for AllocateMemoryCommand');
        }
        if (!params.strategy) {
            throw new Error('strategy is required for AllocateMemoryCommand');
        }
        if (!params.source || !params.source.type) {
            throw new Error('source.type is required for AllocateMemoryCommand');
        }
        
        // Store parameters
        this.processId = params.processId;
        this.characterId = params.characterId;
        this.size = params.size;
        this.strategy = params.strategy;
        this.priority = params.priority || 'normal';
        this.source = params.source;
        this.duration = params.duration || 0; // 0 = permanent
        this.force = params.force || false;
        
        // Store dependencies
        this.memoryManager = dependencies.memoryManager;
        this.memoryCalculator = dependencies.memoryCalculator || MemoryCalculator;
        this.consciousnessEngine = dependencies.consciousnessEngine;
        this.eventEmitter = dependencies.eventEmitter;
        
        // Strategy handlers
        this.strategies = {
            focused: this._handleFocusedAllocation.bind(this),
            distributed: this._handleDistributedAllocation.bind(this),
            dynamic: this._handleDynamicAllocation.bind(this),
            emergency: this._handleEmergencyAllocation.bind(this)
        };
        
        // Safety constants
        this.SAFETY_CONSTANTS = {
            MIN_FREE_MEMORY: 256, // 256MB in MB
            MAX_ALLOCATION_PERCENT: 0.4, // 40% of total
            CRITICAL_FRAGMENTATION: 0.6, // 60% threshold
            DEFRAG_TRIGGER: 0.5, // 50% auto-defrag
            CRITICAL_PROCESSES: [
                'System_Core.exe',
                'Reality_Anchor.dll', 
                'Self_Identity.exe'
            ]
        };
        
        // State for undo
        this.allocationSnapshot = null;
        this.memorySnapshot = null;
        this.affectedProcesses = [];
        this.allocationResult = null;
    }

    /**
     * Check if the memory allocation can be performed
     * @returns {Promise<boolean>} True if allocation can be performed
     */
    async canExecute() {
        // Validate strategy
        if (!this.strategies[this.strategy]) {
            throw new Error(`Invalid allocation strategy: ${this.strategy}. Must be one of: ${Object.keys(this.strategies).join(', ')}`);
        }
        
        // Get target process
        const instance = this.consciousnessEngine.instances.get(this.characterId);
        if (!instance) {
            throw new Error(`Character not found: ${this.characterId}`);
        }
        
        const process = instance.processManager.processes.get(this.processId);
        if (!process) {
            throw new Error(`Process ${this.processId} not found`);
        }
        
        if (process.status === 'terminated') {
            throw new Error(`Cannot allocate memory to terminated process ${this.processId}`);
        }
        
        // Get memory state
        const memoryState = this._getMemoryState();
        
        // Validate allocation size bounds
        if (this.size < 64) {
            throw new Error(`Allocation size ${this.size}MB is below minimum (64MB)`);
        }
        
        if (this.size > memoryState.total * this.SAFETY_CONSTANTS.MAX_ALLOCATION_PERCENT) {
            throw new Error(`Allocation size ${this.size}MB exceeds maximum allowed (${Math.round(memoryState.total * this.SAFETY_CONSTANTS.MAX_ALLOCATION_PERCENT)}MB)`);
        }
        
        // Check if allocation is valid (unless forced)
        if (!this.force) {
            const isValid = this.memoryCalculator.validateAllocation(this.size, memoryState.available, {
                minReserve: this.SAFETY_CONSTANTS.MIN_FREE_MEMORY,
                maxAllocationPercent: this.SAFETY_CONSTANTS.MAX_ALLOCATION_PERCENT,
                totalMemory: memoryState.total
            });
            
            if (!isValid) {
                throw new Error(`Memory allocation validation failed: insufficient memory or safety constraints violated`);
            }
            
            // Check predicted fragmentation
            const predictedFragmentation = this.memoryCalculator.predictFragmentation(
                { size: this.size, strategy: this.strategy },
                { 
                    allocations: memoryState.allocations,
                    totalMemory: memoryState.total,
                    fragmentation: memoryState.fragmentation
                }
            );
            
            if (predictedFragmentation > this.SAFETY_CONSTANTS.CRITICAL_FRAGMENTATION * 100) {
                throw new Error(`Allocation would cause critical fragmentation (${Math.round(predictedFragmentation)}%)`);
            }
        }
        
        return true;
    }

    /**
     * Execute the allocate memory command
     * @returns {Promise<Object>} Result of the allocation operation
     */
    async execute() {
        const startTime = Date.now();
        
        if (!await this.canExecute()) {
            throw new Error(`Cannot execute memory allocation for process ${this.processId}`);
        }

        // Get current state for undo
        this.memorySnapshot = this._captureMemorySnapshot();

        // Get target process
        const instance = this.consciousnessEngine.instances.get(this.characterId);
        const process = instance.processManager.processes.get(this.processId);

        // Capture original process state for undo
        const originalProcessState = JSON.parse(JSON.stringify(process));
        
        // Calculate optimal allocation size
        const optimalSize = this.memoryCalculator.findOptimalBlockSize(this.size, 64);
        
        // Execute allocation strategy
        const strategyHandler = this.strategies[this.strategy];
        const allocationData = await strategyHandler(process, optimalSize);
        
        // Create allocation record
        const allocation = {
            id: `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            processId: this.processId,
            size: allocationData.actualSize,
            address: this._generateMemoryAddress(),
            strategy: this.strategy,
            timestamp: new Date(),
            duration: this.duration,
            priority: this.priority
        };
        
        // Update memory state
        this._updateMemoryState(allocation, allocationData);
        
        // Calculate impact
        const impact = this._calculateAllocationImpact(allocation);
        
        // Emit events
        await this._emitAllocationEvents(allocation, impact);
        
        // Store allocation snapshot for undo
        this.allocationSnapshot = { ...allocation };
        this.affectedProcesses = allocationData.affectedProcesses || [];
        this.originalProcessState = originalProcessState;
        
        this.executed = true;
        this.timestamp = Date.now();
        this.allocationResult = {
            success: true,
            allocation,
            impact,
            warnings: allocationData.warnings || [],
            narrativeEvents: allocationData.narrativeEvents || [],
            undoData: {
                previousAllocations: new Map(this.memorySnapshot.allocations),
                freedMemory: allocationData.freedMemory || 0,
                sourceProcessStates: this.affectedProcesses.map(p => ({ ...p }))
            },
            executionTime: Date.now() - startTime
        };
        
        this.result = this.allocationResult;
        return this.result;
    }

    /**
     * Undo the allocate memory command (restore previous memory state)
     * @returns {Promise<Object>} Result of the undo operation
     */
    async undo() {
        if (!this.executed || !this.allocationSnapshot) {
            throw new Error('Nothing to undo: command was not executed or allocation state not stored');
        }

        // Restore memory state
        if (this.memorySnapshot) {
            this._restoreMemoryState(this.memorySnapshot);
        }

        // Restore original process state
        if (this.originalProcessState) {
            const instance = this.consciousnessEngine.instances.get(this.characterId);
            const process = instance.processManager.processes.get(this.processId);
            if (process) {
                Object.assign(process, this.originalProcessState);
            }
        }

        // Emit undo events
        if (this.eventEmitter) {
            this.eventEmitter.emit('memory_allocation_undone', {
                processId: this.processId,
                characterId: this.characterId,
                allocationId: this.allocationSnapshot.id,
                size: this.allocationSnapshot.size,
                timestamp: Date.now()
            });
        }

        this.executed = false;
        this.result = {
            success: true,
            processId: this.processId,
            message: `Memory allocation ${this.allocationSnapshot.id} undone`,
            timestamp: Date.now(),
            restoredState: {
                availableMemory: this.memorySnapshot.available,
                allocatedMemory: this.memorySnapshot.allocated,
                fragmentation: this.memorySnapshot.fragmentation
            }
        };

        return this.result;
    }

    /**
     * Check if the command can be undone
     * @returns {boolean} True if command can be undone
     */
    canUndo() {
        return this.executed && this.allocationSnapshot !== null;
    }

    /**
     * Get a human-readable description of what this command does
     * @returns {string} Command description
     */
    getDescription() {
        const durationDesc = this.duration > 0 ? ` for ${this.duration}ms` : ' permanently';
        const forceDesc = this.force ? ' (forced)' : '';
        return `Allocate ${this.size}MB memory to process ${this.processId} using ${this.strategy} strategy${durationDesc}${forceDesc}`;
    }

    /**
     * Handle focused allocation strategy
     * @private
     * @param {Object} process - Target process
     * @param {number} size - Allocation size
     * @returns {Promise<Object>} Allocation result
     */
    async _handleFocusedAllocation(process, size) {
        // Concentrated allocation to single process
        // High efficiency (0.9), low fragmentation (0.1)
        const efficiency = 0.9;
        const actualSize = Math.round(size * efficiency);

        // Update process memory
        process.memoryUsage = (process.memoryUsage || 0) + actualSize;
        process.allocationEfficiency = efficiency;
        process.lastMemoryAllocation = Date.now();

        return {
            actualSize,
            efficiency,
            fragmentationImpact: 0.1,
            affectedProcesses: [{ ...process }],
            warnings: actualSize < size ? [`Allocation reduced to ${actualSize}MB for efficiency`] : [],
            narrativeEvents: ['focused_attention_increased']
        };
    }

    /**
     * Handle distributed allocation strategy
     * @private
     * @param {Object} process - Target process
     * @param {number} size - Allocation size
     * @returns {Promise<Object>} Allocation result
     */
    async _handleDistributedAllocation(process, size) {
        // Spread across related processes
        // Medium efficiency (0.7), higher flexibility (0.8)
        const efficiency = 0.7;
        const flexibility = 0.8;
        const actualSize = Math.round(size * efficiency);

        // Find related processes
        const instance = this.consciousnessEngine.instances.get(this.characterId);
        const relatedProcesses = this._findRelatedProcesses(process, instance.processManager);

        // Distribute memory across processes
        const distributionSize = Math.round(actualSize * 0.3);
        const affectedProcesses = [{ ...process }];

        process.memoryUsage = (process.memoryUsage || 0) + (actualSize - distributionSize);

        for (const relatedProcess of relatedProcesses.slice(0, 2)) {
            const shareSize = Math.round(distributionSize / 2);
            relatedProcess.memoryUsage = (relatedProcess.memoryUsage || 0) + shareSize;
            affectedProcesses.push({ ...relatedProcess });
        }

        return {
            actualSize,
            efficiency,
            flexibility,
            fragmentationImpact: 0.3,
            affectedProcesses,
            warnings: [`Memory distributed across ${affectedProcesses.length} processes`],
            narrativeEvents: ['attention_distributed', 'cognitive_flexibility_increased']
        };
    }

    /**
     * Handle dynamic allocation strategy
     * @private
     * @param {Object} process - Target process
     * @param {number} size - Allocation size
     * @returns {Promise<Object>} Allocation result
     */
    async _handleDynamicAllocation(process, size) {
        // Adaptive based on process needs
        // Balanced efficiency (0.8), high flexibility (0.9)
        const baseEfficiency = 0.8;
        const flexibility = 0.9;

        // Adjust efficiency based on process state
        let efficiency = baseEfficiency;
        if (process.effectivenessScore > 0.8) {
            efficiency += 0.1; // Boost for high-performing processes
        }
        if (process.emotionalImpact > 0.7) {
            efficiency -= 0.1; // Reduce for emotionally intense processes
        }

        const actualSize = Math.round(size * efficiency);

        // Update process with adaptive parameters
        process.memoryUsage = (process.memoryUsage || 0) + actualSize;
        process.adaptiveAllocation = true;
        process.allocationEfficiency = efficiency;
        process.flexibilityScore = flexibility;

        return {
            actualSize,
            efficiency,
            flexibility,
            fragmentationImpact: 0.2,
            affectedProcesses: [{ ...process }],
            warnings: efficiency < baseEfficiency ? ['Efficiency reduced due to process state'] : [],
            narrativeEvents: ['adaptive_processing_enabled', 'cognitive_balance_improved']
        };
    }

    /**
     * Handle emergency allocation strategy
     * @private
     * @param {Object} process - Target process
     * @param {number} size - Allocation size
     * @returns {Promise<Object>} Allocation result
     */
    async _handleEmergencyAllocation(process, size) {
        // Reclaim from non-critical processes
        // Lower efficiency (0.6), crisis response
        const efficiency = 0.6;
        const actualSize = Math.round(size * efficiency);

        // Find non-critical processes to reclaim from
        const instance = this.consciousnessEngine.instances.get(this.characterId);
        const reclaimableProcesses = this._findReclaimableProcesses(instance.processManager);

        let freedMemory = 0;
        const affectedProcesses = [{ ...process }];

        // Reclaim memory from non-critical processes
        for (const reclaimProcess of reclaimableProcesses) {
            if (freedMemory >= actualSize) break;

            const reclaimAmount = Math.min(
                Math.round(reclaimProcess.memoryUsage * 0.3), // Reclaim up to 30%
                actualSize - freedMemory
            );

            if (reclaimAmount > 0) {
                reclaimProcess.memoryUsage -= reclaimAmount;
                freedMemory += reclaimAmount;
                affectedProcesses.push({ ...reclaimProcess });
            }
        }

        // Allocate reclaimed memory to target process
        process.memoryUsage = (process.memoryUsage || 0) + actualSize;
        process.emergencyAllocation = true;
        process.lastEmergencyAllocation = Date.now();

        return {
            actualSize,
            efficiency,
            fragmentationImpact: 0.5,
            freedMemory,
            affectedProcesses,
            warnings: [
                'Emergency allocation performed',
                `Reclaimed ${freedMemory}MB from ${affectedProcesses.length - 1} processes`
            ],
            narrativeEvents: ['emergency_response_activated', 'memory_crisis_managed']
        };
    }

    /**
     * Get current memory state
     * @private
     * @returns {Object} Memory state
     */
    _getMemoryState() {
        const memoryCapacity = this.memoryManager.memoryCapacity;
        const allocations = this.memoryManager.memorySegments;

        return {
            total: memoryCapacity.total,
            allocated: memoryCapacity.allocated,
            available: memoryCapacity.available,
            fragmentation: this.memoryManager.fragmentationLevel * 100,
            allocations: allocations
        };
    }

    /**
     * Capture complete memory snapshot for undo
     * @private
     * @returns {Object} Memory snapshot
     */
    _captureMemorySnapshot() {
        const memoryState = this._getMemoryState();
        return {
            ...memoryState,
            allocations: new Map(memoryState.allocations),
            timestamp: Date.now()
        };
    }

    /**
     * Update memory state after allocation
     * @private
     * @param {Object} allocation - Allocation record
     * @param {Object} allocationData - Allocation result data
     */
    _updateMemoryState(allocation, allocationData) {
        // Update memory capacity
        this.memoryManager.memoryCapacity.allocated += allocation.size;
        this.memoryManager.memoryCapacity.available -= allocation.size;

        // Add allocation to memory segments
        this.memoryManager.memorySegments.set(allocation.id, {
            id: allocation.id,
            processId: allocation.processId,
            size: allocation.size,
            address: allocation.address,
            strategy: allocation.strategy,
            timestamp: allocation.timestamp,
            type: 'process_allocation'
        });

        // Update fragmentation level
        const newFragmentation = this.memoryCalculator.calculateFragmentation(
            this.memoryManager.memorySegments,
            { totalMemory: this.memoryManager.memoryCapacity.total }
        );
        this.memoryManager.fragmentationLevel = newFragmentation / 100;
    }

    /**
     * Restore memory state for undo
     * @private
     * @param {Object} snapshot - Memory snapshot
     */
    _restoreMemoryState(snapshot) {
        // Restore memory capacity
        this.memoryManager.memoryCapacity.allocated = snapshot.allocated;
        this.memoryManager.memoryCapacity.available = snapshot.available;
        this.memoryManager.fragmentationLevel = snapshot.fragmentation / 100;

        // Restore memory segments
        this.memoryManager.memorySegments.clear();
        for (const [id, segment] of snapshot.allocations) {
            this.memoryManager.memorySegments.set(id, segment);
        }
    }

    /**
     * Calculate allocation impact
     * @private
     * @param {Object} allocation - Allocation record
     * @returns {Object} Impact assessment
     */
    _calculateAllocationImpact(allocation) {
        const memoryState = this._getMemoryState();

        return {
            fragmentation: memoryState.fragmentation,
            availableMemory: memoryState.available,
            affectedProcesses: this.affectedProcesses.map(p => ({
                id: p.id,
                name: p.name,
                memoryChange: p.memoryUsage - (p.originalMemoryUsage || p.memoryUsage)
            }))
        };
    }

    /**
     * Emit allocation events for narrative system
     * @private
     * @param {Object} allocation - Allocation record
     * @param {Object} impact - Allocation impact
     */
    async _emitAllocationEvents(allocation, impact) {
        if (!this.eventEmitter) return;

        // Main allocation event
        this.eventEmitter.emit('memory_allocated', {
            processId: this.processId,
            characterId: this.characterId,
            size: allocation.size,
            strategy: this.strategy,
            duration: this.duration
        });

        // Memory pressure events
        const memoryState = this._getMemoryState();
        const freePercentage = (memoryState.available / memoryState.total) * 100;

        if (freePercentage < 10) {
            this.eventEmitter.emit('memory_pressure', {
                characterId: this.characterId,
                level: 'critical',
                freeMemory: memoryState.available,
                recommendation: 'optimize_or_kill_processes'
            });
        } else if (freePercentage < 20) {
            this.eventEmitter.emit('memory_pressure', {
                characterId: this.characterId,
                level: 'high',
                freeMemory: memoryState.available,
                recommendation: 'optimize_or_kill_processes'
            });
        }

        // Attention shift events
        if (allocation.size > memoryState.total * 0.1) { // Significant allocation
            this.eventEmitter.emit('attention_shifted', {
                characterId: this.characterId,
                from: 'distributed_attention',
                to: `process_${this.processId}`,
                intensity: allocation.size / memoryState.total
            });
        }
    }

    /**
     * Generate memory address for allocation
     * @private
     * @returns {string} Hexadecimal memory address
     */
    _generateMemoryAddress() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 0xFFFF);
        return `0x${(timestamp & 0xFFFFFF).toString(16).toUpperCase()}${random.toString(16).toUpperCase().padStart(4, '0')}`;
    }

    /**
     * Find related processes for distributed allocation
     * @private
     * @param {Object} process - Target process
     * @param {Object} processManager - Process manager
     * @returns {Array} Related processes
     */
    _findRelatedProcesses(process, processManager) {
        const related = [];

        for (const [id, otherProcess] of processManager.processes) {
            if (id === process.id) continue;

            // Find processes with similar type or emotional source
            if (otherProcess.type === process.type ||
                (otherProcess.emotionSource && process.emotionSource &&
                 otherProcess.emotionSource.type === process.emotionSource.type)) {
                related.push(otherProcess);
            }
        }

        return related;
    }

    /**
     * Find processes that can have memory reclaimed
     * @private
     * @param {Object} processManager - Process manager
     * @returns {Array} Reclaimable processes
     */
    _findReclaimableProcesses(processManager) {
        const reclaimable = [];

        for (const [id, process] of processManager.processes) {
            // Skip critical processes
            if (this.SAFETY_CONSTANTS.CRITICAL_PROCESSES.includes(process.name)) {
                continue;
            }

            // Skip processes with high emotional impact
            if (process.emotionalImpact > 0.8) {
                continue;
            }

            // Skip processes with low memory usage
            if (process.memoryUsage < 100) {
                continue;
            }

            // Prefer processes with low effectiveness or high memory usage
            if (process.effectivenessScore < 0.6 || process.memoryUsage > 500) {
                reclaimable.push(process);
            }
        }

        // Sort by priority (low effectiveness first, then high memory usage)
        return reclaimable.sort((a, b) => {
            const aScore = a.effectivenessScore + (a.memoryUsage / 1000);
            const bScore = b.effectivenessScore + (b.memoryUsage / 1000);
            return aScore - bScore;
        });
    }
}
