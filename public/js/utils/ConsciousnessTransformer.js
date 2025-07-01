// ConsciousnessTransformer.js - Data transformation utility for runtime.zyjeski.com
// Centralizes all data transformation logic for consciousness data from backend to frontend

/**
 * ConsciousnessTransformer - Handles all transformations between raw consciousness data 
 * from the backend and the format needed by frontend components.
 * 
 * Maintains the consciousness-as-code metaphor throughout the UI by providing:
 * - Process health scoring and visual indicators
 * - Memory allocation visualization data
 * - Resource normalization for UI components
 * - State validation and merging
 * - Performance-optimized caching
 */
export class ConsciousnessTransformer {
  // Configuration constants
  static HEALTH_THRESHOLDS = {
    critical: 20,
    warning: 50,
    good: 80
  };
  
  static MEMORY_BLOCK_SIZE = 512; // MB
  static CACHE_SIZE_LIMIT = 100; // Maximum cache entries
  static CACHE_TIMEOUT = 60000; // 1 minute
  
  static STATUS_COLORS = {
    running: '#4CAF50',
    warning: '#FF9800', 
    error: '#F44336',
    crashed: '#F44336',
    stopped: '#9E9E9E',
    unknown: '#607D8B'
  };
  
  static STATUS_ICONS = {
    running: 'activity',
    warning: 'alert-triangle',
    error: 'alert-circle',
    crashed: 'x-circle',
    stopped: 'pause-circle',
    unknown: 'help-circle'
  };

  /**
   * Constructor - Initialize transformer with configuration
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      enableCaching: true,
      cacheTimeout: ConsciousnessTransformer.CACHE_TIMEOUT,
      maxCacheSize: ConsciousnessTransformer.CACHE_SIZE_LIMIT,
      ...config
    };
    
    this._cache = new Map();
    this._lastTimestamp = null;
    this._cacheCleanupInterval = null;
    
    // Start cache cleanup if caching is enabled
    if (this.config.enableCaching) {
      this._startCacheCleanup();
    }
  }

  /**
   * Extract and format processes from raw consciousness data
   * @param {Object} data - Raw consciousness data from backend
   * @returns {Array} Formatted process list for UI consumption
   */
  extractProcesses(data) {
    try {
      if (!data || !data.processes) {
        console.warn('ConsciousnessTransformer: Missing process data');
        return [];
      }
      
      // Check and update cache based on timestamp
      this._checkAndUpdateCache(data);
      
      const cacheKey = this._getCacheKey('extractProcesses', data);
      if (this.config.enableCaching && this._cache.has(cacheKey)) {
        return this._cache.get(cacheKey);
      }
      
      const processes = data.processes.map(process => {
        try {
          return this.formatProcessForUI(process);
        } catch (error) {
          console.error('ConsciousnessTransformer: Process formatting failed', error);
          return this._getDefaultProcess(process.pid || process.id);
        }
      });
      
      // Cache the result
      if (this.config.enableCaching) {
        this._cache.set(cacheKey, processes);
      }
      
      return processes;
    } catch (error) {
      console.error('ConsciousnessTransformer: Critical error in extractProcesses', error);
      return [];
    }
  }

  /**
   * Format individual process for UI display
   * @param {Object} process - Raw process data
   * @returns {Object} UI-formatted process object
   */
  formatProcessForUI(process) {
    if (!process || typeof process !== 'object') {
      return this._getDefaultProcess(-1);
    }
    
    const health = this._calculateHealth(process);
    const status = this._normalizeStatus(process.status);
    const indicator = this._generateIndicator(health, status);
    const warnings = this._extractWarnings(process);
    const trend = this._calculateTrend(process);
    
    return {
      pid: process.pid || process.id || -1,
      name: process.name || process.displayName || 'Unknown Process',
      status: status,
      health: health,
      indicator: indicator,
      warnings: warnings,
      trend: trend,
      cpu: this._normalizeValue(process.cpu_usage || process.cpu || 0, 100),
      memory: this._normalizeValue(process.memory_usage || process.memory_mb || process.memory || 0, 2048),
      threads: process.threadCount || process.threads || 0,
      priority: process.priority || 'normal',
      lifetime: process.lifetime || 0,
      debuggable: process.debuggable !== false
    };
  }

