/**
 * CSP Configuration Tests
 * 
 * Comprehensive tests for CSP configuration including:
 * - Nonce generation security and performance
 * - Environment-specific directive generation
 * - Helmet integration
 * - Configuration validation
 * - Performance benchmarks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CSPConfig, createCSPConfig } from '../../lib/security/csp-config.js';

describe('CSPConfig', () => {
  let cspConfig;

  beforeEach(() => {
    // Reset environment
    delete process.env.NODE_ENV;
    delete process.env.CSP_REPORT_ONLY;
    delete process.env.CSP_DISABLE_REPORTING;
  });

  afterEach(() => {
    if (cspConfig) {
      // Cleanup if needed
    }
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      cspConfig = new CSPConfig();
      
      expect(cspConfig.reportOnly).toBe(false);
      expect(cspConfig.reportUri).toBe('/api/csp-report');
      expect(cspConfig.environment).toBe('development');
      expect(cspConfig.enableReporting).toBe(true);
    });

    it('should initialize with custom options', () => {
      cspConfig = new CSPConfig({
        reportOnly: true,
        reportUri: '/custom-report',
        enableReporting: false
      });
      
      expect(cspConfig.reportOnly).toBe(true);
      expect(cspConfig.reportUri).toBe('/custom-report');
      expect(cspConfig.enableReporting).toBe(false);
    });

    it('should respect environment variables', () => {
      process.env.NODE_ENV = 'production';
      cspConfig = new CSPConfig();
      
      expect(cspConfig.environment).toBe('production');
    });
  });

  describe('Nonce Generation', () => {
    beforeEach(() => {
      cspConfig = new CSPConfig();
    });

    it('should generate unique nonces', () => {
      const nonce1 = cspConfig.generateNonce();
      const nonce2 = cspConfig.generateNonce();
      
      expect(nonce1).not.toBe(nonce2);
      expect(typeof nonce1).toBe('string');
      expect(typeof nonce2).toBe('string');
    });

    it('should generate nonces of correct length', () => {
      const nonce = cspConfig.generateNonce();
      
      // Base64 encoded 16 bytes should be 24 characters (with padding)
      // But crypto.randomBytes(16).toString('base64') typically gives 22-24 chars
      expect(nonce.length).toBeGreaterThanOrEqual(20);
      expect(nonce.length).toBeLessThanOrEqual(24);
    });

    it('should generate cryptographically secure nonces', () => {
      const nonces = new Set();
      const iterations = 1000;
      
      // Generate many nonces and ensure they're all unique
      for (let i = 0; i < iterations; i++) {
        const nonce = cspConfig.generateNonce();
        expect(nonces.has(nonce)).toBe(false);
        nonces.add(nonce);
      }
      
      expect(nonces.size).toBe(iterations);
    });

    it('should meet performance requirements', () => {
      const iterations = 10000;
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        cspConfig.generateNonce();
      }
      
      const endTime = process.hrtime.bigint();
      const totalTimeMs = Number(endTime - startTime) / 1000000;
      const avgTimeMs = totalTimeMs / iterations;
      
      // Should be less than 1ms per nonce on average
      expect(avgTimeMs).toBeLessThan(1);
    });
  });

  describe('WebSocket Sources', () => {
    it('should return production WebSocket sources in production', () => {
      process.env.NODE_ENV = 'production';
      cspConfig = new CSPConfig();
      
      const sources = cspConfig.getConnectSources();
      
      expect(sources).toContain("'self'");
      expect(sources).toContain('wss://runtime.zyjeski.com');
      expect(sources).not.toContain('ws://localhost:3000');
    });

    it('should return development WebSocket sources in development', () => {
      process.env.NODE_ENV = 'development';
      cspConfig = new CSPConfig();
      
      const sources = cspConfig.getConnectSources();
      
      expect(sources).toContain("'self'");
      expect(sources).toContain('ws://localhost:3000');
      expect(sources).toContain('ws://127.0.0.1:3000');
      expect(sources).toContain('wss://localhost:3000');
      expect(sources).toContain('wss://127.0.0.1:3000');
    });
  });

  describe('Script Sources', () => {
    beforeEach(() => {
      cspConfig = new CSPConfig();
    });

    it('should include nonce in script sources', () => {
      const testNonce = 'test-nonce-123';
      const sources = cspConfig.getScriptSources(testNonce);
      
      expect(sources).toContain("'self'");
      expect(sources).toContain(`'nonce-${testNonce}'`);
    });

    it('should include CDN sources in development', () => {
      process.env.NODE_ENV = 'development';
      cspConfig = new CSPConfig();
      
      const sources = cspConfig.getScriptSources('test-nonce');
      
      expect(sources).toContain('https://cdnjs.cloudflare.com');
    });

    it('should not include CDN sources in production', () => {
      process.env.NODE_ENV = 'production';
      cspConfig = new CSPConfig();
      
      const sources = cspConfig.getScriptSources('test-nonce');
      
      expect(sources).not.toContain('https://cdnjs.cloudflare.com');
    });
  });

  describe('Style Sources', () => {
    beforeEach(() => {
      cspConfig = new CSPConfig();
    });

    it('should include nonce and Google Fonts in style sources', () => {
      const testNonce = 'test-nonce-456';
      const sources = cspConfig.getStyleSources(testNonce);
      
      expect(sources).toContain("'self'");
      expect(sources).toContain(`'nonce-${testNonce}'`);
      expect(sources).toContain('https://fonts.googleapis.com');
    });
  });

  describe('CSP Directives', () => {
    beforeEach(() => {
      cspConfig = new CSPConfig();
    });

    it('should generate complete directive set', () => {
      const testNonce = 'test-nonce-789';
      const directives = cspConfig.getDirectives(testNonce);
      
      // Check all required directives are present
      expect(directives.defaultSrc).toEqual(["'self'"]);
      expect(directives.scriptSrc).toContain("'self'");
      expect(directives.scriptSrc).toContain(`'nonce-${testNonce}'`);
      expect(directives.styleSrc).toContain("'self'");
      expect(directives.styleSrc).toContain(`'nonce-${testNonce}'`);
      expect(directives.fontSrc).toContain("'self'");
      expect(directives.imgSrc).toContain("'self'");
      expect(directives.connectSrc).toContain("'self'");
      expect(directives.frameSrc).toEqual(["'none'"]);
      expect(directives.frameAncestors).toEqual(["'none'"]);
      expect(directives.mediaSrc).toEqual(["'none'"]);
      expect(directives.objectSrc).toEqual(["'none'"]);
      expect(directives.baseUri).toEqual(["'self'"]);
      expect(directives.formAction).toEqual(["'self'"]);
      expect(directives.workerSrc).toEqual(["'self'"]);
    });

    it('should include production-specific directives in production', () => {
      process.env.NODE_ENV = 'production';
      cspConfig = new CSPConfig();
      
      const directives = cspConfig.getDirectives('test-nonce');
      
      expect(directives.upgradeInsecureRequests).toEqual([]);
      expect(directives.blockAllMixedContent).toEqual([]);
    });

    it('should not include production-specific directives in development', () => {
      process.env.NODE_ENV = 'development';
      cspConfig = new CSPConfig();
      
      const directives = cspConfig.getDirectives('test-nonce');
      
      expect(directives.upgradeInsecureRequests).toBeUndefined();
      expect(directives.blockAllMixedContent).toBeUndefined();
    });

    it('should include reporting directives when enabled', () => {
      cspConfig = new CSPConfig({ enableReporting: true, reportOnly: true });
      
      const directives = cspConfig.getDirectives('test-nonce');
      
      expect(directives.reportUri).toBe('/api/csp-report');
    });
  });

  describe('Helmet Configuration', () => {
    beforeEach(() => {
      cspConfig = new CSPConfig();
    });

    it('should return valid Helmet configuration', () => {
      const helmetConfig = cspConfig.getHelmetConfig();
      
      expect(helmetConfig).toHaveProperty('directives');
      expect(helmetConfig).toHaveProperty('reportOnly');
      expect(helmetConfig).toHaveProperty('useDefaults');
      expect(typeof helmetConfig.directives).toBe('function');
      expect(helmetConfig.useDefaults).toBe(false);
    });

    it('should generate directives from response locals', () => {
      const helmetConfig = cspConfig.getHelmetConfig();
      const mockReq = {};
      const mockRes = { locals: { nonce: 'test-helmet-nonce' } };
      
      const directives = helmetConfig.directives(mockReq, mockRes);
      
      expect(directives.scriptSrc).toContain("'nonce-test-helmet-nonce'");
    });

    it('should throw error when nonce is missing', () => {
      const helmetConfig = cspConfig.getHelmetConfig();
      const mockReq = {};
      const mockRes = { locals: {} };
      
      expect(() => {
        helmetConfig.directives(mockReq, mockRes);
      }).toThrow('CSP nonce not available');
    });
  });

  describe('Configuration Validation', () => {
    beforeEach(() => {
      cspConfig = new CSPConfig();
    });

    it('should validate secure configuration', () => {
      const validation = cspConfig.validateConfig();
      
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect unsafe directives', () => {
      // Mock a configuration with unsafe directives
      const unsafeConfig = new CSPConfig();
      const originalGetDirectives = unsafeConfig.getDirectives;
      unsafeConfig.getDirectives = (nonce) => {
        const directives = originalGetDirectives.call(unsafeConfig, nonce);
        directives.scriptSrc.push("'unsafe-inline'");
        directives.styleSrc.push("'unsafe-eval'");
        return directives;
      };
      
      const validation = unsafeConfig.validateConfig();
      
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues.some(issue => issue.includes('unsafe-inline'))).toBe(true);
      expect(validation.issues.some(issue => issue.includes('unsafe-eval'))).toBe(true);
    });
  });

  describe('Performance and Statistics', () => {
    beforeEach(() => {
      cspConfig = new CSPConfig();
    });

    it('should track performance statistics', () => {
      // Generate some nonces to create stats
      for (let i = 0; i < 10; i++) {
        cspConfig.generateNonce();
      }
      
      const stats = cspConfig.getStats();
      
      expect(stats).toHaveProperty('environment');
      expect(stats).toHaveProperty('reportOnly');
      expect(stats).toHaveProperty('nonceGenerationCount');
      expect(stats).toHaveProperty('uptimeMs');
      expect(stats).toHaveProperty('avgNoncesPerSecond');
      expect(stats.nonceGenerationCount).toBe(10);
    });
  });

  describe('Factory Function', () => {
    it('should create CSP config with environment defaults', () => {
      process.env.CSP_REPORT_ONLY = 'true';
      process.env.CSP_DISABLE_REPORTING = 'true';
      
      const config = createCSPConfig();
      
      expect(config.reportOnly).toBe(true);
      expect(config.enableReporting).toBe(false);
    });

    it('should override environment defaults with options', () => {
      process.env.CSP_REPORT_ONLY = 'true';
      
      const config = createCSPConfig({ reportOnly: false });
      
      expect(config.reportOnly).toBe(false);
    });
  });
});

describe('CSP Security Tests', () => {
  let cspConfig;

  beforeEach(() => {
    cspConfig = new CSPConfig();
  });

  it('should not allow unsafe-inline in production', () => {
    process.env.NODE_ENV = 'production';
    cspConfig = new CSPConfig();
    
    const directives = cspConfig.getDirectives('test-nonce');
    
    Object.values(directives).forEach(sources => {
      if (Array.isArray(sources)) {
        expect(sources).not.toContain("'unsafe-inline'");
      }
    });
  });

  it('should not allow unsafe-eval in any environment', () => {
    const environments = ['development', 'production', 'test'];
    
    environments.forEach(env => {
      process.env.NODE_ENV = env;
      const config = new CSPConfig();
      const directives = config.getDirectives('test-nonce');
      
      Object.values(directives).forEach(sources => {
        if (Array.isArray(sources)) {
          expect(sources).not.toContain("'unsafe-eval'");
        }
      });
    });
  });

  it('should not allow wildcard sources', () => {
    const directives = cspConfig.getDirectives('test-nonce');
    
    Object.values(directives).forEach(sources => {
      if (Array.isArray(sources)) {
        expect(sources).not.toContain('*');
      }
    });
  });

  it('should enforce strict frame policies', () => {
    const directives = cspConfig.getDirectives('test-nonce');
    
    expect(directives.frameSrc).toEqual(["'none'"]);
    expect(directives.frameAncestors).toEqual(["'none'"]);
  });
});
