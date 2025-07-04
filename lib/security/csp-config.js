/**
 * Content Security Policy Configuration for Runtime.zyjeski.com
 * 
 * Provides comprehensive CSP implementation with:
 * - Environment-specific policies (development vs production)
 * - Cryptographically secure nonce generation
 * - WebSocket endpoint configuration
 * - Canvas API support for memory visualizations
 * - Google Fonts integration
 * - Violation reporting system
 * 
 * Security Features:
 * - No unsafe-inline or unsafe-eval in production
 * - Unique nonces per request
 * - Strict directive enforcement
 * - Environment-based relaxations only where necessary
 */

import crypto from 'crypto';
import { info, error } from '../logger.js';

export class CSPConfig {
  constructor(options = {}) {
    this.reportOnly = options.reportOnly || false;
    this.reportUri = options.reportUri || '/api/csp-report';
    this.environment = process.env.NODE_ENV || 'development';
    this.enableReporting = options.enableReporting !== false;
    
    // Performance tracking
    this.nonceGenerationCount = 0;
    this.startTime = Date.now();
    
    info('CSP Configuration initialized', {
      environment: this.environment,
      reportOnly: this.reportOnly,
      reportUri: this.reportUri,
      enableReporting: this.enableReporting
    });
  }

  /**
   * Generate cryptographically secure nonce
   * Uses crypto.randomBytes for maximum security
   * @returns {string} Base64 encoded nonce (22 characters)
   */
  generateNonce() {
    const startTime = process.hrtime.bigint();
    
    // Generate 16 random bytes (128 bits) for strong security
    const nonce = crypto.randomBytes(16).toString('base64');
    
    // Performance tracking
    this.nonceGenerationCount++;
    const generationTime = Number(process.hrtime.bigint() - startTime) / 1000000;
    
    // Log performance in development mode
    if (this.environment === 'development' && generationTime > 1) {
      info('Slow nonce generation detected', {
        generationTimeMs: generationTime.toFixed(3),
        totalGenerated: this.nonceGenerationCount
      });
    }
    
    return nonce;
  }

  /**
   * Get WebSocket connection sources based on environment
   * @returns {string[]} Allowed WebSocket connection sources
   */
  getConnectSources() {
    const sources = ["'self'"];
    
    if (this.environment === 'production') {
      // Production: Only allow secure WebSocket to official domain
      sources.push('wss://runtime.zyjeski.com');
    } else {
      // Development: Allow localhost variants for local testing
      sources.push('ws://localhost:3000', 'ws://127.0.0.1:3000');
      // Also allow secure WebSocket for development HTTPS testing
      sources.push('wss://localhost:3000', 'wss://127.0.0.1:3000');
    }
    
    return sources;
  }

  /**
   * Get script sources with nonce support
   * @param {string} nonce - Current request nonce
   * @returns {string[]} Script source directives
   */
  getScriptSources(nonce) {
    const sources = ["'self'"];

    // In development, allow unsafe-eval for easier debugging and development tools
    if (this.environment === 'development') {
      // Allow unsafe-eval for development (needed for eval() in ChoiceTracker, ConditionEvaluator, etc.)
      sources.push("'unsafe-eval'");
      // Allow unsafe-inline for dynamically created scripts
      sources.push("'unsafe-inline'");
      // Allow external CDN for development tools (Prism.js for syntax highlighting)
      sources.push('https://cdnjs.cloudflare.com');
    } else {
      // In production, use nonces for security
      sources.push(`'nonce-${nonce}'`);
    }

    // Allow Socket.io client library (served by Socket.io server)
    sources.push("'self'");

    return sources;
  }

  /**
   * Get style sources with nonce and font support
   * @param {string} nonce - Current request nonce
   * @returns {string[]} Style source directives
   */
  getStyleSources(nonce) {
    const sources = ["'self'"];

    // In development, use unsafe-inline instead of nonces for easier debugging
    // This allows inline styles set via JavaScript (element.style.property = value)
    if (this.environment === 'development') {
      sources.push("'unsafe-inline'");
      sources.push('https://cdnjs.cloudflare.com');
    } else {
      // In production, use nonces for security
      sources.push(`'nonce-${nonce}'`);
    }

    // Google Fonts CSS (always needed)
    sources.push('https://fonts.googleapis.com');

    return sources;
  }

