/**
 * Rate Limiter Tests
 * Tests for the rate limiting middleware functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import {
  generalApiLimiter,
  debugCommandsLimiter,
  cspReportingLimiter,
  getRateLimitStats,
  WebSocketRateLimiter
} from '../../lib/middleware/rate-limiter.js';

describe('Rate Limiting Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('General API Rate Limiter', () => {
    beforeEach(() => {
      app.use('/api/test', generalApiLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests within limit', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(parseInt(response.headers['x-ratelimit-remaining'])).toBeLessThan(100);
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('Debug Commands Rate Limiter', () => {
    beforeEach(() => {
      app.use('/api/debug', debugCommandsLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should have stricter limits for debug commands', async () => {
      const response = await request(app)
        .post('/api/debug')
        .send({ command: 'test' })
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBe('30');
    });
  });

  describe('CSP Reporting Rate Limiter', () => {
    beforeEach(() => {
      app.use('/api/csp-report', cspReportingLimiter, (req, res) => {
        res.status(204).end();
      });
    });

    it('should handle CSP reports with appropriate limits', async () => {
      const response = await request(app)
        .post('/api/csp-report')
        .send({ 'csp-report': { 'blocked-uri': 'test' } })
        .expect(204);

      expect(response.headers['x-ratelimit-limit']).toBe('50');
    });
  });

  describe('Rate Limit Statistics', () => {
    it('should return comprehensive statistics', () => {
      const stats = getRateLimitStats();
      
      expect(stats).toHaveProperty('enabled');
      expect(stats).toHaveProperty('environment');
      expect(stats).toHaveProperty('limits');
      expect(stats).toHaveProperty('timestamp');
      
      expect(stats.limits).toHaveProperty('general_api');
      expect(stats.limits).toHaveProperty('debug_commands');
      expect(stats.limits).toHaveProperty('csp_reporting');
      
      expect(stats.limits.general_api.max).toBe(100);
      expect(stats.limits.debug_commands.max).toBe(30);
      expect(stats.limits.csp_reporting.max).toBe(50);
    });
  });

  describe('WebSocket Rate Limiter', () => {
    let wsLimiter;

    beforeEach(() => {
      wsLimiter = new WebSocketRateLimiter({
        windowMs: 60 * 1000,
        max: 5,
        limitType: 'test_websocket'
      });
    });

    afterEach(() => {
      wsLimiter.destroy();
    });

    it('should allow requests within limit', () => {
      const result = wsLimiter.checkLimit('socket-1');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.retryAfter).toBe(0);
    });

    it('should block requests exceeding limit', () => {
      // Make 5 requests to reach limit
      for (let i = 0; i < 5; i++) {
        wsLimiter.checkLimit('socket-1');
      }
      
      // 6th request should be blocked
      const result = wsLimiter.checkLimit('socket-1');
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track different sockets separately', () => {
      // Make 5 requests for socket-1
      for (let i = 0; i < 5; i++) {
        wsLimiter.checkLimit('socket-1');
      }
      
      // socket-2 should still be allowed
      const result = wsLimiter.checkLimit('socket-2');
      expect(result.allowed).toBe(true);
    });

    it('should provide statistics', () => {
      wsLimiter.checkLimit('socket-1');
      wsLimiter.checkLimit('socket-2');
      
      const stats = wsLimiter.getStats();
      
      expect(stats).toHaveProperty('limitType', 'test_websocket');
      expect(stats).toHaveProperty('windowMs', 60 * 1000);
      expect(stats).toHaveProperty('max', 5);
      expect(stats).toHaveProperty('activeSockets');
      expect(stats).toHaveProperty('totalRequests');
      expect(stats.activeSockets).toBe(2);
      expect(stats.totalRequests).toBe(2);
    });

    it('should cleanup old entries', () => {
      // Mock Date.now to simulate time passage
      const originalNow = Date.now;
      let mockTime = originalNow();
      Date.now = () => mockTime;

      wsLimiter.checkLimit('socket-1');
      
      // Advance time beyond window
      mockTime += 61 * 1000;
      
      wsLimiter.cleanup();
      
      const stats = wsLimiter.getStats();
      expect(stats.activeSockets).toBe(0);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });
});
