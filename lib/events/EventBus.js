/**
 * EventBus Core - Runtime.zyjeski.com
 * High-performance event system for consciousness state changes
 * 
 * Features:
 * - <1ms event dispatch for 10 listeners
 * - Wildcard pattern matching
 * - Built-in performance monitoring
 * - Rolling event history
 * - Error-resilient handler execution
 */

export default class EventBus {
  constructor(options = {}) {
    this.options = {
      historySize: 100,
      performanceThreshold: 10,
      enableWildcards: true,
      debugMode: false,
      ...options
    };

    // Core event storage
    this.listeners = new Map();          // event -> Set of handlers
    this.onceListeners = new Map();      // event -> Set of one-time handlers
    this.wildcardCache = new Map();      // pattern -> compiled regex
    this.wildcardListeners = new Map();  // pattern -> Set of handlers

    // Performance & monitoring
    this.history = [];                   // Rolling buffer of events
    this.metrics = new Map();            // event -> performance stats
    this.frequencyStats = new Map();     // event -> count/timing data

    // Supported event types (consciousness mapping)
    this.supportedEvents = new Set([
      'ProcessCreated',      // New thought pattern emerging
      'ProcessTerminated',   // Mental process resolved
      'CommandExecuted',     // Conscious intervention
      'MemoryAllocated',     // New memory formation
      'ProcessOptimized'     // Coping mechanism activated
    ]);

    this._eventIdCounter = 0;
    this._startTime = performance.now();

    if (this.options.debugMode) {
      console.log('EventBus initialized with options:', this.options);
    }
  }

  /**
   * Subscribe to an event or pattern
   * @param {string} eventPattern - Event name or wildcard pattern
   * @param {Function} handler - Event handler function
   * @returns {EventBus} - For method chaining
   */
  on(eventPattern, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }

    if (eventPattern.includes('*')) {
      if (!this.options.enableWildcards) {
        throw new Error('Wildcard patterns are disabled');
      }
      this._addWildcardListener(eventPattern, handler);
    } else {
      this._addDirectListener(eventPattern, handler);
    }

