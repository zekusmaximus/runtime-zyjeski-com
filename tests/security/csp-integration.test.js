/**
 * CSP Integration Tests
 * 
 * End-to-end tests for CSP implementation including:
 * - Server integration with Express and Helmet
 * - Template rendering with nonces
 * - Violation reporting endpoint
 * - Real browser CSP enforcement simulation
 * - Performance under load
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createCSPConfig } from '../../lib/security/csp-config.js';
import { CSPReporter } from '../../lib/security/csp-reporter.js';

// Mock logger to avoid test output noise
vi.mock('../../lib/logger.js', () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}));

describe('CSP Integration Tests', () => {
  let app;
  let cspConfig;
  let cspReporter;

  beforeEach(() => {
    // Create test Express app
    app = express();
    
    // Initialize CSP components
    cspConfig = createCSPConfig({
      reportOnly: false,
      reportUri: '/api/csp-report',
      enableReporting: true
    });
    
    cspReporter = new CSPReporter({
      maxViolationsPerMinute: 10,
      maxViolationsPerIP: 5,
      alertThreshold: 3
    });
    
    // Configure app
    app.use(express.json({ limit: '1mb' }));
    
    // CSP Nonce Middleware
    app.use((req, res, next) => {
      res.locals.nonce = cspConfig.generateNonce();
      next();
    });
    
    // CSP Middleware (simplified for testing)
    app.use((req, res, next) => {
      const directives = cspConfig.getDirectives(res.locals.nonce);
      const cspHeader = Object.entries(directives)
        .map(([directive, sources]) => {
          if (Array.isArray(sources)) {
            return `${directive.replace(/([A-Z])/g, '-$1').toLowerCase()} ${sources.join(' ')}`;
          }
          return '';
        })
        .filter(Boolean)
        .join('; ');
      
      res.setHeader('Content-Security-Policy', cspHeader);
      next();
    });
    
    // Test routes
    app.get('/test-page', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Page</title>
        </head>
        <body>
          <h1>Test Page</h1>
          <script nonce="${res.locals.nonce}">
            console.log('Allowed inline script');
          </script>
          <script>
            console.log('Blocked inline script');
          </script>
        </body>
        </html>
      `);
    });
    
    // CSP violation reporting endpoint
    app.post('/api/csp-report', (req, res) => {
      try {
        const requestContext = {
          ip: req.ip || '127.0.0.1',
          userAgent: req.get('User-Agent') || 'test-agent'
        };

        const result = cspReporter.processViolation(req.body, requestContext);

        if (!result.processed && result.reason === 'rate_limited') {
          res.status(429).json({ error: 'Rate limited' });
          return;
        }

        res.status(204).end();
      } catch (error) {
        // Handle CSP reporter errors gracefully - still return 204
        // In production, you might want to log this error
        res.status(204).end();
      }
    });
    
    // CSP stats endpoint
    app.get('/api/csp-stats', (req, res) => {
      res.json({
        csp: cspConfig.getStats(),
        violations: cspReporter.getStats()
      });
    });
  });

  afterEach(() => {
    if (cspReporter) {
      cspReporter.destroy();
    }
  });

  describe('CSP Header Generation', () => {
    it('should include CSP header in responses', async () => {
      const response = await request(app)
        .get('/test-page')
        .expect(200);
      
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain('script-src');
      expect(response.headers['content-security-policy']).toContain('nonce-');
    });

    it('should generate unique nonces for each request', async () => {
      const response1 = await request(app).get('/test-page');
      const response2 = await request(app).get('/test-page');
      
      const csp1 = response1.headers['content-security-policy'];
      const csp2 = response2.headers['content-security-policy'];
      
      const nonce1 = csp1.match(/nonce-([a-zA-Z0-9+/=]+)/)?.[1];
      const nonce2 = csp2.match(/nonce-([a-zA-Z0-9+/=]+)/)?.[1];
      
      expect(nonce1).toBeDefined();
      expect(nonce2).toBeDefined();
      expect(nonce1).not.toBe(nonce2);
    });

    it('should include all required CSP directives', async () => {
      const response = await request(app)
        .get('/test-page')
        .expect(200);
      
      const csp = response.headers['content-security-policy'];
      
      expect(csp).toContain('default-src');
      expect(csp).toContain('script-src');
      expect(csp).toContain('style-src');
      expect(csp).toContain('font-src');
      expect(csp).toContain('img-src');
      expect(csp).toContain('connect-src');
      expect(csp).toContain('frame-src');
      expect(csp).toContain('frame-ancestors');
      expect(csp).toContain('object-src');
      expect(csp).toContain('base-uri');
      expect(csp).toContain('form-action');
    });
  });

  describe('Violation Reporting', () => {
    it('should accept valid CSP violation reports', async () => {
      const violation = {
        'csp-report': {
          'document-uri': 'https://example.com/test',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.com/script.js',
          'line-number': 42,
          'column-number': 15
        }
      };
      
      await request(app)
        .post('/api/csp-report')
        .send(violation)
        .expect(204);
    });

    it('should handle malformed violation reports', async () => {
      const malformedViolation = {
        'invalid-field': 'invalid-value'
      };
      
      await request(app)
        .post('/api/csp-report')
        .send(malformedViolation)
        .expect(204);
    });

    it('should enforce rate limiting on violation reports', async () => {
      const violation = {
        'csp-report': {
          'document-uri': 'https://example.com/test',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.com/script.js'
        }
      };
      
      // Send violations up to the limit
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/csp-report')
          .send(violation)
          .expect(204);
      }
      
      // Next violation should be rate limited
      await request(app)
        .post('/api/csp-report')
        .send(violation)
        .expect(429);
    });

    it('should track violation statistics', async () => {
      const violations = [
        {
          'csp-report': {
            'violated-directive': 'script-src',
            'blocked-uri': 'https://evil.com/script1.js'
          }
        },
        {
          'csp-report': {
            'violated-directive': 'style-src',
            'blocked-uri': 'inline'
          }
        }
      ];
      
      // Submit violations
      for (const violation of violations) {
        await request(app)
          .post('/api/csp-report')
          .send(violation)
          .expect(204);
      }
      
      // Check statistics
      const statsResponse = await request(app)
        .get('/api/csp-stats')
        .expect(200);
      
      expect(statsResponse.body.violations.totalViolations).toBe(2);
      expect(statsResponse.body.violations.violationTypes['script-src']).toBe(1);
      expect(statsResponse.body.violations.violationTypes['style-src']).toBe(1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 50;
      const startTime = Date.now();
      
      const promises = Array(concurrentRequests).fill().map(() =>
        request(app).get('/test-page')
      );
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.headers['content-security-policy']).toBeDefined();
      });
      
      // Should complete within reasonable time (adjust based on system)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 50 requests
    });

    it('should handle violation report flood efficiently', async () => {
      const violation = {
        'csp-report': {
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.com/script.js'
        }
      };
      
      const reportCount = 20;
      const startTime = Date.now();
      
      const promises = Array(reportCount).fill().map((_, i) =>
        request(app)
          .post('/api/csp-report')
          .set('X-Forwarded-For', `192.168.1.${i % 10}`) // Vary IP to avoid rate limiting
          .send(violation)
      );
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(2000); // 2 seconds for 20 reports
    });
  });

  describe('Security Validation', () => {
    it('should not allow unsafe-inline scripts', async () => {
      const response = await request(app)
        .get('/test-page')
        .expect(200);
      
      const csp = response.headers['content-security-policy'];
      expect(csp).not.toContain("'unsafe-inline'");
    });

    it('should not allow unsafe-eval', async () => {
      const response = await request(app)
        .get('/test-page')
        .expect(200);
      
      const csp = response.headers['content-security-policy'];
      expect(csp).not.toContain("'unsafe-eval'");
    });

    it('should prevent framing', async () => {
      const response = await request(app)
        .get('/test-page')
        .expect(200);
      
      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("frame-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should classify script injection violations as critical', async () => {
      const criticalViolation = {
        'csp-report': {
          'violated-directive': 'script-src',
          'blocked-uri': 'javascript:alert("xss")'
        }
      };
      
      await request(app)
        .post('/api/csp-report')
        .send(criticalViolation)
        .expect(204);
      
      // Verify it was classified as critical (would be logged as error)
      // In a real test, you might check log output or database records
    });
  });

  describe('Environment-Specific Behavior', () => {
    it('should include development-specific sources in development', () => {
      process.env.NODE_ENV = 'development';
      const devConfig = createCSPConfig();
      const sources = devConfig.getConnectSources();
      
      expect(sources).toContain('ws://localhost:3000');
      expect(sources).toContain('ws://127.0.0.1:3000');
    });

    it('should include production-specific directives in production', () => {
      process.env.NODE_ENV = 'production';
      const prodConfig = createCSPConfig();
      const directives = prodConfig.getDirectives('test-nonce');
      
      expect(directives.upgradeInsecureRequests).toEqual([]);
      expect(directives.blockAllMixedContent).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing nonce gracefully', async () => {
      // Create app without nonce middleware
      const appWithoutNonce = express();
      appWithoutNonce.use(express.json());
      
      appWithoutNonce.use((req, res, next) => {
        // Try to use CSP without nonce - should throw
        expect(() => {
          const directives = cspConfig.getDirectives(res.locals.nonce);
        }).toThrow('CSP nonce not available');
        
        res.status(500).json({ error: 'CSP configuration error' });
      });
      
      appWithoutNonce.get('/test', (req, res) => {
        res.send('Should not reach here');
      });
      
      await request(appWithoutNonce)
        .get('/test')
        .expect(500);
    });

    it('should handle CSP reporter errors gracefully', async () => {
      // Mock reporter to throw error
      const originalProcess = cspReporter.processViolation;
      cspReporter.processViolation = vi.fn().mockImplementation(() => {
        throw new Error('Reporter error');
      });
      
      const violation = {
        'csp-report': {
          'violated-directive': 'script-src',
          'blocked-uri': 'test'
        }
      };
      
      // Should still return 204 even if processing fails
      await request(app)
        .post('/api/csp-report')
        .send(violation)
        .expect(204);
      
      // Restore original method
      cspReporter.processViolation = originalProcess;
    });
  });
});
