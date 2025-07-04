# CSP Deployment Checklist

## Pre-Deployment Validation

### ✅ Code Review Checklist

- [ ] **CSP Configuration Review**
  - [ ] No `'unsafe-inline'` in production directives
  - [ ] No `'unsafe-eval'` in any environment
  - [ ] No wildcard (`*`) sources in production
  - [ ] Environment-specific configurations are correct
  - [ ] Nonce generation uses crypto.randomBytes()

- [ ] **Template Security**
  - [ ] All inline scripts use nonces: `<script nonce="<%= nonce %>">`
  - [ ] All inline styles use nonces: `<style nonce="<%= nonce %>">`
  - [ ] No hardcoded nonces in templates
  - [ ] Dynamic content is properly encoded

- [ ] **Server Configuration**
  - [ ] CSP middleware runs before route handlers
  - [ ] Nonce middleware runs before CSP middleware
  - [ ] Violation reporting endpoint is configured
  - [ ] Rate limiting is properly configured

### ✅ Security Testing

- [ ] **Unit Tests Pass**
  ```bash
  npm run test:security
  ```

- [ ] **Integration Tests Pass**
  ```bash
  npm run test:csp
  ```

- [ ] **Performance Tests Pass**
  ```bash
  npm run test:performance
  ```

- [ ] **Manual Security Tests**
  - [ ] XSS injection attempts are blocked
  - [ ] Inline scripts without nonces are blocked
  - [ ] External script sources are properly restricted
  - [ ] Frame embedding is prevented

### ✅ Functional Testing

- [ ] **Application Features Work**
  - [ ] Homepage loads without CSP violations
  - [ ] Terminal interface functions correctly
  - [ ] Monitor page displays data
  - [ ] Component showcase works
  - [ ] WebSocket connections establish
  - [ ] Canvas visualizations render

- [ ] **Browser Compatibility**
  - [ ] Chrome/Chromium (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)

## Deployment Process

### Phase 1: Report-Only Deployment

#### ✅ Environment Setup
- [ ] Set environment variables:
  ```bash
  export NODE_ENV=production
  export CSP_REPORT_ONLY=true
  export CSP_DISABLE_REPORTING=false
  ```

#### ✅ Deploy and Monitor
- [ ] Deploy application with report-only CSP
- [ ] Monitor violation reports for 24-48 hours
- [ ] Check `/api/csp-stats` endpoint (development only)
- [ ] Verify no legitimate functionality is blocked

#### ✅ Violation Analysis
- [ ] Review violation logs for patterns
- [ ] Identify any legitimate resources being blocked
- [ ] Update CSP directives if necessary
- [ ] Document any policy adjustments

### Phase 2: Enforcement Deployment

#### ✅ Final Configuration
- [ ] Set enforcement mode:
  ```bash
  export CSP_REPORT_ONLY=false
  ```

#### ✅ Deploy and Validate
- [ ] Deploy with CSP enforcement enabled
- [ ] Perform smoke tests on all major features
- [ ] Monitor error logs for CSP-related issues
- [ ] Verify violation reporting is working

#### ✅ Post-Deployment Monitoring
- [ ] Monitor violation rates for first 24 hours
- [ ] Check application performance metrics
- [ ] Verify no user-reported issues
- [ ] Document deployment completion

## Production Validation

### ✅ Security Validation

- [ ] **CSP Headers Present**
  ```bash
  curl -I https://runtime.zyjeski.com/
  # Should include: Content-Security-Policy header
  ```

- [ ] **Nonce Uniqueness**
  ```bash
  # Multiple requests should have different nonces
  curl -s https://runtime.zyjeski.com/ | grep -o 'nonce-[^"]*'
  curl -s https://runtime.zyjeski.com/ | grep -o 'nonce-[^"]*'
  # Should be different
  ```

- [ ] **Violation Reporting**
  ```bash
  # Test violation reporting endpoint
  curl -X POST https://runtime.zyjeski.com/api/csp-report \
    -H "Content-Type: application/csp-report" \
    -d '{"csp-report":{"violated-directive":"script-src","blocked-uri":"test"}}'
  # Should return 204 No Content
  ```

### ✅ Performance Validation

- [ ] **Page Load Performance**
  - [ ] Homepage loads in <2 seconds
  - [ ] No significant performance degradation
  - [ ] Nonce generation adds <1ms per request

- [ ] **Memory Usage**
  - [ ] No memory leaks in CSP components
  - [ ] Violation tracking cleanup working
  - [ ] Rate limiting maps are cleaned up

### ✅ Functional Validation

