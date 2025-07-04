// WebSocket Validation Middleware for Runtime.zyjeski.com
// Provides wrapper functions to integrate validation with existing handlers

import SocketValidator from './socket-validator.js';
import { info, error } from '../logger.js';

// Create singleton validator instance
const validator = new SocketValidator();

/**
 * Create a validated wrapper for a WebSocket event handler
 * @param {Function} handler - Original handler function
 * @param {string} eventName - Name of the WebSocket event
 * @returns {Function} Wrapped handler with validation
 */
export function createValidatedHandler(handler, eventName) {
  return async function validatedHandler(data) {
    const startTime = process.hrtime.bigint();
    
    // Validate the incoming data
    const validation = validator.validate(eventName, data);
    
    const validationTime = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to ms
    
    if (!validation.valid) {
      // Log validation failure for security monitoring (without sensitive data)
      const logData = {
        event: eventName,
        errors: validation.errors,
        socketId: this.id,
        timestamp: new Date().toISOString(),
        validationTimeMs: validationTime.toFixed(3)
      };
      
      // Use different log levels based on error type
      if (validation.errors.some(err => err.includes('Unknown event type'))) {
        error('Unknown WebSocket event attempted', logData);
      } else if (validation.errors.some(err => err.includes('Unknown field'))) {
        error('WebSocket validation failed - suspicious payload', logData);
      } else {
        info('WebSocket validation failed - malformed request', logData);
      }
      
      // Send safe error response to client
      this.emit('validation-error', {
        event: eventName,
        errors: validation.errors,
        timestamp: Date.now()
      });
      
      return;
    }

    // Log successful validation in debug mode
    if (process.env.NODE_ENV !== 'production') {
      info(`WebSocket event validated successfully`, {
        event: eventName,
        socketId: this?.id || 'unknown',
        validationTimeMs: validationTime.toFixed(3)
      });
    }

    try {
      // Call the original handler with validated data
      await handler.call(this, validation.data);
    } catch (handlerError) {
      // Log handler errors without exposing internal details
      error(`Handler error for WebSocket event`, {
        event: eventName,
        socketId: this.id,
        error: handlerError.message,
        timestamp: new Date().toISOString()
      });
      
      // Send generic error response
      this.emit('handler-error', {
        event: eventName,
        message: 'Internal server error',
        timestamp: Date.now()
      });
    }
  };
}

/**
 * Register all validated handlers for a socket connection
 * @param {Socket} socket - Socket.io socket instance
 * @param {Object} handlers - Object containing handler functions
 */
export function registerValidatedHandlers(socket, handlers) {
  // Debug handlers
  if (handlers.debugCommand) {
    socket.on('debug-command', createValidatedHandler(handlers.debugCommand, 'debug-command'));
  }
  
  if (handlers.debugUndo) {
    socket.on('debug-undo', createValidatedHandler(handlers.debugUndo, 'debug-undo'));
  }
  
  if (handlers.debugRedo) {
    socket.on('debug-redo', createValidatedHandler(handlers.debugRedo, 'debug-redo'));
  }
  
  if (handlers.debugHistory) {
    socket.on('debug-history', createValidatedHandler(handlers.debugHistory, 'debug-history'));
  }
  
  if (handlers.debugStatus) {
    socket.on('debug-status', createValidatedHandler(handlers.debugStatus, 'debug-status'));
  }

  // Monitor handlers
  if (handlers.startMonitoring) {
    socket.on('start-monitoring', createValidatedHandler(handlers.startMonitoring, 'start-monitoring'));
  }
  
  if (handlers.stopMonitoring) {
    socket.on('stop-monitoring', createValidatedHandler(handlers.stopMonitoring, 'stop-monitoring'));
  }
  
  if (handlers.monitorGetCharacters) {
    socket.on('monitor:get-characters', createValidatedHandler(handlers.monitorGetCharacters, 'monitor:get-characters'));
  }
  
  if (handlers.monitorStart) {
    socket.on('monitor:start', createValidatedHandler(handlers.monitorStart, 'monitor:start'));
  }
  
  if (handlers.refreshMonitor) {
    socket.on('refresh-monitor', createValidatedHandler(handlers.refreshMonitor, 'refresh-monitor'));
  }
  
  if (handlers.getSystemResources) {
    socket.on('get-system-resources', createValidatedHandler(handlers.getSystemResources, 'get-system-resources'));
  }
  
  if (handlers.getErrorLogs) {
    socket.on('get-error-logs', createValidatedHandler(handlers.getErrorLogs, 'get-error-logs'));
  }
  
  if (handlers.getMemoryAllocation) {
    socket.on('get-memory-allocation', createValidatedHandler(handlers.getMemoryAllocation, 'get-memory-allocation'));
  }

  // Consciousness handlers
  if (handlers.playerIntervention) {
    socket.on('player-intervention', createValidatedHandler(handlers.playerIntervention, 'player-intervention'));
  }
  
  if (handlers.requestUpdate) {
    socket.on('request-update', createValidatedHandler(handlers.requestUpdate, 'request-update'));
  }
}

/**
 * Wrap individual handler function with validation
 * Useful for handlers that need custom registration logic
 * @param {Function} handler - Handler function to wrap
 * @param {string} eventName - Event name for validation
 * @returns {Function} Wrapped handler
 */
export function wrapHandler(handler, eventName) {
  return createValidatedHandler(handler, eventName);
}

/**
 * Get validation statistics for monitoring
 * @returns {Object} Validation statistics
 */
export function getValidationStats() {
  return {
    supportedEvents: validator.getSupportedEvents(),
    validatorCount: validator.getSupportedEvents().length,
    initialized: true
  };
}

/**
 * Check if an event is supported by the validator
 * @param {string} eventName - Event name to check
 * @returns {boolean} True if supported
 */
export function isEventSupported(eventName) {
  return validator.isEventSupported(eventName);
}