  /**
   * Get comprehensive CSP directives for current environment
   * @param {string} nonce - Current request nonce
   * @returns {object} Complete CSP directive configuration
   */
  getDirectives(nonce) {
    const directives = {
      // Default fallback - restrict to same origin
      defaultSrc: ["'self'"],
      
      // Scripts: self + nonce for inline scripts
      scriptSrc: this.getScriptSources(nonce),
      
      // Styles: self + nonce + Google Fonts
      styleSrc: this.getStyleSources(nonce),
      
      // Fonts: self + Google Fonts + data URIs for custom fonts
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      
      // Images: self + data/blob URIs for Canvas operations
      imgSrc: ["'self'", "data:", "blob:"],
      
      // Connections: WebSocket endpoints + self
      connectSrc: this.getConnectSources(),
      
      // Frames: completely disabled for security
      frameSrc: ["'none'"],
      
      // Frame ancestors: prevent clickjacking
      frameAncestors: ["'none'"],
      
      // Media: disabled (no audio/video content)
      mediaSrc: ["'none'"],
      
      // Objects: disabled (no plugins/Flash)
      objectSrc: ["'none'"],
      
      // Base URI: restrict to same origin
      baseUri: ["'self'"],
      
      // Form actions: restrict to same origin
      formAction: ["'self'"],
      
      // Worker sources: same origin only
      workerSrc: ["'self'"]
    };

    // Production-specific hardening
    if (this.environment === 'production') {
      // Force HTTPS for all requests
      directives.upgradeInsecureRequests = [];
      
      // Block mixed content
      directives.blockAllMixedContent = [];
    }

    // Add reporting if enabled
    if (this.enableReporting) {
      if (this.reportOnly) {
        directives.reportUri = this.reportUri;
      } else {
        directives.reportTo = 'csp-endpoint';
      }
    }

    return directives;
  }

  /**
   * Create Helmet CSP configuration object
   * @returns {object} Helmet-compatible CSP configuration
   */
  getHelmetConfig() {
    return {
      // Use function to generate directives per request
      // This ensures each request gets unique nonce
      directives: (req, res) => {
        // Nonce should be available in res.locals from middleware
        const nonce = res.locals.nonce;
        if (!nonce) {
          error('CSP nonce not found in response locals', {
            url: req.url,
            method: req.method
          });
          throw new Error('CSP nonce not available - ensure nonce middleware runs before CSP');
        }
        
        return this.getDirectives(nonce);
      },
      reportOnly: this.reportOnly,
      useDefaults: false // Use our custom directives only
    };
  }

  /**
   * Get performance statistics for monitoring
   * @returns {object} Performance and usage statistics
   */
  getStats() {
    const uptime = Date.now() - this.startTime;
    const avgNoncesPerSecond = this.nonceGenerationCount / (uptime / 1000);
    
    return {
      environment: this.environment,
      reportOnly: this.reportOnly,
      nonceGenerationCount: this.nonceGenerationCount,
      uptimeMs: uptime,
      avgNoncesPerSecond: avgNoncesPerSecond.toFixed(2),
      enableReporting: this.enableReporting
    };
  }

  /**
   * Validate CSP configuration for security issues
   * @returns {object} Validation results with warnings/errors
   */
  validateConfig() {
    const issues = [];
    const warnings = [];
    
    // Check for unsafe directives
    const testDirectives = this.getDirectives('test-nonce');
    
    Object.entries(testDirectives).forEach(([directive, sources]) => {
      if (Array.isArray(sources)) {
        if (sources.includes("'unsafe-inline'")) {
          issues.push(`${directive} contains 'unsafe-inline' - major security risk`);
        }
        if (sources.includes("'unsafe-eval'")) {
          issues.push(`${directive} contains 'unsafe-eval' - major security risk`);
        }
        if (sources.includes('*')) {
          issues.push(`${directive} contains wildcard '*' - security risk`);
        }
      }
    });
    
    // Environment-specific checks
    if (this.environment === 'production' && this.reportOnly) {
      warnings.push('CSP is in report-only mode in production');
    }
    
    if (this.environment === 'development' && !this.reportOnly) {
      warnings.push('CSP is enforcing in development - may cause issues during development');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings,
      checkedAt: new Date().toISOString()
    };
  }
}

/**
 * Create and configure CSP instance with environment defaults
 * @param {object} options - Configuration options
 * @returns {CSPConfig} Configured CSP instance
 */
export function createCSPConfig(options = {}) {
  const defaultOptions = {
    reportOnly: process.env.CSP_REPORT_ONLY === 'true',
    reportUri: '/api/csp-report',
    enableReporting: process.env.CSP_DISABLE_REPORTING !== 'true'
  };
  
  return new CSPConfig({ ...defaultOptions, ...options });
}

export default CSPConfig;