    return this;
  }

  /**
   * Subscribe to an event for one-time execution
   * @param {string} eventPattern - Event name or wildcard pattern
   * @param {Function} handler - Event handler function
   * @returns {EventBus} - For method chaining
   */
  once(eventPattern, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }

    if (this._isWildcardPattern(eventPattern)) {
      // Wrap handler to auto-remove after execution
      const wrappedHandler = (event) => {
        this.off(eventPattern, wrappedHandler);
        handler(event);
      };
      this._addWildcardListener(eventPattern, wrappedHandler);
    } else {
      if (!this.onceListeners.has(eventPattern)) {
        this.onceListeners.set(eventPattern, new Set());
      }
      this.onceListeners.get(eventPattern).add(handler);
    }

    return this;
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventPattern - Event name or wildcard pattern
   * @param {Function} handler - Event handler function to remove
   * @returns {EventBus} - For method chaining
   */
  off(eventPattern, handler) {
    if (this._isWildcardPattern(eventPattern)) {
      this._removeWildcardListener(eventPattern, handler);
    } else {
      this._removeDirectListener(eventPattern, handler);
    }

    return this;
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventType - Event type to emit
   * @param {Object} data - Event payload data
   * @returns {Object} - The created event object
   */
  emit(eventType, data = {}) {
    const event = this._createEvent(eventType, data);
    const startTime = performance.now();

    // Get all applicable handlers
    const handlers = this._getHandlers(eventType);
    
    // Execute handlers synchronously (fire-and-forget)
    let errorCount = 0;
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        errorCount++;
        if (this.options.debugMode) {
          console.error('EventBus listener error:', {
            eventType,
            error: error.message,
            stack: error.stack
          });
        }
      }
    }

    // Execute and clean up one-time listeners
    if (this.onceListeners.has(eventType)) {
      const onceHandlers = Array.from(this.onceListeners.get(eventType));
      this.onceListeners.delete(eventType);
      
      for (const handler of onceHandlers) {
        try {
          handler(event);
        } catch (error) {
          errorCount++;
          if (this.options.debugMode) {
            console.error('EventBus once-listener error:', {
              eventType,
              error: error.message
            });
          }
        }
      }
    }

    // Record performance metrics
    const dispatchTime = performance.now() - startTime;
    event.performance = {
      dispatchTime,
      listenerCount: handlers.size,
      errorCount
    };

    // Warn about slow handlers
    if (dispatchTime > this.options.performanceThreshold) {
      console.warn(`EventBus: Slow event dispatch for '${eventType}': ${dispatchTime.toFixed(2)}ms`);
    }

    this._addToHistory(event);
    this._updateMetrics(event);

    return event;
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventPattern - Event name or pattern
   * @returns {EventBus} - For method chaining
   */
  removeAllListeners(eventPattern) {
    if (eventPattern) {
      if (this._isWildcardPattern(eventPattern)) {
        this.wildcardListeners.delete(eventPattern);
        this.wildcardCache.delete(eventPattern);
      } else {
        this.listeners.delete(eventPattern);
        this.onceListeners.delete(eventPattern);
      }
    } else {
      // Remove all listeners
      this.listeners.clear();
      this.onceListeners.clear();
      this.wildcardListeners.clear();
      this.wildcardCache.clear();
    }

    return this;
  }

  /**
   * Check if event has any listeners
   * @param {string} eventType - Event type to check
   * @returns {boolean} - True if has listeners
   */
  hasListeners(eventType) {
    return this.listenerCount(eventType) > 0;
  }

  /**
   * Count listeners for an event
   * @param {string} eventType - Event type to count
   * @returns {number} - Number of listeners
   */
  listenerCount(eventType) {
    let count = 0;

    // Direct listeners
    if (this.listeners.has(eventType)) {
      count += this.listeners.get(eventType).size;
    }

    // Once listeners
    if (this.onceListeners.has(eventType)) {
      count += this.onceListeners.get(eventType).size;
    }

    // Wildcard listeners
    for (const [pattern, handlers] of this.wildcardListeners) {
      if (this._matchesWildcard(pattern, eventType)) {
        count += handlers.size;
      }
    }

    return count;
  }

  /**
   * Get event history
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} - Array of recent events
   */
  getHistory(limit = this.options.historySize) {
    return this.history.slice(-limit);
  }

  /**
   * Get performance metrics
   * @returns {Object} - Performance statistics
   */
  getPerformanceMetrics() {
    const metrics = {};
    for (const [eventType, stats] of this.metrics) {
      metrics[eventType] = { ...stats };
    }
    return metrics;
  }

  /**
   * Get frequency statistics
   * @returns {Object} - Event frequency data
   */
  getFrequencyStats() {
    const stats = {};
    for (const [eventType, data] of this.frequencyStats) {
      stats[eventType] = { ...data };
    }
    return stats;
  }

  // Private Methods

  /**
   * Check if pattern contains wildcards
   * @private
   */
  _isWildcardPattern(pattern) {
    return this.options.enableWildcards && pattern.includes('*');
  }

  /**
   * Add direct event listener
   * @private
   */
  _addDirectListener(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(handler);
  }

  /**
   * Add wildcard event listener
   * @private
   */
  _addWildcardListener(pattern, handler) {
    if (!this.wildcardListeners.has(pattern)) {
      this.wildcardListeners.set(pattern, new Set());
      this.wildcardCache.set(pattern, this._compileWildcard(pattern));
    }
    this.wildcardListeners.get(pattern).add(handler);
  }

  /**
   * Remove direct event listener
   * @private
   */
  _removeDirectListener(eventType, handler) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(handler);
      if (this.listeners.get(eventType).size === 0) {
        this.listeners.delete(eventType);
      }
    }
    if (this.onceListeners.has(eventType)) {
      this.onceListeners.get(eventType).delete(handler);
      if (this.onceListeners.get(eventType).size === 0) {
        this.onceListeners.delete(eventType);
      }
    }
  }

  /**
   * Remove wildcard event listener
   * @private
   */
  _removeWildcardListener(pattern, handler) {
    if (this.wildcardListeners.has(pattern)) {
      this.wildcardListeners.get(pattern).delete(handler);
      if (this.wildcardListeners.get(pattern).size === 0) {
        this.wildcardListeners.delete(pattern);
        this.wildcardCache.delete(pattern);
      }
    }
  }

  /**
   * Compile wildcard pattern to regex
   * @private
   */
  _compileWildcard(pattern) {
    // Convert 'process.*' to regex that matches 'process.created', etc.
    const regexStr = pattern
      .split('.')
      .map(part => part === '*' ? '[^.]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('\\.');
    return new RegExp(`^${regexStr}$`);
  }

  /**
   * Check if event matches wildcard pattern
   * @private
   */
  _matchesWildcard(pattern, eventType) {
    const regex = this.wildcardCache.get(pattern);
    return regex ? regex.test(eventType) : false;
  }

  /**
   * Get all handlers for an event type
   * @private
   */
  _getHandlers(eventType) {
    const handlers = new Set();

    // Direct listeners
    if (this.listeners.has(eventType)) {
      for (const handler of this.listeners.get(eventType)) {
        handlers.add(handler);
      }
    }

    // Wildcard listeners
    for (const [pattern, patternHandlers] of this.wildcardListeners) {
      if (this._matchesWildcard(pattern, eventType)) {
        for (const handler of patternHandlers) {
          handlers.add(handler);
        }
      }
    }

    return handlers;
  }

  /**
   * Create event object
   * @private
   */
  _createEvent(eventType, data) {
    return {
      id: `evt_${Date.now()}_${(++this._eventIdCounter).toString(36)}`,
      type: eventType,
      timestamp: Date.now(),
      data: { ...data },
      performance: null // Will be filled by emit()
    };
  }

  /**
   * Add event to history buffer
   * @private
   */
  _addToHistory(event) {
    this.history.push(event);
    if (this.history.length > this.options.historySize) {
      this.history.shift();
    }
  }

  /**
   * Update performance metrics
   * @private
   */
  _updateMetrics(event) {
    const { type, performance } = event;

    if (!this.metrics.has(type)) {
      this.metrics.set(type, {
        totalEvents: 0,
        totalDispatchTime: 0,
        avgDispatchTime: 0,
        maxDispatchTime: 0,
        minDispatchTime: Infinity,
        totalErrors: 0
      });
    }

    const stats = this.metrics.get(type);
    stats.totalEvents++;
    stats.totalDispatchTime += performance.dispatchTime;
    stats.avgDispatchTime = stats.totalDispatchTime / stats.totalEvents;
    stats.maxDispatchTime = Math.max(stats.maxDispatchTime, performance.dispatchTime);
    stats.minDispatchTime = Math.min(stats.minDispatchTime, performance.dispatchTime);
    stats.totalErrors += performance.errorCount;

    // Update frequency stats
    if (!this.frequencyStats.has(type)) {
      this.frequencyStats.set(type, {
        count: 0,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        avgInterval: 0
      });
    }

    const freqStats = this.frequencyStats.get(type);
    const prevCount = freqStats.count;
    freqStats.count++;
    freqStats.lastSeen = event.timestamp;

    if (prevCount > 0) {
      const totalTime = freqStats.lastSeen - freqStats.firstSeen;
      freqStats.avgInterval = totalTime / prevCount;
    }
  }
}
