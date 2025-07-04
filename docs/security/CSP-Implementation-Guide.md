# Content Security Policy Implementation Guide

## Overview

This document provides comprehensive guidance for the Content Security Policy (CSP) implementation in Runtime.zyjeski.com. The CSP system provides robust protection against XSS attacks while maintaining full application functionality.

## Architecture

### Core Components

1. **CSPConfig** (`lib/security/csp-config.js`)
   - Environment-specific CSP directive generation
   - Cryptographically secure nonce generation
   - Helmet.js integration
   - Performance monitoring

2. **CSPReporter** (`lib/security/csp-reporter.js`)
   - Violation processing and classification
   - Rate limiting and abuse prevention
   - Security threat assessment
   - Comprehensive logging and monitoring

3. **Template Integration** (`views/*.ejs`)
   - Nonce injection for inline scripts and styles
   - Secure template rendering with EJS

## Security Features

### XSS Protection
- **No unsafe-inline**: All inline scripts require nonces
- **No unsafe-eval**: Eval() is completely blocked
- **Strict directives**: Minimal allowed sources
- **Frame protection**: Complete frame blocking

### Threat Classification
- **Critical**: Script injection attempts (javascript:, data:text/html)
- **High**: Unsafe script violations (eval, inline without nonce)
- **Medium**: General script-src violations
- **Low**: Style and resource violations

### Rate Limiting
- **Global limit**: 100 violations per minute
- **Per-IP limit**: 20 violations per minute per IP
- **Alert threshold**: 10 violations triggers security alert

## Configuration

### Environment Variables

```bash
# CSP Configuration
CSP_REPORT_ONLY=false          # Set to 'true' for report-only mode
CSP_DISABLE_REPORTING=false    # Set to 'true' to disable violation reporting
NODE_ENV=production            # Affects CSP strictness

# Server Configuration
PORT=3000                      # Server port for WebSocket endpoints
```

### CSP Directives by Environment

#### Production
```javascript
{
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'nonce-{unique-per-request}'"],
  styleSrc: ["'self'", "'nonce-{unique-per-request}'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
  imgSrc: ["'self'", "data:", "blob:"],
  connectSrc: ["'self'", "wss://runtime.zyjeski.com"],
  frameSrc: ["'none'"],
  frameAncestors: ["'none'"],
  mediaSrc: ["'none'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  workerSrc: ["'self'"],
  upgradeInsecureRequests: [],
  blockAllMixedContent: []
}
```

#### Development
```javascript
{
  // Same as production, plus:
  scriptSrc: [...production, "https://cdnjs.cloudflare.com"],
  styleSrc: [...production, "https://cdnjs.cloudflare.com"],
  connectSrc: ["'self'", "ws://localhost:3000", "ws://127.0.0.1:3000", 
               "wss://localhost:3000", "wss://127.0.0.1:3000"]
  // No upgradeInsecureRequests or blockAllMixedContent
}
```

## Deployment Guide

### 1. Pre-Deployment Testing

```bash
# Run CSP tests
npm run test:security

# Run integration tests
npm run test:csp

# Performance testing
npm run test:coverage
```

### 2. Gradual Rollout

#### Phase 1: Report-Only Mode
```bash
# Enable report-only mode
export CSP_REPORT_ONLY=true
npm start

# Monitor violations for 24-48 hours
curl http://localhost:3000/api/csp-stats
```

#### Phase 2: Enforcement Mode
```bash
# Switch to enforcement
export CSP_REPORT_ONLY=false
npm start

# Monitor for any application breakage
```

### 3. Production Deployment

```bash
# Set production environment
export NODE_ENV=production
export CSP_REPORT_ONLY=false
export CSP_DISABLE_REPORTING=false

# Start application
npm start
```

## Monitoring and Alerting

### Violation Monitoring

The CSP system provides comprehensive violation monitoring through:

1. **Real-time logging** with severity classification
2. **Statistics endpoint** (`/api/csp-stats`) for development
3. **Rate limiting** to prevent abuse
4. **Automated alerting** for critical violations

### Key Metrics to Monitor

```javascript
{
  // Violation statistics
  totalViolations: 150,
  recentViolations: 25,
  severityCounts: {
    critical: 2,    // Immediate attention required
    high: 8,        // Review within hours
    medium: 10,     // Review within day
    low: 5          // Informational
  },
  
  // Performance metrics
  nonceGenerationCount: 10000,
  avgNoncesPerSecond: 15.5,
  
  // Security metrics
  uniqueIPs: 45,
  violationTypes: {
    "script-src": 15,
    "style-src": 8,
    "img-src": 2
  }
}
```

### Alert Conditions

