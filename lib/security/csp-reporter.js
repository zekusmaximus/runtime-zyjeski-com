/**
 * CSP Violation Reporter for Runtime.zyjeski.com
 * 
 * Provides comprehensive CSP violation reporting, analysis, and monitoring:
 * - Violation sanitization and classification
 * - Security threat assessment
 * - Rate limiting and abuse prevention
 * - Detailed logging with context
 * - Performance impact monitoring
 * - Automated alerting for critical violations
 */

import { info, error, warn } from '../logger.js';

export class CSPReporter {
  constructor(options = {}) {
    this.maxViolationsPerMinute = options.maxViolationsPerMinute || 100;
    this.maxViolationsPerIP = options.maxViolationsPerIP || 20;
    this.alertThreshold = options.alertThreshold || 10;
    this.enableDetailedLogging = options.enableDetailedLogging !== false;
    
    // Violation tracking
    this.violationCounts = new Map();
    this.ipViolationCounts = new Map();
    this.recentViolations = [];
    this.startTime = Date.now();
    
    // Cleanup interval for rate limiting maps
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldEntries();
    }, 60000); // Clean up every minute
    
    info('CSP Reporter initialized', {
      maxViolationsPerMinute: this.maxViolationsPerMinute,
      maxViolationsPerIP: this.maxViolationsPerIP,
      alertThreshold: this.alertThreshold
    });
  }

  /**
   * Process and analyze CSP violation report
   * @param {object} rawViolation - Raw violation data from browser
   * @param {object} requestContext - Request context (IP, User-Agent, etc.)
   * @returns {object} Processing result
   */
  processViolation(rawViolation, requestContext = {}) {
    const startTime = process.hrtime.bigint();
    
    try {
      // Sanitize violation data
      const violation = this.sanitizeViolation(rawViolation);
      
      // Add request context
      violation.context = {
        ip: requestContext.ip || 'unknown',
        userAgent: requestContext.userAgent || 'unknown',
        timestamp: new Date().toISOString(),
        requestId: requestContext.requestId || this.generateRequestId()
      };
      
      // Check rate limits
      const rateLimitResult = this.checkRateLimits(violation);
      if (!rateLimitResult.allowed) {
        warn('CSP violation rate limit exceeded', {
          ip: violation.context.ip,
          reason: rateLimitResult.reason,
          violationType: violation.violatedDirective
        });
        return { processed: false, reason: 'rate_limited' };
      }
      
      // Classify violation severity
      const classification = this.classifyViolation(violation);
      violation.severity = classification.severity;
      violation.threatLevel = classification.threatLevel;
      violation.category = classification.category;
      
      // Log violation based on severity
      this.logViolation(violation);
      
      // Track violation statistics
      this.trackViolation(violation);
      
      // Check for alert conditions
      this.checkAlertConditions(violation);
      
      // Performance tracking
      const processingTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      return {
        processed: true,
        violation,
        processingTimeMs: processingTime.toFixed(3)
      };
      
    } catch (err) {
      error('CSP violation processing failed', {
        error: err.message,
        rawViolation: this.sanitizeForLogging(rawViolation)
      });
      return { processed: false, reason: 'processing_error' };
    }
  }

  /**
   * Sanitize violation data to prevent log injection
   * @param {object} rawViolation - Raw violation from browser
   * @returns {object} Sanitized violation data
   */
  sanitizeViolation(rawViolation) {
    const violation = rawViolation['csp-report'] || rawViolation;
    
    return {
      documentUri: this.sanitizeString(violation['document-uri'] || violation.documentUri),
      violatedDirective: this.sanitizeString(violation['violated-directive'] || violation.violatedDirective),
      blockedUri: this.sanitizeString(violation['blocked-uri'] || violation.blockedUri),
      lineNumber: this.sanitizeNumber(violation['line-number'] || violation.lineNumber),
      columnNumber: this.sanitizeNumber(violation['column-number'] || violation.columnNumber),
      sourceFile: this.sanitizeString(violation['source-file'] || violation.sourceFile),
      originalPolicy: this.sanitizeString(violation['original-policy'] || violation.originalPolicy),
      effectiveDirective: this.sanitizeString(violation['effective-directive'] || violation.effectiveDirective)
    };
  }

  /**
   * Classify violation severity and threat level
   * @param {object} violation - Sanitized violation data
   * @returns {object} Classification result
   */
  classifyViolation(violation) {
    const blockedUri = violation.blockedUri || '';
    const violatedDirective = violation.violatedDirective || '';
    
    // Critical threats
    if (blockedUri.includes('javascript:') || 
        blockedUri.includes('data:text/html') ||
        blockedUri.includes('vbscript:') ||
        blockedUri.includes('data:application/javascript')) {
      return {
        severity: 'critical',
        threatLevel: 'high',
        category: 'script_injection'
      };
    }
    
    // Script-src violations are high priority
    if (violatedDirective.includes('script-src')) {
      if (blockedUri.includes('eval') || blockedUri.includes('inline')) {
        return {
          severity: 'high',
          threatLevel: 'medium',
          category: 'unsafe_script'
        };
      }
      return {
        severity: 'medium',
        threatLevel: 'medium',
        category: 'script_violation'
      };
    }
    
    // Style violations are generally lower priority
    if (violatedDirective.includes('style-src')) {
      return {
        severity: 'low',
        threatLevel: 'low',
        category: 'style_violation'
      };
    }
    
    // External resource violations
    if (violatedDirective.includes('connect-src') || 
        violatedDirective.includes('img-src') ||
        violatedDirective.includes('font-src')) {
      return {
        severity: 'low',
        threatLevel: 'low',
        category: 'resource_violation'
      };
    }
    
    // Default classification
    return {
      severity: 'medium',
      threatLevel: 'low',
      category: 'general_violation'
    };
  }

  /**
   * Check rate limits for violations
   * @param {object} violation - Violation data with context
   * @returns {object} Rate limit check result
   */
  checkRateLimits(violation) {
    const now = Date.now();
    const ip = violation.context.ip;
    
    // Check global rate limit (violations per minute)
    const recentViolations = this.recentViolations.filter(
      v => now - v.timestamp < 60000
    );
    
    if (recentViolations.length >= this.maxViolationsPerMinute) {
      return { allowed: false, reason: 'global_rate_limit' };
    }
    
    // Check per-IP rate limit
    const ipViolations = this.ipViolationCounts.get(ip) || [];
    const recentIPViolations = ipViolations.filter(
      timestamp => now - timestamp < 60000
    );
    
    if (recentIPViolations.length >= this.maxViolationsPerIP) {
      return { allowed: false, reason: 'ip_rate_limit' };
    }
    
    return { allowed: true };
  }

  /**
   * Log violation based on severity level
   * @param {object} violation - Classified violation data
   */
  logViolation(violation) {
    const logData = {
      severity: violation.severity,
      threatLevel: violation.threatLevel,
      category: violation.category,
      violatedDirective: violation.violatedDirective,
      blockedUri: violation.blockedUri,
      documentUri: violation.documentUri,
      ip: violation.context.ip,
      userAgent: violation.context.userAgent,
      timestamp: violation.context.timestamp
    };
    
    // Add detailed information in development
    if (this.enableDetailedLogging && process.env.NODE_ENV !== 'production') {
      logData.lineNumber = violation.lineNumber;
      logData.columnNumber = violation.columnNumber;
      logData.sourceFile = violation.sourceFile;
    }
    
    switch (violation.severity) {
      case 'critical':
        error('CRITICAL CSP violation detected - possible XSS attempt', logData);
        break;
      case 'high':
        error('High-severity CSP violation', logData);
        break;
      case 'medium':
        warn('Medium-severity CSP violation', logData);
        break;
      case 'low':
        info('CSP violation reported', logData);
        break;
      default:
        info('CSP violation reported', logData);
    }
  }

  /**
   * Track violation statistics
   * @param {object} violation - Violation data
   */
  trackViolation(violation) {
    const now = Date.now();
    const ip = violation.context.ip;
    
    // Add to recent violations
    this.recentViolations.push({
      timestamp: now,
      severity: violation.severity,
      category: violation.category,
      ip: ip
    });
    
    // Track per-IP violations
    if (!this.ipViolationCounts.has(ip)) {
      this.ipViolationCounts.set(ip, []);
    }
    this.ipViolationCounts.get(ip).push(now);
    
    // Track violation type counts
    const violationType = violation.violatedDirective;
    if (!this.violationCounts.has(violationType)) {
      this.violationCounts.set(violationType, 0);
    }
    this.violationCounts.set(violationType, this.violationCounts.get(violationType) + 1);
  }

  /**
   * Check for alert conditions
   * @param {object} violation - Current violation
   */
  checkAlertConditions(violation) {
    // Alert on critical violations
    if (violation.severity === 'critical') {
      error('SECURITY ALERT: Critical CSP violation detected', {
        ip: violation.context.ip,
        blockedUri: violation.blockedUri,
        violatedDirective: violation.violatedDirective,
        timestamp: violation.context.timestamp
      });
    }
    
    // Alert on high frequency violations from single IP
    const ip = violation.context.ip;
    const recentIPViolations = (this.ipViolationCounts.get(ip) || [])
      .filter(timestamp => Date.now() - timestamp < 300000); // 5 minutes
    
    if (recentIPViolations.length >= this.alertThreshold) {
      warn('SECURITY ALERT: High frequency CSP violations from IP', {
        ip: ip,
        violationCount: recentIPViolations.length,
        timeWindow: '5 minutes'
      });
    }
  }

  /**
   * Get violation statistics
   * @returns {object} Current violation statistics
   */
  getStats() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    const recentViolations = this.recentViolations.filter(
      v => now - v.timestamp < 3600000 // Last hour
    );
    
    const severityCounts = recentViolations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalViolations: this.recentViolations.length,
      recentViolations: recentViolations.length,
      severityCounts,
      uniqueIPs: this.ipViolationCounts.size,
      violationTypes: Object.fromEntries(this.violationCounts),
      uptimeMs: uptime
    };
  }

  /**
   * Clean up old entries to prevent memory leaks
   */
  cleanupOldEntries() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    // Clean up recent violations
    this.recentViolations = this.recentViolations.filter(
      v => now - v.timestamp < maxAge
    );
    
    // Clean up IP violation counts
    for (const [ip, timestamps] of this.ipViolationCounts.entries()) {
      const recentTimestamps = timestamps.filter(t => now - t < maxAge);
      if (recentTimestamps.length === 0) {
        this.ipViolationCounts.delete(ip);
      } else {
        this.ipViolationCounts.set(ip, recentTimestamps);
      }
    }
  }

  /**
   * Utility methods for sanitization
   */
  sanitizeString(value) {
    if (typeof value !== 'string') return 'unknown';
    return value.replace(/[\r\n\t]/g, ' ').substring(0, 500);
  }

  sanitizeNumber(value) {
    const num = parseInt(value);
    return isNaN(num) ? 'unknown' : num;
  }

  sanitizeForLogging(obj) {
    return JSON.stringify(obj).substring(0, 1000);
  }

  generateRequestId() {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export default CSPReporter;
