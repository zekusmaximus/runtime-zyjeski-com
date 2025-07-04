/**
 * CSP Reporter Tests
 * 
 * Comprehensive tests for CSP violation reporting including:
 * - Violation processing and sanitization
 * - Threat classification and severity assessment
 * - Rate limiting and abuse prevention
 * - Performance monitoring
 * - Statistics tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CSPReporter } from '../../lib/security/csp-reporter.js';

describe('CSPReporter', () => {
  let reporter;

  beforeEach(() => {
    // Mock console methods to avoid test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (reporter) {
      reporter.destroy();
    }
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      reporter = new CSPReporter();
      
      expect(reporter.maxViolationsPerMinute).toBe(100);
      expect(reporter.maxViolationsPerIP).toBe(20);
      expect(reporter.alertThreshold).toBe(10);
      expect(reporter.enableDetailedLogging).toBe(true);
    });

    it('should initialize with custom options', () => {
      reporter = new CSPReporter({
        maxViolationsPerMinute: 50,
        maxViolationsPerIP: 10,
        alertThreshold: 5,
        enableDetailedLogging: false
      });
      
      expect(reporter.maxViolationsPerMinute).toBe(50);
      expect(reporter.maxViolationsPerIP).toBe(10);
      expect(reporter.alertThreshold).toBe(5);
      expect(reporter.enableDetailedLogging).toBe(false);
    });
  });

  describe('Violation Sanitization', () => {
    beforeEach(() => {
      reporter = new CSPReporter();
    });

    it('should sanitize standard CSP violation format', () => {
      const rawViolation = {
        'csp-report': {
          'document-uri': 'https://example.com/page',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.com/script.js',
          'line-number': 42,
          'column-number': 15
        }
      };
      
      const sanitized = reporter.sanitizeViolation(rawViolation);
      
      expect(sanitized.documentUri).toBe('https://example.com/page');
      expect(sanitized.violatedDirective).toBe('script-src');
      expect(sanitized.blockedUri).toBe('https://evil.com/script.js');
      expect(sanitized.lineNumber).toBe(42);
      expect(sanitized.columnNumber).toBe(15);
    });

    it('should sanitize alternative CSP violation format', () => {
      const rawViolation = {
        documentUri: 'https://example.com/page',
        violatedDirective: 'style-src',
        blockedUri: 'inline',
        lineNumber: '25',
        columnNumber: '8'
      };
      
      const sanitized = reporter.sanitizeViolation(rawViolation);
      
      expect(sanitized.documentUri).toBe('https://example.com/page');
      expect(sanitized.violatedDirective).toBe('style-src');
      expect(sanitized.blockedUri).toBe('inline');
      expect(sanitized.lineNumber).toBe(25);
      expect(sanitized.columnNumber).toBe(8);
    });

    it('should handle malicious input safely', () => {
      const maliciousViolation = {
        'csp-report': {
          'document-uri': 'javascript:alert("xss")\r\n\t<script>evil()</script>'.repeat(100),
          'violated-directive': 'script-src\r\ninjected-header: malicious',
          'blocked-uri': 'data:text/html,<script>alert("xss")</script>',
          'line-number': 'not-a-number',
          'column-number': null
        }
      };
      
      const sanitized = reporter.sanitizeViolation(maliciousViolation);
      
      // Should sanitize newlines and limit length
      expect(sanitized.documentUri).not.toContain('\r');
      expect(sanitized.documentUri).not.toContain('\n');
      expect(sanitized.documentUri).not.toContain('\t');
      expect(sanitized.documentUri.length).toBeLessThanOrEqual(500);
      
      expect(sanitized.violatedDirective).not.toContain('\r');
      expect(sanitized.violatedDirective).not.toContain('\n');
      
      expect(sanitized.lineNumber).toBe('unknown');
      expect(sanitized.columnNumber).toBe('unknown');
    });
  });

  describe('Violation Classification', () => {
    beforeEach(() => {
      reporter = new CSPReporter();
    });

    it('should classify script injection as critical', () => {
      const violation = {
        blockedUri: 'javascript:alert("xss")',
        violatedDirective: 'script-src'
      };
      
      const classification = reporter.classifyViolation(violation);
      
      expect(classification.severity).toBe('critical');
      expect(classification.threatLevel).toBe('high');
      expect(classification.category).toBe('script_injection');
    });

    it('should classify data URI HTML as critical', () => {
      const violation = {
        blockedUri: 'data:text/html,<script>alert("xss")</script>',
        violatedDirective: 'script-src'
      };
      
      const classification = reporter.classifyViolation(violation);
      
      expect(classification.severity).toBe('critical');
      expect(classification.threatLevel).toBe('high');
      expect(classification.category).toBe('script_injection');
    });

    it('should classify unsafe script violations as high severity', () => {
      const violation = {
        blockedUri: 'eval',
        violatedDirective: 'script-src'
      };
      
      const classification = reporter.classifyViolation(violation);
      
      expect(classification.severity).toBe('high');
      expect(classification.threatLevel).toBe('medium');
      expect(classification.category).toBe('unsafe_script');
    });

    it('should classify style violations as low severity', () => {
      const violation = {
        blockedUri: 'inline',
        violatedDirective: 'style-src'
      };
      
      const classification = reporter.classifyViolation(violation);
      
      expect(classification.severity).toBe('low');
      expect(classification.threatLevel).toBe('low');
      expect(classification.category).toBe('style_violation');
    });

    it('should classify resource violations as low severity', () => {
      const violation = {
        blockedUri: 'https://external.com/image.jpg',
        violatedDirective: 'img-src'
      };
      
      const classification = reporter.classifyViolation(violation);
      
      expect(classification.severity).toBe('low');
      expect(classification.threatLevel).toBe('low');
      expect(classification.category).toBe('resource_violation');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      reporter = new CSPReporter({
        maxViolationsPerMinute: 5,
        maxViolationsPerIP: 3
      });
    });

    it('should allow violations under rate limit', () => {
      const violation = {
        context: { ip: '192.168.1.1' }
      };
      
      const result = reporter.checkRateLimits(violation);
      
      expect(result.allowed).toBe(true);
    });

    it('should block violations over global rate limit', () => {
      // Add violations to exceed global limit
      for (let i = 0; i < 5; i++) {
        reporter.recentViolations.push({
          timestamp: Date.now(),
          ip: `192.168.1.${i}`
        });
      }
      
      const violation = {
        context: { ip: '192.168.1.100' }
      };
      
      const result = reporter.checkRateLimits(violation);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('global_rate_limit');
    });

    it('should block violations over IP rate limit', () => {
      const ip = '192.168.1.1';
      const now = Date.now();
      
      // Add violations for specific IP to exceed limit
      reporter.ipViolationCounts.set(ip, [now, now, now]);
      
      const violation = {
        context: { ip }
      };
      
      const result = reporter.checkRateLimits(violation);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('ip_rate_limit');
    });

    it('should allow violations from different IPs', () => {
      // Add violations for one IP
      reporter.ipViolationCounts.set('192.168.1.1', [Date.now(), Date.now(), Date.now()]);
      
      const violation = {
        context: { ip: '192.168.1.2' }
      };
      
      const result = reporter.checkRateLimits(violation);
      
      expect(result.allowed).toBe(true);
    });
  });

  describe('Violation Processing', () => {
    beforeEach(() => {
      reporter = new CSPReporter();
    });

    it('should process valid violation successfully', () => {
      const rawViolation = {
        'csp-report': {
          'document-uri': 'https://example.com',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.com/script.js'
        }
      };
      
      const requestContext = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      };
      
      const result = reporter.processViolation(rawViolation, requestContext);
      
      expect(result.processed).toBe(true);
      expect(result.violation).toBeDefined();
      expect(result.violation.context.ip).toBe('192.168.1.1');
      expect(result.violation.severity).toBeDefined();
      expect(result.processingTimeMs).toBeDefined();
    });

    it('should reject violations over rate limit', () => {
      // Fill up rate limit
      for (let i = 0; i < 100; i++) {
        reporter.recentViolations.push({
          timestamp: Date.now(),
          ip: `192.168.1.${i % 10}`
        });
      }
      
      const rawViolation = {
        'csp-report': {
          'document-uri': 'https://example.com',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.com/script.js'
        }
      };
      
      const result = reporter.processViolation(rawViolation, { ip: '192.168.1.1' });
      
      expect(result.processed).toBe(false);
      expect(result.reason).toBe('rate_limited');
    });
  });

  describe('Statistics and Monitoring', () => {
    beforeEach(() => {
      reporter = new CSPReporter();
    });

    it('should track violation statistics', () => {
      const violation = {
        context: { ip: '192.168.1.1' },
        severity: 'high',
        category: 'script_violation',
        violatedDirective: 'script-src'
      };
      
      reporter.trackViolation(violation);
      
      const stats = reporter.getStats();
      
      expect(stats.totalViolations).toBe(1);
      expect(stats.uniqueIPs).toBe(1);
      expect(stats.violationTypes['script-src']).toBe(1);
    });

    it('should provide comprehensive statistics', () => {
      // Add some test violations
      const violations = [
        { context: { ip: '192.168.1.1' }, severity: 'high', category: 'script', violatedDirective: 'script-src' },
        { context: { ip: '192.168.1.2' }, severity: 'low', category: 'style', violatedDirective: 'style-src' },
        { context: { ip: '192.168.1.1' }, severity: 'critical', category: 'injection', violatedDirective: 'script-src' }
      ];
      
      violations.forEach(v => reporter.trackViolation(v));
      
      const stats = reporter.getStats();
      
      expect(stats.totalViolations).toBe(3);
      expect(stats.uniqueIPs).toBe(2);
      expect(stats.severityCounts.high).toBe(1);
      expect(stats.severityCounts.low).toBe(1);
      expect(stats.severityCounts.critical).toBe(1);
      expect(stats.violationTypes['script-src']).toBe(2);
      expect(stats.violationTypes['style-src']).toBe(1);
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      reporter = new CSPReporter();
    });

    it('should process violations efficiently', () => {
      const rawViolation = {
        'csp-report': {
          'document-uri': 'https://example.com',
          'violated-directive': 'script-src',
          'blocked-uri': 'https://evil.com/script.js'
        }
      };
      
      const iterations = 1000;
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        reporter.processViolation(rawViolation, { ip: `192.168.1.${i % 100}` });
      }
      
      const endTime = process.hrtime.bigint();
      const totalTimeMs = Number(endTime - startTime) / 1000000;
      const avgTimeMs = totalTimeMs / iterations;
      
      // Should process violations in under 1ms each on average
      expect(avgTimeMs).toBeLessThan(1);
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      reporter = new CSPReporter();
    });

    it('should clean up old entries', () => {
      const oldTimestamp = Date.now() - 7200000; // 2 hours ago
      const recentTimestamp = Date.now();
      
      // Add old and recent violations
      reporter.recentViolations = [
        { timestamp: oldTimestamp, ip: '192.168.1.1' },
        { timestamp: recentTimestamp, ip: '192.168.1.2' }
      ];
      
      reporter.ipViolationCounts.set('192.168.1.1', [oldTimestamp]);
      reporter.ipViolationCounts.set('192.168.1.2', [recentTimestamp]);
      
      reporter.cleanupOldEntries();
      
      // Old entries should be removed
      expect(reporter.recentViolations.length).toBe(1);
      expect(reporter.recentViolations[0].ip).toBe('192.168.1.2');
      expect(reporter.ipViolationCounts.has('192.168.1.1')).toBe(false);
      expect(reporter.ipViolationCounts.has('192.168.1.2')).toBe(true);
    });
  });

  describe('Alert Conditions', () => {
    beforeEach(() => {
      reporter = new CSPReporter({ alertThreshold: 3 });
    });

    it('should trigger alert for critical violations', () => {
      const violation = {
        severity: 'critical',
        context: { ip: '192.168.1.1' },
        blockedUri: 'javascript:alert("xss")',
        violatedDirective: 'script-src'
      };
      
      // Should not throw - just log alert
      expect(() => {
        reporter.checkAlertConditions(violation);
      }).not.toThrow();
    });

    it('should trigger alert for high frequency violations', () => {
      const ip = '192.168.1.1';
      const now = Date.now();
      
      // Add violations to exceed threshold
      reporter.ipViolationCounts.set(ip, [now, now, now]);
      
      const violation = {
        severity: 'medium',
        context: { ip }
      };
      
      // Should not throw - just log alert
      expect(() => {
        reporter.checkAlertConditions(violation);
      }).not.toThrow();
    });
  });
});