1. **Critical violations**: Any script injection attempt
2. **High frequency**: >10 violations from single IP in 5 minutes
3. **Performance degradation**: Nonce generation >1ms average
4. **Rate limit exceeded**: Global or per-IP limits hit

## Troubleshooting

### Common Issues

#### 1. Inline Scripts Blocked
**Symptom**: Console errors about blocked inline scripts
**Solution**: Add nonce to script tags
```html
<script nonce="<%= nonce %>">
  // Your inline script
</script>
```

#### 2. External Resources Blocked
**Symptom**: Images, fonts, or stylesheets not loading
**Solution**: Add domains to appropriate CSP directives

#### 3. WebSocket Connection Blocked
**Symptom**: Real-time features not working
**Solution**: Verify WebSocket endpoints in connectSrc directive

#### 4. High Violation Rate
**Symptom**: Many CSP violations in logs
**Solution**: 
1. Check if legitimate resources are being blocked
2. Review and adjust CSP directives
3. Investigate potential XSS attempts

### Debug Mode

Enable detailed logging in development:
```bash
export NODE_ENV=development
export CSP_DISABLE_REPORTING=false
npm start
```

### Performance Issues

If nonce generation is slow:
1. Check system entropy
2. Monitor CPU usage
3. Consider nonce caching (with security implications)

## Security Best Practices

### 1. Nonce Management
- **Unique per request**: Never reuse nonces
- **Cryptographically secure**: Use crypto.randomBytes()
- **Sufficient length**: Minimum 16 bytes (128 bits)
- **No logging**: Never log nonces in production

### 2. Directive Configuration
- **Principle of least privilege**: Only allow necessary sources
- **Regular review**: Audit CSP directives quarterly
- **Environment separation**: Different policies for dev/prod
- **No wildcards**: Avoid '*' in production

### 3. Violation Handling
- **Immediate response**: Investigate critical violations
- **Pattern analysis**: Look for attack patterns
- **Rate limiting**: Prevent violation flooding
- **Sanitized logging**: Never log sensitive data

### 4. Template Security
- **Nonce injection**: All inline scripts/styles need nonces
- **Output encoding**: Properly encode dynamic content
- **Template validation**: Validate template syntax
- **Minimal inline code**: Prefer external files

## Testing Strategy

### Unit Tests
```bash
# Test CSP configuration
npm run test tests/security/csp-config.test.js

# Test violation reporter
npm run test tests/security/csp-reporter.test.js
```

### Integration Tests
```bash
# Test full CSP integration
npm run test tests/security/csp-integration.test.js
```

### Security Tests
```bash
# Test XSS protection
npm run test:security
```

### Performance Tests
```bash
# Benchmark nonce generation
npm run test:performance
```

## Maintenance

### Regular Tasks

#### Weekly
- Review violation logs
- Check performance metrics
- Update threat intelligence

#### Monthly
- Audit CSP directives
- Review rate limiting settings
- Update documentation

#### Quarterly
- Security assessment
- Policy review
- Penetration testing

### Updates and Changes

When modifying CSP:
1. Test in development first
2. Use report-only mode for validation
3. Monitor violation patterns
4. Gradual rollout to production
5. Document all changes

## Emergency Procedures

### CSP Blocking Critical Functionality

1. **Immediate**: Switch to report-only mode
```bash
export CSP_REPORT_ONLY=true
pm2 restart runtime-zyjeski
```

2. **Investigate**: Check violation logs
3. **Fix**: Update CSP directives
4. **Test**: Validate in staging
5. **Deploy**: Return to enforcement mode

### Security Incident

1. **Assess**: Determine if CSP violations indicate attack
2. **Block**: Implement IP blocking if necessary
3. **Investigate**: Analyze violation patterns
4. **Report**: Document incident
5. **Improve**: Update CSP based on findings

## Ground State Principle Compliance

The CSP implementation follows the **Ground State Principle**: All security policy modifications and violation responses occur only through explicit user actions or administrator commands. No automatic policy adjustments or background security processes occur.

### CSP Ground State Behaviors

1. **Manual Policy Updates**: CSP directives are only modified through:
   - Explicit configuration changes in code
   - Environment variable updates
   - Administrator deployment actions

2. **User-Triggered Violation Handling**: Violation processing occurs only when:
   - Browser sends violation reports (user-initiated page loads)
   - Administrator queries violation statistics
   - Manual security audits are performed

3. **No Automatic Adaptations**: The system never:
   - Automatically relaxes CSP based on violations
   - Self-modifies security policies
   - Implements background security adjustments

## Resources

- [CSP Level 3 Specification](https://www.w3.org/TR/CSP3/)
- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator Tool](https://csp-evaluator.withgoogle.com/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