  /**
   * Normalize resource data for UI components
   * @param {Object} data - Raw consciousness data
   * @returns {Object} Normalized resource data
   */
  normalizeResources(data) {
    try {
      if (!data || !data.system) {
        console.warn('ConsciousnessTransformer: Missing system data');
        return this._getDefaultResources();
      }
      
      const cacheKey = this._getCacheKey('normalizeResources', data);
      if (this.config.enableCaching && this._cache.has(cacheKey)) {
        return this._cache.get(cacheKey);
      }
      
      const system = data.system;
      const resources = {
        cpu: this._normalizeCpuData(system.cpu),
        memory: this._normalizeMemoryData(system.memory),
        threads: this._normalizeThreadData(system.threads)
      };
      
      // Cache the result
      if (this.config.enableCaching) {
        this._cache.set(cacheKey, resources);
      }
      
      return resources;
    } catch (error) {
      console.error('ConsciousnessTransformer: Error normalizing resources', error);
      return this._getDefaultResources();
    }
  }

  /**
   * Extract and process memory allocations for visualization
   * @param {Object} data - Raw consciousness data
   * @returns {Object} Memory visualization data
   */
  extractMemoryAllocations(data) {
    try {
      if (!data || !data.memoryAllocations) {
        console.warn('ConsciousnessTransformer: Missing memory allocation data');
        return this._getDefaultMemoryMap();
      }
      
      const cacheKey = this._getCacheKey('extractMemoryAllocations', data);
      if (this.config.enableCaching && this._cache.has(cacheKey)) {
        return this._cache.get(cacheKey);
      }
      
      const allocations = data.memoryAllocations;
      const memoryMap = this.generateMemoryMap(allocations);
      
      // Cache the result
      if (this.config.enableCaching) {
        this._cache.set(cacheKey, memoryMap);
      }
      
      return memoryMap;
    } catch (error) {
      console.error('ConsciousnessTransformer: Error extracting memory allocations', error);
      return this._getDefaultMemoryMap();
    }
  }

  /**
   * Generate memory map visualization data
   * @param {Array} allocations - Memory allocation data
   * @returns {Object} Memory map visualization data
   */
  generateMemoryMap(allocations) {
    if (!Array.isArray(allocations)) {
      return this._getDefaultMemoryMap();
    }
    
    let totalBlocks = 0;
    let usedBlocks = 0;
    let fragmentedBlocks = 0;
    const visualization = [];
    
    allocations.forEach((allocation, index) => {
      if (!allocation.blocks || !Array.isArray(allocation.blocks)) {
        return;
      }
      
      allocation.blocks.forEach((block, blockIndex) => {
        const x = Math.floor(totalBlocks / 16);
        const y = totalBlocks % 16;
        
        visualization.push({
          x: x,
          y: y,
          size: block.size || ConsciousnessTransformer.MEMORY_BLOCK_SIZE,
          status: block.fragmented ? 'fragmented' : 'used',
          process: allocation.processId ? `Process ${allocation.processId}` : null,
          address: block.address || `0x${(totalBlocks * 512).toString(16)}`
        });
        
        totalBlocks++;
        usedBlocks++;
        if (block.fragmented) {
          fragmentedBlocks++;
        }
      });
    });
    
    return {
      totalBlocks: Math.max(totalBlocks, 16),
      usedBlocks: usedBlocks,
      fragmentedBlocks: fragmentedBlocks,
      blockSize: ConsciousnessTransformer.MEMORY_BLOCK_SIZE,
      visualization: visualization,
      heatmap: {
        intensity: totalBlocks > 0 ? usedBlocks / totalBlocks : 0,
        zones: this._calculateHeatZones(usedBlocks, totalBlocks)
      }
    };
  }

  /**
   * Validate consciousness update data
   * @param {Object} data - Raw consciousness data
   * @returns {boolean} True if data is valid
   */
  validateUpdate(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // Check for required timestamp
    if (!data.timestamp) {
      console.warn('ConsciousnessTransformer: Missing timestamp in update');
      return false;
    }
    
    // Validate data types
    if (data.processes && !Array.isArray(data.processes)) {
      console.warn('ConsciousnessTransformer: Invalid processes data type');
      return false;
    }
    
    if (data.system && typeof data.system !== 'object') {
      console.warn('ConsciousnessTransformer: Invalid system data type');
      return false;
    }
    
    return true;
  }

