// MemoryManager.js - Manages consciousness memory allocation, retrieval, and emotional associations

class MemoryManager {
    constructor(consciousnessInstance) {
        this.consciousness = consciousnessInstance;
        this.memorySegments = new Map();
        this.emotionalIndexes = new Map();
        this.memoryPools = {
            shortTerm: new Map(),
            longTerm: new Map(),
            traumatic: new Map(),
            suppressed: new Map(),
            procedural: new Map()
        };
        this.fragmentationLevel = 0;
        this.compressionRatio = 1.0;
        this.leakDetector = new MemoryLeakDetector(this);
        this.accessPatterns = new Map();
        this.memoryCapacity = {
            total: 10000,
            allocated: 0,
            available: 10000,
            reserved: 1000
        };
    }

    // Allocate memory for new emotional experience
    allocateMemory(memoryData, type = 'shortTerm') {
        const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const memorySize = this.calculateMemorySize(memoryData);
        
        // Check if allocation is possible
        if (this.memoryCapacity.available < memorySize) {
            this.triggerMemoryPressure();
            return null;
        }
        
        const memoryBlock = this.createMemoryBlock(memoryId, memoryData, type, memorySize);
        
        // Store in appropriate pool
        this.memoryPools[type].set(memoryId, memoryBlock);
        this.memorySegments.set(memoryId, memoryBlock);
        
        // Update capacity tracking
        this.memoryCapacity.allocated += memorySize;
        this.memoryCapacity.available -= memorySize;
        
        // Create emotional indexes
        this.createEmotionalIndexes(memoryBlock);
        
        // Log allocation
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'debug',
            message: `Allocated ${memorySize} units for ${type} memory: ${memoryId}`,
            category: 'memory_management',
            memoryId: memoryId
        });
        
        return memoryId;
    }

    // Create memory block structure
    createMemoryBlock(id, data, type, size) {
        return {
            id: id,
            type: type,
            size: size,
            data: data,
            createdAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 0,
            emotionalCharge: data.emotionalIntensity || 0,
            associatedEmotions: data.emotions || [],
            
            // Memory metadata
            fragmented: false,
            compressed: false,
            corrupted: false,
            protected: type === 'traumatic',
            
            // Access patterns
            accessHistory: [],
            associatedMemories: new Set(),
            triggerPatterns: [],
            
            // Debugging info
            allocationStack: this.getCurrentStack(),
            debuggable: true,
            
            // Memory health
            integrityScore: 1.0,
            coherenceLevel: 1.0,
            emotionalStability: 1.0,
            
            // Content structure for different memory types
            content: this.structureMemoryContent(data, type)
        };
    }

    // Structure memory content based on type
    structureMemoryContent(data, type) {
        const baseContent = {
            narrative: data.description || '',
            sensoryData: data.sensoryDetails || {},
            contextualInfo: data.context || {},
            temporalMarkers: data.timeStamp || Date.now()
        };

        switch(type) {
            case 'traumatic':
                return {
                    ...baseContent,
                    triggerWarnings: data.triggers || [],
                    avoidancePatterns: data.avoidancePatterns || [],
                    flashbackPotential: data.flashbackRisk || 0.5,
                    dissociationLevel: data.dissociationLevel || 0,
                    processingStatus: 'unprocessed',
                    therapeuticNotes: []
                };
                
            case 'procedural':
                return {
                    ...baseContent,
                    skillLevel: data.skillLevel || 0,
                    steps: data.procedureSteps || [],
                    muscleMemory: data.muscleMemory || 0,
                    automaticity: data.automaticity || 0,
                    errorPatterns: data.commonErrors || []
                };
                
            case 'suppressed':
                return {
                    ...baseContent,
                    suppressionReason: data.suppressionReason || 'unknown',
                    suppressionStrength: data.suppressionStrength || 0.7,
                    leakageEvents: [],
                    recoveryTriggers: data.recoveryTriggers || [],
                    originalEmotionalCharge: data.originalIntensity || 0
                };
                
            default:
                return baseContent;
        }
    }

    // Calculate memory size based on content and emotional significance
    calculateMemorySize(data) {
        let baseSize = 50; // Base memory allocation
        
        // Size factors
        if (data.description) baseSize += data.description.length * 0.5;
        if (data.sensoryDetails) baseSize += Object.keys(data.sensoryDetails).length * 10;
        if (data.emotionalIntensity) baseSize += data.emotionalIntensity * 30;
        if (data.context) baseSize += JSON.stringify(data.context).length * 0.3;
        
        // Emotional significance multiplier
        const emotionalMultiplier = 1 + (data.emotionalIntensity || 0);
        
        return Math.ceil(baseSize * emotionalMultiplier);
    }

    // Create emotional indexes for quick retrieval
    createEmotionalIndexes(memoryBlock) {
        memoryBlock.associatedEmotions.forEach(emotion => {
            if (!this.emotionalIndexes.has(emotion)) {
                this.emotionalIndexes.set(emotion, new Set());
            }
            this.emotionalIndexes.get(emotion).add(memoryBlock.id);
        });
        
        // Create intensity-based indexes
        const intensityRange = this.getIntensityRange(memoryBlock.emotionalCharge);
        if (!this.emotionalIndexes.has(`intensity_${intensityRange}`)) {
            this.emotionalIndexes.set(`intensity_${intensityRange}`, new Set());
        }
        this.emotionalIndexes.get(`intensity_${intensityRange}`).add(memoryBlock.id);
    }

    // Get intensity range for indexing
    getIntensityRange(intensity) {
        if (intensity < 0.3) return 'low';
        if (intensity < 0.7) return 'medium';
        return 'high';
    }

    // Retrieve memories by emotional association
    retrieveMemoriesByEmotion(emotion, limit = 10) {
        const memoryIds = this.emotionalIndexes.get(emotion) || new Set();
        const memories = Array.from(memoryIds)
            .map(id => this.memorySegments.get(id))
            .filter(mem => mem && !mem.corrupted)
            .sort((a, b) => b.emotionalCharge - a.emotionalCharge)
            .slice(0, limit);
        
        // Update access patterns
        memories.forEach(memory => this.updateAccessPattern(memory));
        
        return memories.map(mem => this.createMemoryRetrieval(mem));
    }

    // Update memory access patterns
    updateAccessPattern(memory) {
        memory.lastAccessed = Date.now();
        memory.accessCount++;
        memory.accessHistory.push({
            timestamp: Date.now(),
            context: this.getCurrentContext()
        });
        
        // Track access patterns for debugging
        const pattern = this.accessPatterns.get(memory.id) || {
            frequency: 0,
            intervals: [],
            contexts: []
        };
        
        pattern.frequency++;
        if (pattern.lastAccess) {
            pattern.intervals.push(Date.now() - pattern.lastAccess);
        }
        pattern.lastAccess = Date.now();
        pattern.contexts.push(this.getCurrentContext());
        
        this.accessPatterns.set(memory.id, pattern);
    }

    // Create memory retrieval object
    createMemoryRetrieval(memory) {
        return {
            id: memory.id,
            type: memory.type,
            content: memory.content,
            emotionalCharge: memory.emotionalCharge,
            createdAt: memory.createdAt,
            accessCount: memory.accessCount,
            associatedEmotions: memory.associatedEmotions,
            integrityScore: memory.integrityScore,
            coherenceLevel: memory.coherenceLevel,
            debugInfo: memory.debuggable ? {
                fragmented: memory.fragmented,
                compressed: memory.compressed,
                size: memory.size,
                allocationStack: memory.allocationStack
            } : null
        };
    }

    // Process memory consolidation (short-term to long-term)
    processMemoryConsolidation() {
        const shortTermMemories = Array.from(this.memoryPools.shortTerm.values());
        const consolidationCandidates = shortTermMemories.filter(memory => 
            this.shouldConsolidate(memory)
        );
        
        consolidationCandidates.forEach(memory => {
            this.consolidateMemory(memory);
        });
        
        return consolidationCandidates.length;
    }

    // Check if memory should be consolidated
    shouldConsolidate(memory) {
        const age = Date.now() - memory.createdAt;
        const accessThreshold = 3;
        const ageThreshold = 300000; // 5 minutes
        const emotionalThreshold = 0.6;
        
        return (
            age > ageThreshold ||
            memory.accessCount >= accessThreshold ||
            memory.emotionalCharge > emotionalThreshold
        );
    }

    // Consolidate memory from short-term to long-term
    consolidateMemory(memory) {
        // Remove from short-term
        this.memoryPools.shortTerm.delete(memory.id);
        
        // Process for long-term storage
        memory.type = 'longTerm';
        memory.consolidated = true;
        memory.consolidationTime = Date.now();
        
        // Apply compression if needed
        if (memory.size > 200) {
            this.compressMemory(memory);
        }
        
        // Store in long-term pool
        this.memoryPools.longTerm.set(memory.id, memory);
        
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'info',
            message: `Memory ${memory.id} consolidated to long-term storage`,
            category: 'memory_consolidation',
            memoryId: memory.id
        });
    }

    // Compress memory to save space
    compressMemory(memory) {
        const originalSize = memory.size;
        
        // Compress narrative content
        if (memory.content.narrative) {
            memory.content.narrative = this.compressNarrative(memory.content.narrative);
        }
        
        // Reduce sensory detail granularity
        if (memory.content.sensoryData) {
            memory.content.sensoryData = this.compressSensoryData(memory.content.sensoryData);
        }
        
        // Calculate new size
        memory.size = Math.ceil(originalSize * this.compressionRatio);
        memory.compressed = true;
        memory.originalSize = originalSize;
        
        // Slightly reduce coherence due to compression
        memory.coherenceLevel *= 0.95;
    }

    // Compress narrative content
    compressNarrative(narrative) {
        // Simple compression: remove redundant words, compress repetitive phrases
        return narrative
            .replace(/\s+/g, ' ')
            .replace(/(.{10,}?)\1+/g, '$1[REPEAT]')
            .trim();
    }

    // Compress sensory data
    compressSensoryData(sensoryData) {
        const compressed = {};
        Object.entries(sensoryData).forEach(([sense, data]) => {
            if (typeof data === 'object') {
                // Keep only high-intensity sensory details
                compressed[sense] = Object.fromEntries(
                    Object.entries(data).filter(([key, value]) => 
                        typeof value === 'number' ? value > 0.5 : true
                    )
                );
            } else {
                compressed[sense] = data;
            }
        });
        return compressed;
    }

    // Handle memory pressure situations
    triggerMemoryPressure() {
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'warning',
            message: 'Memory pressure detected - initiating cleanup procedures',
            category: 'memory_pressure'
        });
        
        // Try garbage collection first
        const freedSpace = this.garbageCollect();
        
        if (this.memoryCapacity.available < 500) {
            // Emergency memory management
            this.emergencyMemoryCleanup();
        }
        
        // Trigger narrative event for memory pressure
        this.consciousness.narrativeEngine.checkTriggers('memory_pressure', {
            availableMemory: this.memoryCapacity.available,
            freedSpace: freedSpace
        });
    }

    // Garbage collection for unused memories
    garbageCollect() {
        let freedSpace = 0;
        const currentTime = Date.now();
        const inactivityThreshold = 600000; // 10 minutes
        
        // Clean up short-term memories that haven't been accessed
        Array.from(this.memoryPools.shortTerm.values()).forEach(memory => {
            if (currentTime - memory.lastAccessed > inactivityThreshold && 
                memory.accessCount < 2 && 
                memory.emotionalCharge < 0.3) {
                
                freedSpace += memory.size;
                this.deallocateMemory(memory.id);
            }
        });
        
        // Compress old long-term memories
        Array.from(this.memoryPools.longTerm.values()).forEach(memory => {
            if (!memory.compressed && currentTime - memory.createdAt > 1800000) { // 30 minutes
                this.compressMemory(memory);
            }
        });
        
        this.updateMemoryCapacity();
        return freedSpace;
    }

    // Emergency memory cleanup
    emergencyMemoryCleanup() {
        let targetFreed = this.memoryCapacity.total * 0.2; // Free 20% of total capacity
        let freedSpace = 0;
        
        // Priority cleanup order: least accessed, oldest, lowest emotional significance
        const allMemories = Array.from(this.memorySegments.values())
            .filter(mem => mem.type !== 'traumatic' && !mem.protected)
            .sort((a, b) => {
                const scoreA = this.calculateCleanupPriority(a);
                const scoreB = this.calculateCleanupPriority(b);
                return scoreA - scoreB;
            });
        
        for (const memory of allMemories) {
            if (freedSpace >= targetFreed) break;
            
            if (memory.type === 'shortTerm' || 
                (memory.type === 'longTerm' && memory.emotionalCharge < 0.4)) {
                freedSpace += memory.size;
                this.deallocateMemory(memory.id);
            }
        }
        
        this.consciousness.systemLog.push({
            timestamp: Date.now(),
            level: 'warning',
            message: `Emergency cleanup freed ${freedSpace} memory units`,
            category: 'emergency_cleanup'
        });
    }

    // Calculate cleanup priority (lower = cleanup first)
    calculateCleanupPriority(memory) {
        const accessWeight = memory.accessCount * 0.3;
        const ageWeight = (Date.now() - memory.createdAt) / 1000000; // Age in relative units
        const emotionalWeight = memory.emotionalCharge * 0.4;
        
        return accessWeight + emotionalWeight - ageWeight;
    }

    // Deallocate memory
    deallocateMemory(memoryId) {
        const memory = this.memorySegments.get(memoryId);
        if (!memory) return false;
        
        // Remove from appropriate pool
        Object.values(this.memoryPools).forEach(pool => {
            pool.delete(memoryId);
        });
        
        // Remove from main segments
        this.memorySegments.delete(memoryId);
        
        // Clean up emotional indexes
        memory.associatedEmotions.forEach(emotion => {
            const emotionSet = this.emotionalIndexes.get(emotion);
            if (emotionSet) {
                emotionSet.delete(memoryId);
                if (emotionSet.size === 0) {
                    this.emotionalIndexes.delete(emotion);
                }
            }
        });
        
        // Update capacity
        this.memoryCapacity.allocated -= memory.size;
        this.memoryCapacity.available += memory.size;
        
        return true;
    }

    // Detect memory corruption and fragmentation
    runMemoryDiagnostics() {
        const diagnostics = {
            corruptedMemories: [],
            fragmentedMemories: [],
            leakedMemories: [],
            inconsistentIndexes: [],
            recommendations: []
        };
        
        // Check for corruption
        this.memorySegments.forEach((memory, id) => {
            if (this.detectCorruption(memory)) {
                diagnostics.corruptedMemories.push({
                    id: id,
                    type: memory.type,
                    corruptionType: this.identifyCorruptionType(memory)
                });
            }
            
            if (this.detectFragmentation(memory)) {
                diagnostics.fragmentedMemories.push({
                    id: id,
                    fragmentationLevel: this.calculateFragmentation(memory)
                });
            }
        });
        
        // Run leak detection
        diagnostics.leakedMemories = this.leakDetector.detectLeaks();
        
        // Check index consistency
        diagnostics.inconsistentIndexes = this.validateIndexes();
        
        // Generate recommendations
        diagnostics.recommendations = this.generateDiagnosticRecommendations(diagnostics);
        
        return diagnostics;
    }

    // Detect memory corruption
    detectCorruption(memory) {
        // Check for invalid data structures
        if (!memory.content || typeof memory.content !== 'object') return true;
        
        // Check integrity score
        if (memory.integrityScore < 0.5) return true;
        
        // Check for temporal inconsistencies
        if (memory.lastAccessed < memory.createdAt) return true;
        
        // Check emotional charge consistency
        if (memory.emotionalCharge < 0 || memory.emotionalCharge > 1) return true;
        
        return false;
    }

    // Identify corruption type
    identifyCorruptionType(memory) {
        if (!memory.content) return 'missing_content';
        if (memory.integrityScore < 0.3) return 'severe_degradation';
        if (memory.lastAccessed < memory.createdAt) return 'temporal_inconsistency';
        if (memory.emotionalCharge < 0 || memory.emotionalCharge > 1) return 'emotional_overflow';
        return 'unknown_corruption';
    }

    // Player memory debugging interventions
    repairMemoryCorruption(memoryId, repairMethod) {
        const memory = this.memorySegments.get(memoryId);
        if (!memory) {
            return { success: false, message: 'Memory not found' };
        }
        
        let repairSuccess = false;
        
        switch(repairMethod) {
            case 'restore_backup':
                repairSuccess = this.restoreMemoryBackup(memory);
                break;
            case 'rebuild_indexes':
                repairSuccess = this.rebuildMemoryIndexes(memory);
                break;
            case 'defragment':
                repairSuccess = this.defragmentMemory(memory);
                break;
            case 'emotional_recalibration':
                repairSuccess = this.recalibrateEmotionalCharge(memory);
                break;
        }
        
        if (repairSuccess) {
            memory.integrityScore = Math.min(1.0, memory.integrityScore + 0.3);
            memory.coherenceLevel = Math.min(1.0, memory.coherenceLevel + 0.2);
            
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'info',
                message: `Memory ${memoryId} successfully repaired using ${repairMethod}`,
                category: 'memory_repair',
                memoryId: memoryId
            });
            
            return { 
                success: true, 
                message: 'Memory repair successful',
                newIntegrityScore: memory.integrityScore
            };
        }
        
        return { success: false, message: 'Repair method failed' };
    }

    // Restore memory backup (simplified)
    restoreMemoryBackup(memory) {
        if (memory.originalSize) {
            // Restore from compressed state
            memory.size = memory.originalSize;
            memory.compressed = false;
            return true;
        }
        return false;
    }

    // Rebuild memory indexes
    rebuildMemoryIndexes(memory) {
        // Remove old indexes
        memory.associatedEmotions.forEach(emotion => {
            const emotionSet = this.emotionalIndexes.get(emotion);
            if (emotionSet) {
                emotionSet.delete(memory.id);
            }
        });
        
        // Recreate indexes
        this.createEmotionalIndexes(memory);
        return true;
    }

    // Get current context for access tracking
    getCurrentContext() {
        return {
            activeProcesses: this.consciousness.processManager.getActiveProcessCount(),
            emotionalState: this.consciousness.emotionalProcessor.getCurrentState(),
            stressLevel: this.consciousness.emotionalProcessor.getStressLevel()
        };
    }

    // Get current stack for debugging
    getCurrentStack() {
        return new Error().stack;
    }

    // Update memory capacity tracking
    updateMemoryCapacity() {
        const totalAllocated = Array.from(this.memorySegments.values())
            .reduce((sum, mem) => sum + mem.size, 0);
        
        this.memoryCapacity.allocated = totalAllocated;
        this.memoryCapacity.available = this.memoryCapacity.total - totalAllocated - this.memoryCapacity.reserved;
    }

    // Get memory status for frontend
    getMemoryStatus() {
        return {
            capacity: this.memoryCapacity,
            pools: {
                shortTerm: this.memoryPools.shortTerm.size,
                longTerm: this.memoryPools.longTerm.size,
                traumatic: this.memoryPools.traumatic.size,
                suppressed: this.memoryPools.suppressed.size,
                procedural: this.memoryPools.procedural.size
            },
            fragmentationLevel: this.fragmentationLevel,
            compressionRatio: this.compressionRatio,
            totalMemories: this.memorySegments.size,
            emotionalIndexCount: this.emotionalIndexes.size
        };
    }

    // Get debuggable memory issues
    getDebuggableMemoryIssues() {
        const diagnostics = this.runMemoryDiagnostics();
        
        return {
            corruptedMemories: diagnostics.corruptedMemories.map(issue => ({
                ...issue,
                memory: this.createMemoryRetrieval(this.memorySegments.get(issue.id)),
                repairMethods: this.getAvailableRepairMethods(issue.corruptionType)
            })),
            fragmentedMemories: diagnostics.fragmentedMemories.map(issue => ({
                ...issue,
                memory: this.createMemoryRetrieval(this.memorySegments.get(issue.id)),
                defragmentationOptions: ['defragment', 'compress', 'rebuild_indexes']
            })),
            leakedMemories: diagnostics.leakedMemories,
            recommendations: diagnostics.recommendations
        };
    }

    // Get available repair methods for corruption type
    getAvailableRepairMethods(corruptionType) {
        const repairMethods = {
            'missing_content': ['restore_backup'],
            'severe_degradation': ['restore_backup', 'rebuild_indexes'],
            'temporal_inconsistency': ['emotional_recalibration'],
            'emotional_overflow': ['emotional_recalibration'],
            'unknown_corruption': ['restore_backup', 'rebuild_indexes', 'defragment']
        };
        
        return repairMethods[corruptionType] || ['restore_backup'];
    }
}

