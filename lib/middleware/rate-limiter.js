/**
 * Rate Limiting Middleware for Runtime.zyjeski.com
 * 
 * Implements comprehensive rate limiting for different endpoint types:
 * - General API: 100 requests per 15 minutes
 * - Auth endpoints: 5 requests per 15 minutes (future)
 * - Debug commands: 30 requests per minute
 * - CSP reporting: 50 requests per 5 minutes
 * 
 * Features:
 * - IP-based limiting with proper headers
 * - Development bypass capability
 * - Detailed logging and monitoring
 * - Custom error messages per endpoint type
 * - HTTP 429 status codes with retry-after headers
 */

import rateLimit from 'express-rate-limit';
import { info, warn, error } from '../logger.js';

/**
 * Create a standardized rate limit handler with logging
 * @param {string} limitType - Type of limit for logging purposes
 * @returns {Function} Rate limit handler function
 */
function createRateLimitHandler(limitType) {
  return (req, res, next) => {
    const clientInfo = {
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      endpoint: req.originalUrl || req.url,
      method: req.method
    };

    warn(`Rate limit exceeded for ${limitType}`, {
      ...clientInfo,
      limitType,
      timestamp: new Date().toISOString()
    });

    // Send standardized rate limit response
    res.status(429).json({
      error: 'Too Many Requests',
      message: getRateLimitMessage(limitType),
      type: 'rate_limit_exceeded',
      limitType,
      retryAfter: res.get('Retry-After'),
      timestamp: new Date().toISOString()
    });
  };
}

/**
 * Get appropriate error message for rate limit type
 * @param {string} limitType - Type of rate limit
 * @returns {string} User-friendly error message
 */
function getRateLimitMessage(limitType) {
  const messages = {
    'general_api': 'Too many API requests. Please wait before making more requests.',
    'auth': 'Too many authentication attempts. Please wait before trying again.',
    'debug_commands': 'Too many debug commands. Please wait before executing more commands.',
    'csp_reporting': 'Too many CSP violation reports. Reporting temporarily throttled.',
    'default': 'Too many requests. Please wait before making more requests.'
  };

  return messages[limitType] || messages.default;
}

/**
 * Create rate limiter with development bypass
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter middleware
 */
function createRateLimiter(options) {
  const {
    windowMs,
    max,
    limitType,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    standardHeaders = true,
    legacyHeaders = false
  } = options;

  // Skip rate limiting in development if enabled
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMITING === 'true') {
    info(`Rate limiting disabled for ${limitType} in development mode`);
    return (req, res, next) => next();
  }

  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Force standard headers
    legacyHeaders: false,  // Disable legacy headers
    skipSuccessfulRequests,
    skipFailedRequests,
    
    // Custom key generator for better IP detection
    keyGenerator: (req) => {
      return req.ip || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress || 
             req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             'unknown';
    },

    // Custom handler for rate limit exceeded
    handler: createRateLimitHandler(limitType),

    // Skip function for health checks and static assets
    skip: (req) => {
      // Skip for health check endpoints
      if (req.path === '/health' || req.path === '/ping') {
        return true;
      }
      
      // Skip for static assets in development
      if (process.env.NODE_ENV === 'development' && 
          (req.path.startsWith('/css/') || 
           req.path.startsWith('/js/') || 
           req.path.startsWith('/images/'))) {
        return true;
      }
      
      return false;
    },

    // Custom store for future Redis integration
    store: undefined // Uses default memory store
  });

  return limiter;
}

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const generalApiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  limitType: 'general_api',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Authentication endpoints rate limiter (future use)
 * 5 requests per 15 minutes
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  limitType: 'auth',
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  skipFailedRequests: false    // Count failed attempts
});

/**
 * Debug commands rate limiter
 * 30 requests per minute
 */
export const debugCommandsLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  limitType: 'debug_commands',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * CSP reporting rate limiter
 * 50 requests per 5 minutes
 */
export const cspReportingLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  limitType: 'csp_reporting',
  skipSuccessfulRequests: false,
  skipFailedRequests: true // Don't count failed CSP reports
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour
 */
export const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  limitType: 'strict',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

/**
 * Get rate limiting statistics for monitoring
 * @returns {Object} Rate limiting statistics
 */