  /**
   * Merge new state with existing state
   * @param {Object} oldState - Previous consciousness state
   * @param {Object} newState - New consciousness state
   * @returns {Object} Merged state
   */
  mergeStates(oldState, newState) {
    if (!oldState) return newState;
    if (!newState) return oldState;

    try {
      return {
        ...oldState,
        ...newState,
        timestamp: newState.timestamp || oldState.timestamp,
        processes: newState.processes || oldState.processes || [],
        system: {
          ...oldState.system,
          ...newState.system
        },
        errors: newState.errors || oldState.errors || []
      };
    } catch (error) {
      console.error('ConsciousnessTransformer: Error merging states', error);
      return newState;
    }
  }

  /**
   * Calculate system health score from consciousness data
   * @param {Object} data - Raw consciousness data
   * @returns {Object} System health metrics
   */
  calculateSystemHealth(data) {
    if (!data || !data.system) {
      return { overall: 0, cpu: 0, memory: 0, processes: 0 };
    }

    const cacheKey = this._getCacheKey('calculateSystemHealth', data);
    if (this.config.enableCaching && this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey);
    }

    const system = data.system;
    const processes = data.processes || [];

    // Calculate individual health scores
    const cpuHealth = system.cpu ? Math.max(0, 100 - (system.cpu.usage || 0)) : 100;
    const memoryHealth = system.memory ?
      Math.max(0, 100 - ((system.memory.used / system.memory.total) * 100)) : 100;

    // Calculate process health average
    const processHealthScores = processes.map(p => this._calculateHealth(p));
    const processHealth = processHealthScores.length > 0 ?
      processHealthScores.reduce((sum, h) => sum + h, 0) / processHealthScores.length : 100;

    // Calculate overall health (weighted average)
    const overall = Math.round((cpuHealth * 0.3 + memoryHealth * 0.4 + processHealth * 0.3));

    const health = {
      overall: Math.max(0, Math.min(100, overall)),
      cpu: Math.round(cpuHealth),
      memory: Math.round(memoryHealth),
      processes: Math.round(processHealth)
    };

    // Cache the result
    if (this.config.enableCaching) {
      this._cache.set(cacheKey, health);
    }