- [ ] **Core Features**
  - [ ] All pages load without CSP violations
  - [ ] JavaScript functionality works
  - [ ] CSS styles apply correctly
  - [ ] WebSocket connections work
  - [ ] Canvas rendering works

- [ ] **Error Handling**
  - [ ] Graceful handling of CSP violations
  - [ ] Rate limiting works correctly
  - [ ] Error pages display properly

## Monitoring Setup

### ✅ Logging Configuration

- [ ] **Violation Logging**
  - [ ] Critical violations logged as errors
  - [ ] High/medium violations logged as warnings
  - [ ] Low violations logged as info
  - [ ] Sensitive data is sanitized

- [ ] **Performance Logging**
  - [ ] Nonce generation performance tracked
  - [ ] Violation processing performance monitored
  - [ ] Memory usage tracked

### ✅ Alerting Setup

- [ ] **Critical Alerts**
  - [ ] Script injection attempts (javascript:, data:text/html)
  - [ ] High frequency violations (>10 per IP per 5 minutes)
  - [ ] CSP system errors

- [ ] **Warning Alerts**
  - [ ] Unusual violation patterns
  - [ ] Performance degradation
  - [ ] Rate limiting triggered

### ✅ Metrics Dashboard

- [ ] **Security Metrics**
  - [ ] Violation count by severity
  - [ ] Unique IPs generating violations
  - [ ] Violation types breakdown

- [ ] **Performance Metrics**
  - [ ] Nonce generation rate
  - [ ] Average processing time
  - [ ] Memory usage trends

## Rollback Procedures

### ✅ Emergency Rollback

If CSP blocks critical functionality:

1. **Immediate Action**
   ```bash
   # Switch to report-only mode
   export CSP_REPORT_ONLY=true
   pm2 restart runtime-zyjeski
   ```

2. **Investigation**
   - [ ] Check violation logs
   - [ ] Identify blocked resources
   - [ ] Determine root cause

3. **Resolution**
   - [ ] Update CSP directives
   - [ ] Test in staging environment
   - [ ] Re-deploy with fixes

### ✅ Gradual Rollback

If issues are discovered post-deployment:

1. **Assessment**
   - [ ] Determine impact scope
   - [ ] Identify affected users
   - [ ] Evaluate security implications

2. **Mitigation**
   - [ ] Implement temporary fixes
   - [ ] Communicate with stakeholders
   - [ ] Plan permanent solution

3. **Recovery**
   - [ ] Deploy permanent fix
   - [ ] Validate resolution
   - [ ] Update documentation

## Post-Deployment Tasks

### ✅ Documentation Updates

- [ ] Update deployment documentation
- [ ] Record any policy changes
- [ ] Document lessons learned
- [ ] Update runbooks

### ✅ Team Communication

- [ ] Notify security team of deployment
- [ ] Share violation monitoring procedures
- [ ] Provide troubleshooting guide
- [ ] Schedule security review

### ✅ Ongoing Maintenance

- [ ] Schedule weekly violation reviews
- [ ] Plan monthly policy audits
- [ ] Set up quarterly security assessments
- [ ] Establish update procedures

## Validation Commands

### Quick Health Check
```bash
# Check CSP headers
curl -I https://runtime.zyjeski.com/ | grep -i content-security-policy

# Test main functionality
curl -s https://runtime.zyjeski.com/ | grep -q "Debug Consciousness" && echo "OK"

# Check violation reporting
curl -X POST https://runtime.zyjeski.com/api/csp-report \
  -H "Content-Type: application/json" \
  -d '{"csp-report":{"violated-directive":"test"}}' \
  -w "%{http_code}\n" -o /dev/null
```

### Performance Check
```bash
# Measure page load time
time curl -s https://runtime.zyjeski.com/ > /dev/null

# Check for memory leaks (requires monitoring tools)
# Monitor process memory usage over time
```

### Security Check
```bash
# Verify no unsafe directives
curl -s -I https://runtime.zyjeski.com/ | grep -i content-security-policy | \
  grep -E "(unsafe-inline|unsafe-eval|\*)" && echo "SECURITY ISSUE" || echo "OK"
```

## Sign-off

### ✅ Deployment Approval

- [ ] **Security Team**: _________________ Date: _________
- [ ] **Development Team**: _____________ Date: _________
- [ ] **Operations Team**: ______________ Date: _________
- [ ] **Product Owner**: _______________ Date: _________

### ✅ Go-Live Confirmation

- [ ] **All tests passed**: _________________ Date: _________
- [ ] **Monitoring active**: _______________ Date: _________
- [ ] **Documentation updated**: ___________ Date: _________
- [ ] **Team notified**: _________________ Date: _________

**Deployment Completed**: _________________ Date: _________
