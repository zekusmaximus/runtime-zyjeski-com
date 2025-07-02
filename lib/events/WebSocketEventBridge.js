/**
 * WebSocketEventBridge - Runtime.zyjeski.com
 * Bridges EventBus events to WebSocket clients for real-time UI updates
 * 
 * Features:
 * - Forwards EventBus events to WebSocket clients
 * - Supports wildcard pattern subscriptions
 * - Filters events for client relevance
 * - Maintains clean event forwarding architecture
 * - Handles client connection/disconnection
 */

export default class WebSocketEventBridge {
  /**
   * Create a new WebSocketEventBridge
   * @param {EventBus} eventBus - EventBus instance to subscribe to
   * @param {Server} io - Socket.io server instance
   * @param {Object} options - Configuration options
   */
  constructor(eventBus, io, options = {}) {
    this.eventBus = eventBus;
    this.io = io;
    this.options = {
      enableDebugLogging: false,
      filterSensitiveData: true,
      maxEventRate: 100, // events per second per client
      ...options
    };
    
    // Track client event rates for throttling
    this.clientEventRates = new Map();
    this.eventSubscriptions = [];
    
    this.setupEventForwarding();
    
    if (this.options.enableDebugLogging) {
      console.log('WebSocketEventBridge initialized');
    }
  }

  /**
   * Set up event forwarding from EventBus to WebSocket clients
   */
  setupEventForwarding() {
    // Forward all process events to connected clients using wildcard pattern
    const processEventHandler = (event) => {
      this.forwardEvent('consciousness-event', {
        type: event.type,
        data: this.filterEventData(event.data, event.type),
        timestamp: event.timestamp,
        performance: event.performance
      });
    };

    // Subscribe to individual process events (EventBus doesn't support simple * wildcards)
    this.eventBus.on('ProcessCreated', processEventHandler);
    this.eventBus.on('ProcessTerminated', processEventHandler);
    this.eventBus.on('ProcessOptimized', processEventHandler);
    this.eventSubscriptions.push({ pattern: 'ProcessCreated', handler: processEventHandler });
    this.eventSubscriptions.push({ pattern: 'ProcessTerminated', handler: processEventHandler });
    this.eventSubscriptions.push({ pattern: 'ProcessOptimized', handler: processEventHandler });

    // Forward command events for UI updates
    const commandEventHandler = (event) => {
      this.forwardEvent('command-event', {
        type: event.type,
        data: this.filterEventData(event.data, event.type),
        timestamp: event.timestamp,
        performance: event.performance
      });
    };

    this.eventBus.on('CommandExecuted', commandEventHandler);
    this.eventSubscriptions.push({ pattern: 'CommandExecuted', handler: commandEventHandler });

    // Forward memory events for visualization
    const memoryEventHandler = (event) => {
      this.forwardEvent('memory-event', {
        type: event.type,
        data: this.filterEventData(event.data, event.type),
        timestamp: event.timestamp,
        performance: event.performance
      });
    };

    this.eventBus.on('MemoryAllocated', memoryEventHandler);
    this.eventSubscriptions.push({ pattern: 'MemoryAllocated', handler: memoryEventHandler });

    if (this.options.enableDebugLogging) {
      console.log('WebSocketEventBridge: Event forwarding configured');
    }
  }

  /**
   * Forward an event to all connected WebSocket clients
   * @param {string} eventName - WebSocket event name
   * @param {Object} eventData - Event data to send
   */
  forwardEvent(eventName, eventData) {
    if (!this.io) {
      return;
    }

    // Get all connected clients
    const connectedClients = this.io.sockets.sockets;
    
    connectedClients.forEach((socket, socketId) => {
      // Check rate limiting for this client
      if (this.isClientRateLimited(socketId)) {
        if (this.options.enableDebugLogging) {
          console.warn(`WebSocketEventBridge: Rate limiting client ${socketId}`);
        }
        return;
      }

      // Send event to client
      try {
        socket.emit(eventName, eventData);
        this.updateClientEventRate(socketId);
        
        if (this.options.enableDebugLogging) {
          console.log(`WebSocketEventBridge: Forwarded ${eventName} to client ${socketId}`);
        }
      } catch (error) {
        console.error(`WebSocketEventBridge: Failed to send event to client ${socketId}:`, error);
      }
    });
  }

  /**
   * Filter event data to remove sensitive information
   * @param {Object} data - Original event data
   * @param {string} eventType - Type of event
   * @returns {Object} Filtered event data
   */
  filterEventData(data, eventType) {
    if (!this.options.filterSensitiveData) {
      return data;
    }

    const filtered = { ...data };

    // Remove sensitive fields based on event type
    switch (eventType) {
      case 'ProcessCreated':
      case 'ProcessTerminated':
      case 'ProcessOptimized':
        // Keep process events as-is for now
        break;
        
      case 'CommandExecuted':
        // Remove detailed error stack traces
        if (filtered.error && typeof filtered.error === 'object') {
          filtered.error = filtered.error.message || 'Command execution failed';
        }
        break;
        
      case 'MemoryAllocated':
        // Remove internal memory addresses
        if (filtered.address && typeof filtered.address === 'string' && filtered.address.length > 20) {
          filtered.address = filtered.address.substring(0, 20) + '...';
        }
        break;
    }

    return filtered;
  }

  /**
   * Check if a client is rate limited
   * @param {string} socketId - Client socket ID
   * @returns {boolean} True if client is rate limited
   */
  isClientRateLimited(socketId) {
    const now = Date.now();
    const clientRate = this.clientEventRates.get(socketId);
    
    if (!clientRate) {
      return false;
    }

    // Reset rate counter every second
    if (now - clientRate.lastReset > 1000) {
      clientRate.count = 0;
      clientRate.lastReset = now;
      return false;
    }

    return clientRate.count >= this.options.maxEventRate;
  }

  /**
   * Update client event rate tracking
   * @param {string} socketId - Client socket ID
   */
  updateClientEventRate(socketId) {
    const now = Date.now();
    let clientRate = this.clientEventRates.get(socketId);
    
    if (!clientRate) {
      clientRate = {
        count: 0,
        lastReset: now
      };
      this.clientEventRates.set(socketId, clientRate);
    }

    // Reset counter if more than a second has passed
    if (now - clientRate.lastReset > 1000) {
      clientRate.count = 1;
      clientRate.lastReset = now;
    } else {
      clientRate.count++;
    }
  }

  /**
   * Handle client disconnection
   * @param {string} socketId - Disconnected client socket ID
   */
  handleClientDisconnect(socketId) {
    this.clientEventRates.delete(socketId);
    
    if (this.options.enableDebugLogging) {
      console.log(`WebSocketEventBridge: Client ${socketId} disconnected, cleaned up rate tracking`);
    }
  }

  /**
   * Get bridge statistics
   * @returns {Object} Bridge statistics
   */
  getStatistics() {
    return {
      connectedClients: this.io ? this.io.sockets.sockets.size : 0,
      trackedClients: this.clientEventRates.size,
      eventSubscriptions: this.eventSubscriptions.length,
      maxEventRate: this.options.maxEventRate
    };
  }

  /**
   * Shutdown the bridge and clean up subscriptions
   */
  shutdown() {
    // Remove all event subscriptions
    this.eventSubscriptions.forEach(({ pattern, handler }) => {
      this.eventBus.off(pattern, handler);
    });
    
    this.eventSubscriptions = [];
    this.clientEventRates.clear();
    
    if (this.options.enableDebugLogging) {
      console.log('WebSocketEventBridge: Shutdown complete');
    }
  }
}