export function getRateLimitStats() {
  // This would be enhanced with Redis store statistics in production
  return {
    enabled: process.env.NODE_ENV !== 'development' || process.env.DISABLE_RATE_LIMITING !== 'true',
    environment: process.env.NODE_ENV || 'production',
    limits: {
      general_api: { windowMs: 15 * 60 * 1000, max: 100 },
      auth: { windowMs: 15 * 60 * 1000, max: 5 },
      debug_commands: { windowMs: 60 * 1000, max: 30 },
      csp_reporting: { windowMs: 5 * 60 * 1000, max: 50 },
      strict: { windowMs: 60 * 60 * 1000, max: 10 }
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Middleware to add rate limit headers to all responses
 * Provides transparency about current rate limit status
 */
export function rateLimitHeadersMiddleware(req, res, next) {
  // Add custom headers for rate limit transparency
  const originalSend = res.send;
  
  res.send = function(data) {
    // Add rate limit info headers if not already present
    if (!res.get('X-RateLimit-Policy')) {
      res.set('X-RateLimit-Policy', 'runtime-zyjeski-com-v1');
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * WebSocket Rate Limiter for debug commands
 * Tracks WebSocket events per socket ID with time windows
 */
export class WebSocketRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // 1 minute default
    this.max = options.max || 30; // 30 requests per minute default
    this.limitType = options.limitType || 'websocket_debug';

    // Track requests per socket ID
    this.socketRequests = new Map();

    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a socket is within rate limits
   * @param {string} socketId - Socket ID to check
   * @returns {Object} Rate limit check result
   */
  checkLimit(socketId) {
    const now = Date.now();
    const socketData = this.socketRequests.get(socketId) || { requests: [], blocked: false };

    // Remove old requests outside the window
    socketData.requests = socketData.requests.filter(timestamp =>
      now - timestamp < this.windowMs
    );

    // Check if limit exceeded
    if (socketData.requests.length >= this.max) {
      socketData.blocked = true;
      this.socketRequests.set(socketId, socketData);

      warn(`WebSocket rate limit exceeded for ${this.limitType}`, {
        socketId,
        requestCount: socketData.requests.length,
        limitType: this.limitType,
        windowMs: this.windowMs,
        max: this.max,
        timestamp: new Date().toISOString()
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...socketData.requests) + this.windowMs,
        retryAfter: Math.ceil((Math.min(...socketData.requests) + this.windowMs - now) / 1000)
      };
    }

    // Add current request
    socketData.requests.push(now);
    socketData.blocked = false;
    this.socketRequests.set(socketId, socketData);

    return {
      allowed: true,
      remaining: this.max - socketData.requests.length,
      resetTime: Math.min(...socketData.requests) + this.windowMs,
      retryAfter: 0
    };
  }

  /**
   * Clean up old socket data
   */
  cleanup() {
    const now = Date.now();
    for (const [socketId, socketData] of this.socketRequests.entries()) {
      // Remove requests outside the window
      socketData.requests = socketData.requests.filter(timestamp =>
        now - timestamp < this.windowMs
      );

      // Remove socket data if no recent requests
      if (socketData.requests.length === 0) {
        this.socketRequests.delete(socketId);
      } else {
        this.socketRequests.set(socketId, socketData);
      }
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats() {
    return {
      limitType: this.limitType,
      windowMs: this.windowMs,
      max: this.max,
      activeSockets: this.socketRequests.size,
      totalRequests: Array.from(this.socketRequests.values())
        .reduce((total, socketData) => total + socketData.requests.length, 0),
      blockedSockets: Array.from(this.socketRequests.values())
        .filter(socketData => socketData.blocked).length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Destroy the rate limiter and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.socketRequests.clear();
  }
}

// Create WebSocket rate limiter for debug commands
export const wsDebugCommandsLimiter = new WebSocketRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 debug commands per minute
  limitType: 'websocket_debug_commands'
});

export default {
  generalApiLimiter,
  authLimiter,
  debugCommandsLimiter,
  cspReportingLimiter,
  strictLimiter,
  getRateLimitStats,
  rateLimitHeadersMiddleware,
  WebSocketRateLimiter,
  wsDebugCommandsLimiter
};