// Memory Leak Detector Helper Class
class MemoryLeakDetector {
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
        this.allocationHistory = [];
        this.suspiciousPatterns = [];
    }
    
    detectLeaks() {
        const leaks = [];
        const currentTime = Date.now();
        
        // Look for memories that should have been deallocated
        this.memoryManager.memorySegments.forEach((memory, id) => {
            const pattern = this.memoryManager.accessPatterns.get(id);
            
            if (pattern && this.isLeakCandidate(memory, pattern, currentTime)) {
                leaks.push({
                    id: id,
                    type: 'potential_leak',
                    age: currentTime - memory.createdAt,
                    accessCount: memory.accessCount,
                    size: memory.size,
                    leakScore: this.calculateLeakScore(memory, pattern)
                });
            }
        });
        
        return leaks.sort((a, b) => b.leakScore - a.leakScore);
    }
    
    isLeakCandidate(memory, pattern, currentTime) {
        const age = currentTime - memory.createdAt;
        const timeSinceLastAccess = currentTime - memory.lastAccessed;
        
        // Criteria for leak suspicion
        return (
            age > 1800000 && // Older than 30 minutes
            timeSinceLastAccess > 600000 && // Not accessed in 10 minutes
            memory.accessCount < 3 && // Low access count
            memory.emotionalCharge < 0.3 && // Low emotional significance
            memory.type === 'shortTerm' // Should have been consolidated or cleaned
        );
    }
    
    calculateLeakScore(memory, pattern) {
        const ageWeight = (Date.now() - memory.createdAt) / 1000000;
        const accessWeight = 1 / (memory.accessCount + 1);
        const sizeWeight = memory.size / 100;
        const emotionalWeight = 1 - memory.emotionalCharge;        
        return ageWeight + accessWeight + sizeWeight + emotionalWeight;
    }
}

export default MemoryManager;