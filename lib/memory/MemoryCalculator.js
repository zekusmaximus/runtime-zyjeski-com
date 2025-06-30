// MemoryCalculator.js - Pure utility class for memory-related calculations

export class MemoryCalculator {
    // All methods are static - this is a stateless utility class

    /**
     * Calculate memory size based on content
     * Moved from MemoryManager.calculateMemorySize
     * @param {Object} memoryData - Memory data with description, sensoryDetails, emotions, etc.
     * @returns {number} Calculated memory size in units
     */
    static calculateMemorySize(memoryData) {
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

    /**
     * Get intensity range for indexing
     * Moved from MemoryManager.getIntensityRange
     * @param {number} intensity - Emotional intensity value (0-1)
     * @returns {string} Intensity range category ('low', 'medium', 'high')
     */
    static getIntensityRange(intensity) {
        if (intensity < 0.3) return 'low';
        if (intensity < 0.7) return 'medium';
        return 'high';
    }

    /**
     * Calculate corruption risk for a memory
     * Moved from MemoryManager.calculateCorruptionRisk
     * @param {Object} memory - Memory object with metadata
     * @returns {number} Corruption risk value (0-1)
     */
    static calculateCorruptionRisk(memory) {
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

    /**
     * Calculate the value/importance of a memory
     * Moved from MemoryManager.calculateMemoryValue
     * @param {Object} memory - Memory object with metadata
     * @returns {number} Memory value score (0-1)
     */
    static calculateMemoryValue(memory) {
        let value = memory.emotionalCharge * 0.4;
        value += Math.min(memory.accessCount / 10, 0.3);
        value += memory.integrityScore * 0.2;
        value += (memory.associatedEmotions.length / 5) * 0.1;
        
        return Math.min(value, 1.0);
    }

    /**
     * Calculate utilization percentage
     * Extracted from MemoryManager.getMemoryDataForFrontend
     * @param {number} used - Used amount
     * @param {number} total - Total amount
     * @returns {number} Utilization percentage (0-100)
     */
    static calculateUtilizationPercentage(used, total) {
        if (total === 0) return 0;
        return Math.round((used / total) * 100);
    }

    /**
     * Check if memory allocation is possible
     * Extracted from MemoryManager allocation logic
     * @param {number} available - Available memory
     * @param {number} requestedSize - Requested allocation size
     * @returns {boolean} True if allocation is possible
     */
    static canAllocate(available, requestedSize) {
        return available >= requestedSize;
    }

    /**
     * Calculate available memory percentage
     * Extracted from MemoryManager.tick method
     * @param {number} available - Available memory
     * @param {number} total - Total memory
     * @returns {number} Available percentage (0-100)
     */
    static calculateAvailablePercentage(available, total) {
        if (total === 0) return 0;
        return (available / total) * 100;
    }

    /**
     * Determine fragmentation severity level
     * Extracted from MemoryManager.getMemoryDataForFrontend
     * @param {number} fragmentationLevel - Fragmentation level (0-1)
     * @returns {string} Severity level ('low', 'medium', 'high')
     */
    static getFragmentationSeverity(fragmentationLevel) {
        if (fragmentationLevel > 0.6) return 'high';
        if (fragmentationLevel > 0.3) return 'medium';
        return 'low';
    }

    /**
     * Check if memory pressure cleanup should be triggered
     * Extracted from MemoryManager.triggerMemoryPressure logic
     * @param {number} available - Available memory
     * @param {number} reserved - Reserved memory threshold
     * @returns {boolean} True if pressure cleanup needed
     */
    static shouldTriggerPressureCleanup(available, reserved) {
        return available < reserved;
    }

    /**
     * Calculate memory pressure level
     * New utility method for determining pressure severity
     * @param {number} available - Available memory
     * @param {number} total - Total memory
     * @returns {string} Pressure level ('none', 'warning', 'critical')
     */
    static getMemoryPressureLevel(available, total) {
        const availablePercentage = this.calculateAvailablePercentage(available, total);
        
        if (availablePercentage < 10) return 'critical';
        if (availablePercentage < 20) return 'warning';
        return 'none';
    }

    /**
     * Calculate pool utilization percentage
     * Extracted from MemoryManager.getMemoryDataForFrontend pool formatting
     * @param {number} poolSize - Current pool size
     * @param {number} maxSize - Maximum pool size
     * @returns {number} Pool utilization percentage (0-100)
     */
    static calculatePoolUtilization(poolSize, maxSize) {
        if (maxSize === 0) return 0;
        return Math.round((poolSize / maxSize) * 100);
    }

    /**
     * Check if memory is a leak candidate
     * Extracted from MemoryLeakDetector.isLeakCandidate
     * @param {Object} memory - Memory object
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} True if memory is a leak candidate
     */
    static isLeakCandidate(memory, currentTime) {
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

    /**
     * Calculate leak score for prioritizing cleanup
     * New utility method for leak detection scoring
     * @param {Object} memory - Memory object
     * @param {number} currentTime - Current timestamp
     * @returns {number} Leak score (higher = more likely to be a leak)
     */
    static calculateLeakScore(memory, currentTime) {
        const age = currentTime - memory.createdAt;
        const timeSinceLastAccess = currentTime - memory.lastAccessed;
        
        let score = 0;
        
        // Age factor (older = higher score)
        score += Math.min(age / 3600000, 1.0) * 0.4; // Max 0.4 for 1 hour age
        
        // Access recency factor (longer since access = higher score)
        score += Math.min(timeSinceLastAccess / 1800000, 1.0) * 0.3; // Max 0.3 for 30 min
        
        // Low access count factor
        score += Math.max(0, (5 - memory.accessCount) / 5) * 0.2; // Max 0.2 for 0 accesses
        
        // Low emotional significance factor
        score += Math.max(0, (0.5 - memory.emotionalCharge) / 0.5) * 0.1; // Max 0.1 for 0 charge
        
        return Math.min(score, 1.0);
    }

    /**
     * Calculate compressed memory size
     * Extracted from MemoryManager.compressOldMemories
     * @param {number} originalSize - Original memory size
     * @param {number} compressionRatio - Compression ratio (default 0.7)
     * @returns {number} Compressed size
     */
    static calculateCompressedSize(originalSize, compressionRatio = 0.7) {
        return Math.round(originalSize * compressionRatio);
    }
}

export default MemoryCalculator;
