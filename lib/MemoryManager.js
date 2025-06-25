// MemoryManager.js - Manages consciousness memory allocation, retrieval, and emotional associations

class MemoryManager {
    constructor(consciousnessInstance, memoryMapConfig = {}) {
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
            total: memoryMapConfig.totalCapacity || 10000,
            allocated: 0,
            available: memoryMapConfig.totalCapacity || 10000,
            reserved: memoryMapConfig.reservedCapacity || 1000
        };
        this.memoryMapConfig = memoryMapConfig;
        this.isInitialized = false;
        this.cleanupInterval = null;
    }

    // Initialize MemoryManager with base memories and configuration
    async initialize() {
        try {
            // Set up memory pools with initial configuration
            this.setupMemoryPools();
            
            // Initialize emotional indexes
            this.initializeEmotionalIndexes();
            
            // Load memory regions if provided in configuration
            if (this.memoryMapConfig.regions) {
                await this.loadMemoryRegions(this.memoryMapConfig.regions);
            }
            
            // Load base memories if provided in configuration
            if (this.memoryMapConfig.baseMemories) {
                await this.loadBaseMemories(this.memoryMapConfig.baseMemories);
            }
            
            // Start periodic cleanup and optimization
            this.startPeriodicMaintenance();
            
            // Initialize leak detection
            this.leakDetector.initialize();
            
            this.isInitialized = true;
            console.log(`MemoryManager initialized with capacity: ${this.memoryCapacity.total} units`);
            
            return true;
        } catch (error) {
            console.error('MemoryManager initialization failed:', error);
            throw error;
        }
    }

    // Set up memory pools with initial configuration
    setupMemoryPools() {
        const poolConfigs = this.memoryMapConfig.poolConfigs || {};
        
        // Configure each pool with size limits and characteristics
        Object.keys(this.memoryPools).forEach(poolType => {
            const config = poolConfigs[poolType] || {};
            this.memoryPools[poolType] = new Map();
            
            // Set pool-specific metadata
            this.memoryPools[poolType].maxSize = config.maxSize || 2000;
            this.memoryPools[poolType].compressionEnabled = config.compressionEnabled !== false;
            this.memoryPools[poolType].autoCleanup = config.autoCleanup !== false;
            this.memoryPools[poolType].retentionPeriod = config.retentionPeriod || (
                poolType === 'shortTerm' ? 3600000 : // 1 hour
                poolType === 'longTerm' ? 31536000000 : // 1 year
                poolType === 'traumatic' ? Infinity : // Never auto-cleanup
                poolType === 'suppressed' ? 7776000000 : // 90 days
                poolType === 'procedural' ? Infinity : // Never auto-cleanup
                86400000 // 24 hours default
            );
        });
    }

    // Initialize emotional indexes for fast retrieval
    initializeEmotionalIndexes() {
        const baseEmotions = [
            'joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust',
            'love', 'grief', 'anxiety', 'excitement', 'contentment', 'frustration',
            'hope', 'despair', 'pride', 'shame', 'guilt', 'envy'
        ];
        
        baseEmotions.forEach(emotion => {
            this.emotionalIndexes.set(emotion, new Set());
            this.emotionalIndexes.set(`${emotion}_low`, new Set());
            this.emotionalIndexes.set(`${emotion}_medium`, new Set());
            this.emotionalIndexes.set(`${emotion}_high`, new Set());
        });
    }

    // Load base memories from configuration
    async loadBaseMemories(baseMemories) {
        for (const memoryConfig of baseMemories) {
            try {
                const memoryData = {
                    description: memoryConfig.description,
                    emotionalIntensity: memoryConfig.emotionalIntensity || 0.5,
                    emotions: memoryConfig.emotions || [],
                    context: memoryConfig.context || {},
                    sensoryDetails: memoryConfig.sensoryDetails || {},
                    timeStamp: memoryConfig.timeStamp || Date.now()
                };
                
                const memoryId = this.allocateMemory(
                    memoryData, 
                    memoryConfig.type || 'longTerm'
                );
                
                if (memoryId) {
                    console.log(`Loaded base memory: ${memoryConfig.description.substring(0, 50)}...`);
                } else {
                    console.warn(`Failed to load base memory: ${memoryConfig.description}`);
                }
            } catch (error) {
                console.error(`Error loading base memory:`, error);
            }
        }
    }

    // Load memory regions from character configuration
    async loadMemoryRegions(regions) {
        console.log(`Loading ${regions.length} memory regions...`);
        
        for (const region of regions) {
            try {
                // Map region types to memory pool types
                let poolType = 'longTerm'; // default
                switch (region.type) {
                    case 'episodic':
                        poolType = 'longTerm';
                        break;
                    case 'emotional':
                        poolType = 'traumatic'; // emotional memories tend to be intense
                        break;
                    case 'semantic':
                        poolType = 'procedural'; // knowledge-based
                        break;
                    case 'procedural':
                        poolType = 'procedural';
                        break;
                    default:
                        poolType = 'longTerm';
                }

                // Create memory objects for this region
                const memoryData = {
                    description: `${region.label} - Memory region containing ${region.type} memories`,
                    emotionalIntensity: region.corruptionRisk || 0.5,
                    emotions: this.getEmotionsForRegionType(region.type, region.label),
                    context: {
                        address: region.address,
                        size: region.size,
                        regionType: region.type,
                        protected: region.protected,
                        fragmentable: region.fragmentable,
                        volatility: region.volatility,
                        corruptionRisk: region.corruptionRisk
                    },
                    sensoryDetails: {},
                    timeStamp: Date.now(),
                    regionMetadata: region // Store the full region data
                };
                
                const memoryId = this.allocateMemory(memoryData, poolType);
                
                if (memoryId) {
                    console.log(`Loaded memory region: ${region.label} (${region.type}, ${region.size} units)`);
                    
                    // Add region-specific memories if this is a known region type
                    await this.populateRegionMemories(region, poolType);
                } else {
                    console.warn(`Failed to load memory region: ${region.label}`);
                }
            } catch (error) {
                console.error(`Error loading memory region ${region.label}:`, error);
            }
        }
    }

    // Get appropriate emotions for a memory region type
    getEmotionsForRegionType(regionType, label) {
        const emotions = [];
        
        switch (regionType) {
            case 'episodic':
                if (label.toLowerCase().includes('leo') || label.toLowerCase().includes('son')) {
                    emotions.push('grief', 'love', 'sadness', 'hope');
                } else {
                    emotions.push('nostalgia', 'contentment');
                }
                break;
            case 'emotional':
                if (label.toLowerCase().includes('grief')) {
                    emotions.push('grief', 'sadness', 'despair', 'anger');
                } else {
                    emotions.push('anxiety', 'fear');
                }
                break;
            case 'semantic':
                emotions.push('pride', 'satisfaction');
                break;
            case 'procedural':
                emotions.push('confidence', 'determination');
                break;
        }
        
        return emotions;
    }

    // Populate a memory region with specific memories based on the region type and label
    async populateRegionMemories(region, poolType) {
        const memories = [];
        
        // Create specific memories based on region label and type
        if (region.label === "Leo's Memories" && region.type === 'episodic') {
            memories.push(
                {
                    description: "Leo's fifth birthday - excitement as he blew out candles",
                    emotionalIntensity: 0.9,
                    emotions: ['love', 'joy', 'nostalgia'],
                    context: { event: 'birthday', age: 5 }
                },
                {
                    description: "Teaching Leo about quantum mechanics with toy blocks",
                    emotionalIntensity: 0.8,
                    emotions: ['pride', 'love', 'satisfaction'],
                    context: { event: 'teaching', subject: 'physics' }
                },
                {
                    description: "Last conversation before Leo disappeared",
                    emotionalIntensity: 1.0,
                    emotions: ['grief', 'regret', 'love', 'despair'],
                    context: { event: 'last_conversation', significance: 'critical' }
                }
            );
        } else if (region.label === "Grief Storage" && region.type === 'emotional') {
            memories.push(
                {
                    description: "The overwhelming emptiness after realizing Leo was gone",
                    emotionalIntensity: 1.0,
                    emotions: ['grief', 'despair', 'emptiness'],
                    context: { trigger: 'realization', intensity: 'overwhelming' }
                },
                {
                    description: "Rage at the universe for taking Leo away",
                    emotionalIntensity: 0.9,
                    emotions: ['anger', 'grief', 'frustration'],
                    context: { trigger: 'injustice', target: 'universe' }
                }
            );
        } else if (region.label === "Physics Knowledge" && region.type === 'semantic') {
            memories.push(
                {
                    description: "Understanding of temporal mechanics and quantum field theory",
                    emotionalIntensity: 0.3,
                    emotions: ['confidence', 'satisfaction'],
                    context: { domain: 'physics', complexity: 'advanced' }
                },
                {
                    description: "Breakthrough insights about timeline fragmentation",
                    emotionalIntensity: 0.7,
                    emotions: ['excitement', 'hope', 'determination'],
                    context: { discovery: 'timeline_fragmentation', significance: 'breakthrough' }
                }
            );
        } else if (region.label === "Research Protocols" && region.type === 'procedural') {
            memories.push(
                {
                    description: "Step-by-step methodology for temporal analysis",
                    emotionalIntensity: 0.2,
                    emotions: ['confidence', 'determination'],
                    context: { skill: 'temporal_analysis', proficiency: 'expert' }
                }
            );
        }
        
        // Allocate the specific memories to the appropriate pool
        for (const memory of memories) {
            const memoryData = {
                ...memory,
                timeStamp: Date.now(),
                regionSource: region.label
            };
            
            const memoryId = this.allocateMemory(memoryData, poolType);
            if (memoryId) {
                console.log(`  Added specific memory: ${memory.description.substring(0, 50)}...`);
            }
        }
    }

    // Start periodic maintenance tasks
    startPeriodicMaintenance() {
        if (this.cleanupInterval) return;
        
        this.cleanupInterval = setInterval(() => {
            this.performMaintenance();
        }, 60000); // Run every minute
    }

    // Stop periodic maintenance
    stopPeriodicMaintenance() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    // Perform routine memory maintenance
    performMaintenance() {
        try {
            // Clean up expired memories
            this.cleanupExpiredMemories();
            
            // Detect and handle memory leaks
            this.detectAndReportLeaks();
            
            // Compress old memories
            this.compressOldMemories();
            
            // Defragment memory if needed
            if (this.fragmentationLevel > 0.3) {
                this.defragmentMemory();
            }
            
            // Update capacity metrics
            this.updateCapacityMetrics();
            
        } catch (error) {
            console.error('Memory maintenance error:', error);
        }
    }

    // Execute action on memory system
    async executeAction(action, parameters = {}) {
        if (!this.isInitialized) {
            throw new Error('MemoryManager not initialized');
        }
        
        switch (action) {
            case 'defragment_memory':
                return this.defragmentMemory();
                
            case 'compress_memories':
                return this.compressMemories(parameters.poolType);
                
            case 'cleanup_expired':
                return this.cleanupExpiredMemories();
                
            case 'restore_backup':
                return this.restoreFromBackup(parameters.backupId);
                
            case 'rebuild_indexes':
                return this.rebuildEmotionalIndexes();
                
            case 'allocate_memory':
                return this.allocateMemory(parameters.data, parameters.type);
                
            case 'retrieve_memories':
                return this.retrieveMemoriesByEmotion(parameters.emotion, parameters.limit);
                
            case 'delete_memory':
                return this.deleteMemory(parameters.memoryId);
                
            default:
                throw new Error(`Unknown memory action: ${action}`);
        }
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
        
        // Log allocation if system log exists
        if (this.consciousness.systemLog) {
            this.consciousness.systemLog.push({
                timestamp: Date.now(),
                level: 'debug',
                message: `Allocated ${memorySize} units for ${type} memory: ${memoryId}`,
                category: 'memory_management',
                memoryId: memoryId
            });
        }
        
        return memoryId;
    }

    // Calculate memory size based on content
    calculateMemorySize(memoryData) {
        let size = 100; // Base size
        
        if (memoryData.description) {
            size += memoryData.description.length * 2;
        }
        
        if (memoryData.sensoryDetails) {
            size += Object.keys(memoryData.sensoryDetails).length * 50;
        }
        
        if (memoryData.emotions) {
            size += memoryData.emotions.length * 10;
        }
        
        // Emotional intensity affects memory size
        if (memoryData.emotionalIntensity) {
            size *= (1 + memoryData.emotionalIntensity);
        }
        
        return Math.round(size);
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
                    proficiencyMetrics: data.proficiencyMetrics || {},
                    muscleMemory: data.muscleMemory || 0
                };
                
            case 'suppressed':
                return {
                    ...baseContent,
                    suppressionLevel: data.suppressionLevel || 0.8,
                    accessDifficulty: data.accessDifficulty || 0.9,
                    suppressionMechanism: data.suppressionMechanism || 'emotional_blocking',
                    recoveryTriggers: data.recoveryTriggers || []
                };
                
            default:
                return baseContent;
        }
    }

    // Create emotional indexes for fast retrieval
    createEmotionalIndexes(memoryBlock) {
        if (!memoryBlock.associatedEmotions || !Array.isArray(memoryBlock.associatedEmotions)) {
            return; // Skip if no emotions to index
        }
        
        memoryBlock.associatedEmotions.forEach(emotion => {
            if (!this.emotionalIndexes.has(emotion)) {
                this.emotionalIndexes.set(emotion, new Set());
            }
            this.emotionalIndexes.get(emotion).add(memoryBlock.id);
            
            // Index by intensity level only if the intensity-based index exists
            const intensityRange = this.getIntensityRange(memoryBlock.emotionalCharge);
            const intensityKey = `${emotion}_${intensityRange}`;
            if (!this.emotionalIndexes.has(intensityKey)) {
                this.emotionalIndexes.set(intensityKey, new Set());
            }
            this.emotionalIndexes.get(intensityKey).add(memoryBlock.id);
        });
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
                allocationStack: memory.allocationStack,
                accessPatterns: this.accessPatterns.get(memory.id),
                corruptionRisk: this.calculateCorruptionRisk(memory)
            } : null
        };
    }

    // Get current execution context
    getCurrentContext() {
        return {
            timestamp: Date.now(),
            activeProcesses: this.consciousness.processManager ? 
                this.consciousness.processManager.getSystemResourceUsage().activeProcessCount : 0,
            emotionalState: this.consciousness.emotionalProcessor ?
                this.consciousness.emotionalProcessor.getCurrentState() : null,
            systemStability: this.consciousness.state.stability
        };
    }

    // Get current call stack for debugging
    getCurrentStack() {
        const stack = new Error().stack;
        return stack ? stack.split('\n').slice(2, 8) : [];
    }

    // Calculate corruption risk for a memory
    calculateCorruptionRisk(memory) {
        let risk = 0;
        
        // Age factor
        const age = Date.now() - memory.createdAt;
        risk += Math.min(age / 31536000000, 0.3); // Max 0.3 for age (1 year)
        
        // Access frequency factor
        risk += Math.max(0, (memory.accessCount - 100) / 1000); // High access can cause wear
        
        // Emotional instability factor
        risk += (1 - memory.emotionalStability) * 0.4;
        
        // Fragmentation factor
        if (memory.fragmented) risk += 0.2;
        
        return Math.min(risk, 1.0);
    }

    // Trigger memory pressure cleanup
    triggerMemoryPressure() {
        console.warn('Memory pressure detected, triggering cleanup');
        
        // Try to free memory through various methods
        this.cleanupExpiredMemories();
        this.compressOldMemories();
        this.cleanupLowValueMemories();
        
        // If still under pressure, trigger garbage collection
        if (this.memoryCapacity.available < this.memoryCapacity.reserved) {
            this.forceGarbageCollection();
        }
    }

    // Clean up expired memories
    cleanupExpiredMemories() {
        let freedMemory = 0;
        const now = Date.now();
        
        Object.entries(this.memoryPools).forEach(([poolType, pool]) => {
            const retentionPeriod = pool.retentionPeriod;
            if (retentionPeriod === Infinity) return;
            
            Array.from(pool.entries()).forEach(([id, memory]) => {
                if (now - memory.createdAt > retentionPeriod && !memory.protected) {
                    this.deleteMemory(id);
                    freedMemory += memory.size;
                }
            });
        });
        
        return freedMemory;
    }

    // Compress old memories to save space
    compressOldMemories() {
        const compressionAge = 3600000; // 1 hour
        const now = Date.now();
        
        this.memorySegments.forEach(memory => {
            if (!memory.compressed && 
                now - memory.createdAt > compressionAge && 
                memory.type !== 'traumatic') {
                
                memory.compressed = true;
                memory.size = Math.round(memory.size * 0.7);
                this.updateCapacityMetrics();
            }
        });
    }

    // Clean up low-value memories
    cleanupLowValueMemories() {
        const lowValueThreshold = 0.3;
        let freedMemory = 0;
        
        this.memorySegments.forEach((memory, id) => {
            const value = this.calculateMemoryValue(memory);
            if (value < lowValueThreshold && !memory.protected) {
                this.deleteMemory(id);
                freedMemory += memory.size;
            }
        });
        
        return freedMemory;
    }

    // Calculate the value/importance of a memory
    calculateMemoryValue(memory) {
        let value = memory.emotionalCharge * 0.4;
        value += Math.min(memory.accessCount / 10, 0.3);
        value += memory.integrityScore * 0.2;
        value += (memory.associatedEmotions.length / 5) * 0.1;
        
        return Math.min(value, 1.0);
    }

    // Delete a memory
    deleteMemory(memoryId) {
        const memory = this.memorySegments.get(memoryId);
        if (!memory) return false;
        
        // Remove from all pools and indexes
        Object.values(this.memoryPools).forEach(pool => {
            pool.delete(memoryId);
        });
        
        // Remove from emotional indexes
        memory.associatedEmotions.forEach(emotion => {
            this.emotionalIndexes.get(emotion)?.delete(memoryId);
            const intensityRange = this.getIntensityRange(memory.emotionalCharge);
            this.emotionalIndexes.get(`${emotion}_${intensityRange}`)?.delete(memoryId);
        });
        
        // Remove from main segments
        this.memorySegments.delete(memoryId);
        
        // Update capacity
        this.memoryCapacity.allocated -= memory.size;
        this.memoryCapacity.available += memory.size;
        
        return true;
    }

    // Defragment memory
    defragmentMemory() {
        console.log('Starting memory defragmentation');
        
        // This is a simplified defragmentation - in a real system this would be more complex
        const fragmentedMemories = Array.from(this.memorySegments.values())
            .filter(mem => mem.fragmented);
        
        fragmentedMemories.forEach(memory => {
            memory.fragmented = false;
            memory.coherenceLevel = Math.min(memory.coherenceLevel + 0.1, 1.0);
        });
        
        this.fragmentationLevel = 0;
        
        return {
            success: true,
            defragmentedCount: fragmentedMemories.length,
            message: `Defragmented ${fragmentedMemories.length} memory blocks`
        };
    }

    // Force garbage collection
    forceGarbageCollection() {
        console.log('Forcing memory garbage collection');
        
        // Remove all non-protected memories with low value
        let freedMemory = 0;
        const toDelete = [];
        
        this.memorySegments.forEach((memory, id) => {
            if (!memory.protected && this.calculateMemoryValue(memory) < 0.5) {
                toDelete.push(id);
                freedMemory += memory.size;
            }
        });
        
        toDelete.forEach(id => this.deleteMemory(id));
        
        return freedMemory;
    }

    // Detect and report memory leaks
    detectAndReportLeaks() {
        const leaks = this.leakDetector.detectLeaks();
        
        if (leaks.length > 0) {
            console.warn(`Detected ${leaks.length} potential memory leaks`);
            
            // Report through consciousness system if available
            if (this.consciousness.systemLog) {
                this.consciousness.systemLog.push({
                    timestamp: Date.now(),
                    level: 'warning',
                    message: `Memory leak detection: ${leaks.length} suspicious allocations`,
                    category: 'memory_management',
                    details: leaks.slice(0, 3) // Include first 3 leaks
                });
            }
        }
        
        return leaks;
    }

    // Rebuild emotional indexes
    rebuildEmotionalIndexes() {
        console.log('Rebuilding emotional indexes');
        
        // Clear existing indexes
        this.emotionalIndexes.clear();
        this.initializeEmotionalIndexes();
        
        // Rebuild from existing memories
        this.memorySegments.forEach(memory => {
            this.createEmotionalIndexes(memory);
        });
        
        return {
            success: true,
            message: 'Emotional indexes rebuilt',
            indexCount: this.emotionalIndexes.size
        };
    }

    // Update capacity metrics
    updateCapacityMetrics() {
        let actualAllocated = 0;
        this.memorySegments.forEach(memory => {
            actualAllocated += memory.size;
        });
        
        this.memoryCapacity.allocated = actualAllocated;
        this.memoryCapacity.available = this.memoryCapacity.total - actualAllocated;
        
        // Update fragmentation level
        const fragmentedMemories = Array.from(this.memorySegments.values())
            .filter(mem => mem.fragmented);
        this.fragmentationLevel = fragmentedMemories.length / this.memorySegments.size;
    }

    // Get memory status for debugging
    getMemoryStatus() {
        const poolDetails = Object.fromEntries(
            Object.entries(this.memoryPools).map(([type, pool]) => [
                type, 
                {
                    count: pool.size,
                    maxSize: pool.maxSize || 'unlimited',
                    memories: Array.from(pool.values()).map(mem => ({
                        description: (mem.content?.narrative || mem.data?.description || 'No description').substring(0, 50) + '...',
                        emotionalIntensity: mem.emotionalCharge || mem.data?.emotionalIntensity || 0,
                        emotions: mem.associatedEmotions || mem.data?.emotions || [],
                        hasRegionMetadata: !!(mem.data?.regionMetadata || mem.regionMetadata)
                    }))
                }
            ])
        );

        const regionSummary = Array.from(this.memorySegments.values())
            .filter(mem => mem.data?.regionMetadata || mem.regionMetadata)
            .map(mem => {
                const regionData = mem.data?.regionMetadata || mem.regionMetadata;
                return {
                    label: regionData.label,
                    type: regionData.type,
                    size: regionData.size,
                    address: regionData.address,
                    protected: regionData.protected,
                    corruptionRisk: regionData.corruptionRisk
                };
            });

        return {
            capacity: this.memoryCapacity,
            pools: poolDetails,
            fragmentationLevel: this.fragmentationLevel,
            compressionRatio: this.compressionRatio,
            totalMemories: this.memorySegments.size,
            emotionalIndexes: this.emotionalIndexes.size,
            loadedRegions: regionSummary
        };
    }

    // Get debuggable memory issues
    getDebuggableMemoryIssues() {
        const issues = {
            memoryLeaks: this.leakDetector.detectLeaks(),
            corruptedMemories: Array.from(this.memorySegments.values())
                .filter(mem => mem.corrupted || mem.integrityScore < 0.5),
            fragmentedMemories: Array.from(this.memorySegments.values())
                .filter(mem => mem.fragmented),
            highPressureWarning: this.memoryCapacity.available < this.memoryCapacity.reserved
        };
        
        return issues;
    }

    // Write memory data (for external interface)
    async writeMemory(address, content) {
        // This method provides compatibility with external systems
        // that expect a write-based interface
        const memoryData = {
            description: content.description || 'External memory write',
            emotionalIntensity: content.emotionalIntensity || 0.1,
            emotions: content.emotions || [],
            context: { address, source: 'external' },
            ...content
        };
        
        return this.allocateMemory(memoryData, content.type || 'shortTerm');
    }

    // Get state for consciousness instance
    getState() {
        return {
            capacity: this.memoryCapacity,
            pools: Object.fromEntries(
                Object.entries(this.memoryPools).map(([type, pool]) => [
                    type, 
                    pool.size
                ])
            ),
            fragmentationLevel: this.fragmentationLevel,
            compressionRatio: this.compressionRatio,
            totalMemories: this.memorySegments.size,
            emotionalIndexes: this.emotionalIndexes.size,
            debuggableIssues: this.getDebuggableMemoryIssues(),
            isInitialized: this.isInitialized
        };
    }

    // Capture state for save/restore
    captureState() {
        return {
            memorySegments: Array.from(this.memorySegments.entries()),
            emotionalIndexes: Array.from(this.emotionalIndexes.entries()).map(([key, set]) => [key, Array.from(set)]),
            memoryPools: Object.fromEntries(
                Object.entries(this.memoryPools).map(([type, pool]) => [
                    type, 
                    {
                        entries: Array.from(pool.entries()),
                        maxSize: pool.maxSize,
                        compressionEnabled: pool.compressionEnabled,
                        autoCleanup: pool.autoCleanup,
                        retentionPeriod: pool.retentionPeriod
                    }
                ])
            ),
            accessPatterns: Array.from(this.accessPatterns.entries()),
            memoryCapacity: this.memoryCapacity,
            fragmentationLevel: this.fragmentationLevel,
            compressionRatio: this.compressionRatio,
            memoryMapConfig: this.memoryMapConfig,
            isInitialized: this.isInitialized
        };
    }

    // Restore state from capture
    restoreState(capturedState) {
        if (!capturedState) return false;
        
        try {
            // Restore memory segments
            this.memorySegments = new Map(capturedState.memorySegments || []);
            
            // Restore emotional indexes
            this.emotionalIndexes.clear();
            if (capturedState.emotionalIndexes) {
                capturedState.emotionalIndexes.forEach(([key, array]) => {
                    this.emotionalIndexes.set(key, new Set(array));
                });
            }
            
            // Restore memory pools
            if (capturedState.memoryPools) {
                Object.entries(capturedState.memoryPools).forEach(([type, poolData]) => {
                    const pool = new Map(poolData.entries || []);
                    pool.maxSize = poolData.maxSize;
                    pool.compressionEnabled = poolData.compressionEnabled;
                    pool.autoCleanup = poolData.autoCleanup;
                    pool.retentionPeriod = poolData.retentionPeriod;
                    this.memoryPools[type] = pool;
                });
            }
            
            // Restore other state
            this.accessPatterns = new Map(capturedState.accessPatterns || []);
            this.memoryCapacity = capturedState.memoryCapacity || this.memoryCapacity;
            this.fragmentationLevel = capturedState.fragmentationLevel || 0;
            this.compressionRatio = capturedState.compressionRatio || 1.0;
            this.memoryMapConfig = capturedState.memoryMapConfig || {};
            this.isInitialized = capturedState.isInitialized || false;
            
            return true;
        } catch (error) {
            console.error('MemoryManager state restoration failed:', error);
            return false;
        }
    }

    // System tick for consciousness instance
    async tick() {
        const updates = [];
        
        // Perform routine maintenance
        this.performMaintenance();
        
        // Check for memory pressure
        const availablePercentage = (this.memoryCapacity.available / this.memoryCapacity.total) * 100;
        if (availablePercentage < 10) {
            updates.push({
                type: 'memory_pressure_critical',
                availableMemory: this.memoryCapacity.available,
                totalMemory: this.memoryCapacity.total,
                timestamp: Date.now()
            });
        } else if (availablePercentage < 20) {
            updates.push({
                type: 'memory_pressure_warning',
                availableMemory: this.memoryCapacity.available,
                totalMemory: this.memoryCapacity.total,
                timestamp: Date.now()
            });
        }
        
        // Check for high fragmentation
        if (this.fragmentationLevel > 0.6) {
            updates.push({
                type: 'memory_fragmentation_high',
                fragmentationLevel: this.fragmentationLevel,
                timestamp: Date.now()
            });
        }
        
        // Check for memory leaks
        const leaks = this.detectAndReportLeaks();
        if (leaks.length > 5) {
            updates.push({
                type: 'memory_leaks_detected',
                leakCount: leaks.length,
                timestamp: Date.now()
            });
        }
        
        // Check for corrupted memories
        const corruptedMemories = Array.from(this.memorySegments.values())
            .filter(mem => mem.corrupted || mem.integrityScore < 0.3);
        if (corruptedMemories.length > 0) {
            updates.push({
                type: 'memory_corruption_detected',
                corruptedCount: corruptedMemories.length,
                timestamp: Date.now()
            });
        }
        
        return updates;
    }

    // Get resource usage for consciousness instance
    getResourceUsage() {
        return {
            memory: this.memoryCapacity.allocated,
            threads: 0 // MemoryManager doesn't use threads directly
        };
    }

    // Get fragmentation level
    getFragmentation() {
        return this.fragmentationLevel;
    }

    // Get corrupted regions
    getCorruptedRegions() {
        return Array.from(this.memorySegments.values())
            .filter(mem => mem.corrupted || mem.integrityScore < 0.5)
            .map(mem => ({
                id: mem.id,
                type: mem.type,
                integrityScore: mem.integrityScore,
                corruptionRisk: this.calculateCorruptionRisk(mem)
            }));
    }

    // Get memory data formatted for frontend display
    getMemoryDataForFrontend() {
        const memoryData = {
            capacity: {
                total: this.memoryCapacity.total,
                allocated: this.memoryCapacity.allocated,
                available: this.memoryCapacity.available,
                reserved: this.memoryCapacity.reserved,
                utilizationPercentage: Math.round((this.memoryCapacity.allocated / this.memoryCapacity.total) * 100)
            },
            pools: {},
            fragmentation: {
                level: this.fragmentationLevel,
                severity: this.fragmentationLevel > 0.6 ? 'high' : this.fragmentationLevel > 0.3 ? 'medium' : 'low'
            },
            compression: {
                ratio: this.compressionRatio,
                enabled: true
            },
            statistics: {
                totalMemories: this.memorySegments.size,
                emotionalIndexes: this.emotionalIndexes.size,
                accessPatterns: this.accessPatterns.size
            },
            issues: this.getDebuggableMemoryIssues(),
            recentActivity: this.getRecentMemoryActivity()
        };

        // Format pool data
        Object.entries(this.memoryPools).forEach(([poolType, pool]) => {
            memoryData.pools[poolType] = {
                count: pool.size,
                maxSize: pool.maxSize || 2000,
                utilizationPercentage: Math.round((pool.size / (pool.maxSize || 2000)) * 100),
                compressionEnabled: pool.compressionEnabled !== false,
                autoCleanup: pool.autoCleanup !== false,
                retentionPeriod: pool.retentionPeriod
            };
        });

        return memoryData;
    }

    // Get recent memory activity for debugging
    getRecentMemoryActivity() {
        const recentThreshold = Date.now() - 300000; // Last 5 minutes
        const recentMemories = Array.from(this.memorySegments.values())
            .filter(mem => mem.lastAccessed > recentThreshold)
            .sort((a, b) => b.lastAccessed - a.lastAccessed)
            .slice(0, 10);

        return recentMemories.map(mem => ({
            id: mem.id,
            type: mem.type,
            lastAccessed: mem.lastAccessed,
            accessCount: mem.accessCount,
            emotionalCharge: mem.emotionalCharge,
            size: mem.size,
            integrityScore: mem.integrityScore
        }));
    }

    // Shutdown MemoryManager
    shutdown() {
        this.stopPeriodicMaintenance();
        this.memorySegments.clear();
        Object.values(this.memoryPools).forEach(pool => pool.clear());
        this.emotionalIndexes.clear();
        this.accessPatterns.clear();
        this.isInitialized = false;
        console.log('MemoryManager shutdown complete');
    }
}

// Memory Leak Detector Helper Class
class MemoryLeakDetector {
    constructor(memoryManager) {
        this.memoryManager = memoryManager;
        this.allocationHistory = [];
        this.suspiciousPatterns = [];
        this.isInitialized = false;
    }
    
    initialize() {
        this.isInitialized = true;
    }
    
    detectLeaks() {
        if (!this.isInitialized) return [];
        
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