    return health;
  }

  /**
   * Extract error patterns from error data
   * @param {Array} errors - Array of error objects
   * @returns {Object} Categorized error patterns
   */
  extractErrorPatterns(errors) {
    if (!Array.isArray(errors)) {
      return { critical: [], warnings: [], info: [], patterns: {} };
    }

    const patterns = {
      critical: [],
      warnings: [],
      info: [],
      patterns: {}
    };

    errors.forEach(error => {
      if (!error || typeof error !== 'object') return;

      const severity = error.severity || 'info';
      const type = error.type || 'unknown';

      // Categorize by severity
      if (severity === 'critical' || severity === 'error') {
        patterns.critical.push(error);
      } else if (severity === 'warning') {
        patterns.warnings.push(error);
      } else {
        patterns.info.push(error);
      }

      // Track error patterns
      if (!patterns.patterns[type]) {
        patterns.patterns[type] = 0;
      }
      patterns.patterns[type]++;
    });

    return patterns;
  }

  /**
   * Compute trends from current and historical states
   * @param {Object} currentState - Current consciousness state
   * @param {Array} historicalStates - Array of previous states
   * @returns {Object} Trend analysis
   */
  computeTrends(currentState, historicalStates = []) {
    if (!currentState || !Array.isArray(historicalStates) || historicalStates.length === 0) {
      return { overall: 'stable', cpu: 'stable', memory: 'stable', processes: 'stable' };
    }

    const recent = historicalStates.slice(-5); // Last 5 states
    if (recent.length < 2) {
      return { overall: 'stable', cpu: 'stable', memory: 'stable', processes: 'stable' };
    }

    // Calculate trends for different metrics
    const cpuTrend = this._calculateMetricTrend(recent, 'system.cpu.usage');
    const memoryTrend = this._calculateMetricTrend(recent, 'system.memory.used');
    const processTrend = this._calculateProcessTrend(recent);

    // Determine overall trend
    const trends = [cpuTrend, memoryTrend, processTrend];
    const improving = trends.filter(t => t === 'improving').length;
    const degrading = trends.filter(t => t === 'degrading').length;

    let overall = 'stable';
    if (improving > degrading) {
      overall = 'improving';
    } else if (degrading > improving) {
      overall = 'degrading';
    }

    return {
      overall: overall,
      cpu: cpuTrend,
      memory: memoryTrend,
      processes: processTrend
    };
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this._cache.clear();
    this._lastTimestamp = null;
  }

  /**
   * Invalidate cache entries for a specific timestamp
   * @param {string} timestamp - Timestamp to invalidate
   */
  invalidateCacheForTimestamp(timestamp) {
    const keysToDelete = [];
    for (const [key] of this._cache.entries()) {
      if (key.includes(timestamp)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this._cache.delete(key));
  }

  /**
   * Destroy transformer and cleanup resources
   */
  destroy() {
    this.clearCache();
    if (this._cacheCleanupInterval) {
      clearInterval(this._cacheCleanupInterval);
      this._cacheCleanupInterval = null;
    }
  }

  // Private helper methods

  /**
   * Calculate health score for a process
   * @private
   * @param {Object} process - Process data
   * @returns {number} Health score (0-100)
   */
  _calculateHealth(process) {
    if (!process) return 0;

    let health = 100;

    // CPU usage impact
    const cpu = process.cpu_usage || process.cpu || 0;
    if (cpu > 80) health -= 30;
    else if (cpu > 60) health -= 15;
    else if (cpu > 40) health -= 5;

    // Memory usage impact
    const memory = process.memory_usage || process.memory_mb || process.memory || 0;
    if (memory > 1500) health -= 25;
    else if (memory > 1000) health -= 10;
    else if (memory > 500) health -= 5;

    // Status impact
    const status = process.status || 'running';
    if (status === 'crashed' || status === 'error') health = 0;
    else if (status === 'warning') health -= 20;

    // Error count impact
    const errors = process.currentIssues || process.errors || [];
    health -= Math.min(errors.length * 10, 30);

    return Math.max(0, Math.min(100, Math.round(health)));
  }

  /**
   * Normalize status string
   * @private
   * @param {string} status - Raw status
   * @returns {string} Normalized status
   */
  _normalizeStatus(status) {
    if (!status || typeof status !== 'string') return 'unknown';

    const normalized = status.toLowerCase().trim();
    const validStatuses = ['running', 'warning', 'error', 'crashed', 'stopped'];

    return validStatuses.includes(normalized) ? normalized : 'unknown';
  }

  /**
   * Generate visual indicator for process
   * @private
   * @param {number} health - Health score
   * @param {string} status - Process status
   * @returns {Object} Indicator configuration
   */
  _generateIndicator(health, status) {
    let color = ConsciousnessTransformer.STATUS_COLORS.unknown;
    let icon = ConsciousnessTransformer.STATUS_ICONS.unknown;
    let pulse = false;

    if (status === 'running') {
      if (health >= ConsciousnessTransformer.HEALTH_THRESHOLDS.good) {
        color = ConsciousnessTransformer.STATUS_COLORS.running;
        icon = ConsciousnessTransformer.STATUS_ICONS.running;
        pulse = true;
      } else if (health >= ConsciousnessTransformer.HEALTH_THRESHOLDS.warning) {
        color = ConsciousnessTransformer.STATUS_COLORS.warning;
        icon = ConsciousnessTransformer.STATUS_ICONS.warning;
      } else {
        color = ConsciousnessTransformer.STATUS_COLORS.error;
        icon = ConsciousnessTransformer.STATUS_ICONS.error;
      }
    } else {
      color = ConsciousnessTransformer.STATUS_COLORS[status] || ConsciousnessTransformer.STATUS_COLORS.unknown;
      icon = ConsciousnessTransformer.STATUS_ICONS[status] || ConsciousnessTransformer.STATUS_ICONS.unknown;
    }

    return { color, icon, pulse };
  }

  /**
   * Extract warnings from process data
   * @private
   * @param {Object} process - Process data
   * @returns {Array} Array of warning strings
   */
  _extractWarnings(process) {
    const warnings = [];

    if (!process) return warnings;

    const cpu = process.cpu_usage || process.cpu || 0;
    const memory = process.memory_usage || process.memory_mb || process.memory || 0;

    if (cpu > 80) warnings.push('high_cpu_usage');
    if (memory > 1000) warnings.push('high_memory_usage');
    if (process.status === 'warning') warnings.push('process_warning');
    if (process.currentIssues && process.currentIssues.length > 0) warnings.push('process_issues');

    return warnings;
  }

  /**
   * Calculate trend for a process
   * @private
   * @param {Object} process - Process data
   * @returns {string} Trend direction
   */
  _calculateTrend(process) {
    // For now, return stable - would need historical data for real trend calculation
    if (!process) return 'unknown';

    const health = this._calculateHealth(process);
    if (health >= ConsciousnessTransformer.HEALTH_THRESHOLDS.good) return 'improving';
    if (health <= ConsciousnessTransformer.HEALTH_THRESHOLDS.critical) return 'degrading';
    return 'stable';
  }

  /**
   * Normalize a value within a range
   * @private
   * @param {number} value - Value to normalize
   * @param {number} max - Maximum value
   * @returns {number} Normalized value
   */
  _normalizeValue(value, max) {
    if (typeof value !== 'number' || typeof max !== 'number' || max <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(max, value));
  }

  /**
   * Get default process object for error cases
   * @private
   * @param {number} pid - Process ID
   * @returns {Object} Default process object
   */
  _getDefaultProcess(pid) {
    return {
      pid: pid || -1,
      name: 'Unknown Process',
      status: 'error',
      health: 0,
      indicator: {
        color: ConsciousnessTransformer.STATUS_COLORS.error,
        icon: ConsciousnessTransformer.STATUS_ICONS.error,
        pulse: false
      },
      warnings: ['process_error'],
      trend: 'unknown',
      cpu: 0,
      memory: 0,
      threads: 0,
      priority: 'normal',
      lifetime: 0,
      debuggable: false
    };
  }

  /**
   * Get default resources object
   * @private
   * @returns {Object} Default resources
   */
  _getDefaultResources() {
    return {
      cpu: {
        usage: 0,
        cores: 4,
        percentage: 0,
        label: 'CPU: 0%'
      },
      memory: {
        used: 0,
        total: 8192,
        available: 8192,
        percentage: 0,
        label: '0MB / 8192MB'
      },
      threads: {
        active: 0,
        blocked: 0,
        waiting: 0,
        total: 16,
        percentage: 0,
        label: '0 / 16 threads'
      }
    };
  }

  /**
   * Get default memory map
   * @private
   * @returns {Object} Default memory map
   */
  _getDefaultMemoryMap() {
    return {
      totalBlocks: 16,
      usedBlocks: 0,
      fragmentedBlocks: 0,
      blockSize: ConsciousnessTransformer.MEMORY_BLOCK_SIZE,
      visualization: [],
      heatmap: {
        intensity: 0,
        zones: ['cold', 'cold', 'cold', 'cold']
      }
    };
  }

  /**
   * Normalize CPU data
   * @private
   * @param {Object} cpu - Raw CPU data
   * @returns {Object} Normalized CPU data
   */
  _normalizeCpuData(cpu) {
    if (!cpu || typeof cpu !== 'object') {
      return this._getDefaultResources().cpu;
    }

    const usage = this._normalizeValue(cpu.usage || 0, 100);
    const cores = cpu.cores || 4;

    return {
      usage: usage,
      cores: cores,
      percentage: usage,
      label: `CPU: ${usage.toFixed(1)}%`
    };
  }

  /**
   * Normalize memory data
   * @private
   * @param {Object} memory - Raw memory data
   * @returns {Object} Normalized memory data
   */
  _normalizeMemoryData(memory) {
    if (!memory || typeof memory !== 'object') {
      return this._getDefaultResources().memory;
    }

    const used = this._normalizeValue(memory.used || 0, memory.total || 8192);
    const total = memory.total || 8192;
    const available = Math.max(0, total - used);
    const percentage = total > 0 ? (used / total) * 100 : 0;

    return {
      used: used,
      total: total,
      available: available,
      percentage: percentage,
      label: `${used}MB / ${total}MB`
    };
  }

  /**
   * Normalize thread data
   * @private
   * @param {Object} threads - Raw thread data
   * @returns {Object} Normalized thread data
   */
  _normalizeThreadData(threads) {
    if (!threads || typeof threads !== 'object') {
      return this._getDefaultResources().threads;
    }

    const active = threads.active || 0;
    const blocked = threads.blocked || 0;
    const waiting = threads.waiting || 0;
    const total = active + blocked + waiting || 16;
    const percentage = total > 0 ? (active / total) * 100 : 0;

    return {
      active: active,
      blocked: blocked,
      waiting: waiting,
      total: total,
      percentage: percentage,
      label: `${active} / ${total} threads`
    };
  }

  /**
   * Calculate heat zones for memory visualization
   * @private
   * @param {number} used - Used blocks
   * @param {number} total - Total blocks
   * @returns {Array} Heat zone array
   */
  _calculateHeatZones(used, total) {
    if (total === 0) return ['cold', 'cold', 'cold', 'cold'];

    const intensity = used / total;

    if (intensity > 0.8) return ['hot', 'hot', 'warm', 'warm'];
    if (intensity > 0.6) return ['warm', 'warm', 'warm', 'cool'];
    if (intensity > 0.4) return ['warm', 'cool', 'cool', 'cold'];
    if (intensity > 0.2) return ['cool', 'cool', 'cold', 'cold'];
    return ['cold', 'cold', 'cold', 'cold'];
  }

  /**
   * Calculate metric trend from historical data
   * @private
   * @param {Array} states - Historical states
   * @param {string} metricPath - Dot notation path to metric
   * @returns {string} Trend direction
   */
  _calculateMetricTrend(states, metricPath) {
    if (states.length < 2) return 'stable';

    const values = states.map(state => this._getNestedValue(state, metricPath)).filter(v => v !== null);
    if (values.length < 2) return 'stable';

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 10) return 'degrading'; // Increasing usage is degrading
    if (change < -10) return 'improving'; // Decreasing usage is improving
    return 'stable';
  }

  /**
   * Calculate process trend from historical data
   * @private
   * @param {Array} states - Historical states
   * @returns {string} Trend direction
   */
  _calculateProcessTrend(states) {
    if (states.length < 2) return 'stable';

    const healthScores = states.map(state => {
      if (!state.processes || !Array.isArray(state.processes)) return null;
      const scores = state.processes.map(p => this._calculateHealth(p));
      return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;
    }).filter(s => s !== null);

    if (healthScores.length < 2) return 'stable';

    const first = healthScores[0];
    const last = healthScores[healthScores.length - 1];
    const change = ((last - first) / first) * 100;

    if (change > 10) return 'improving';
    if (change < -10) return 'degrading';
    return 'stable';
  }

  /**
   * Get nested value from object using dot notation
   * @private
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {*} Value or null if not found
   */
  _getNestedValue(obj, path) {
    try {
      return path.split('.').reduce((current, key) => current && current[key], obj) || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate cache key for operation and data
   * @private
   * @param {string} operation - Operation name
   * @param {Object} data - Data object
   * @returns {string} Cache key
   */
  _getCacheKey(operation, data) {
    const timestamp = data.timestamp || 'no-timestamp';
    const hash = this._hashData(data);
    return `${operation}_${timestamp}_${hash}`;
  }

  /**
   * Simple hash function for data objects
   * @private
   * @param {Object} data - Data to hash
   * @returns {string} Hash string
   */
  _hashData(data) {
    try {
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(36);
    } catch (error) {
      return 'hash-error';
    }
  }

  /**
   * Check and update cache based on timestamp
   * @private
   * @param {Object} data - Data with timestamp
   */
  _checkAndUpdateCache(data) {
    if (!this.config.enableCaching) return;

    const timestamp = data.timestamp;
    if (timestamp && timestamp !== this._lastTimestamp) {
      this._invalidateOldEntries();
      this._lastTimestamp = timestamp;
    }
  }

  /**
   * Invalidate old cache entries
   * @private
   */
  _invalidateOldEntries() {
    if (this._cache.size > this.config.maxCacheSize) {
      // Remove oldest entries (simple FIFO)
      const keysToDelete = Array.from(this._cache.keys()).slice(0, this._cache.size - this.config.maxCacheSize + 10);
      keysToDelete.forEach(key => this._cache.delete(key));
    }
  }

  /**
   * Start cache cleanup interval
   * @private
   */
  _startCacheCleanup() {
    this._cacheCleanupInterval = setInterval(() => {
      this._invalidateOldEntries();
    }, this.config.cacheTimeout);
  }
}
