# Rate Limiting Implementation

This document describes the comprehensive rate limiting system implemented for runtime.zyjeski.com.

## Overview

The rate limiting system provides protection against abuse and ensures fair resource usage across different types of API endpoints and WebSocket connections.

## Features

- **Multiple Rate Limit Types**: Different limits for different endpoint categories
- **IP-based Tracking**: Tracks requests per IP address
- **WebSocket Rate Limiting**: Special handling for real-time debug commands
- **Development Bypass**: Can be disabled in development mode
- **Comprehensive Monitoring**: Statistics and logging for all rate limit events
- **Proper HTTP Headers**: Standard rate limit headers in responses
- **Custom Error Messages**: User-friendly error messages per endpoint type

## Rate Limits

### HTTP API Endpoints

| Endpoint Type | Limit | Window | Description |
|---------------|-------|--------|-------------|
| General API | 100 requests | 15 minutes | Standard API endpoints like `/api/characters` |
| Auth Endpoints | 5 requests | 15 minutes | Authentication-related endpoints (future) |
| Debug Commands | 30 requests | 1 minute | Debug command endpoints like `/api/debug/:id` |
| CSP Reporting | 50 requests | 5 minutes | Content Security Policy violation reports |
| Strict Operations | 10 requests | 1 hour | Sensitive operations requiring strict limits |

### WebSocket Connections

| Connection Type | Limit | Window | Description |
|----------------|-------|--------|-------------|
| Debug Commands | 30 commands | 1 minute | WebSocket debug commands per socket |

## Implementation Details

### HTTP Rate Limiting

Uses `express-rate-limit` middleware with custom configuration:

```javascript
import { generalApiLimiter, debugCommandsLimiter } from './lib/middleware/rate-limiter.js';

// Apply to routes
app.use('/api', generalApiLimiter, apiRoutes);
app.use('/api/debug', debugCommandsLimiter, debugRoutes);
```

### WebSocket Rate Limiting

Custom implementation tracking requests per socket ID:

```javascript
import { wsDebugCommandsLimiter } from './lib/middleware/rate-limiter.js';

// Check rate limit before processing command
const rateLimitResult = wsDebugCommandsLimiter.checkLimit(socket.id);
if (!rateLimitResult.allowed) {
  socket.emit('debug-result', {
    success: false,
    result: { 
      error: 'Rate limit exceeded',
      retryAfter: rateLimitResult.retryAfter
    }
  });
  return;
}
```

## Configuration

### Environment Variables

- `NODE_ENV=development`: Enables development mode
- `DISABLE_RATE_LIMITING=true`: Disables rate limiting in development

### Development Mode

In development mode:
- Rate limiting can be completely disabled with `DISABLE_RATE_LIMITING=true`
- Static assets are excluded from rate limiting
- More detailed logging is enabled
- Statistics endpoint is available at `/api/rate-limit-stats`

### Production Mode

In production mode:
- All rate limits are strictly enforced
- Statistics endpoint returns 404
- Minimal logging to prevent spam
- Optimized for performance

## HTTP Headers

Rate limited responses include standard headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 900
```

## Error Responses

Rate limit exceeded responses use HTTP 429 status:

```json
{
  "error": "Too Many Requests",
  "message": "Too many API requests. Please wait before making more requests.",
  "type": "rate_limit_exceeded",
  "limitType": "general_api",
  "retryAfter": "900",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

## Monitoring

### Statistics Endpoint

Available in development at `/api/rate-limit-stats`:

```json
{
  "enabled": true,
  "environment": "development",
  "limits": {
    "general_api": { "windowMs": 900000, "max": 100 },
    "debug_commands": { "windowMs": 60000, "max": 30 }
  },
  "websocket": {
    "activeSockets": 5,
    "totalRequests": 150,
    "blockedSockets": 2
  }
}
```

### Logging

Rate limit events are logged with appropriate levels:

- **INFO**: Rate limit threshold reached
- **WARN**: Rate limit exceeded
- **ERROR**: Rate limiting system errors

## Testing

Run the rate limiting test suite:

```bash
node test-rate-limiting.js
```

This will:
- Test HTTP API rate limiting
- Test WebSocket rate limiting
- Verify proper headers and error responses
- Display comprehensive statistics

## Security Considerations

1. **IP Detection**: Uses multiple methods to detect real client IP
2. **Header Validation**: Validates `X-Forwarded-For` headers
3. **Memory Management**: Automatic cleanup of old rate limit data
4. **DoS Protection**: Prevents memory exhaustion attacks
5. **Bypass Prevention**: Development bypass requires explicit configuration

## Future Enhancements

1. **Redis Store**: For distributed rate limiting across multiple servers
2. **Dynamic Limits**: Adjust limits based on system load
3. **User-based Limits**: Different limits for authenticated users
4. **Whitelist/Blacklist**: IP-based allow/deny lists
5. **Rate Limit Bursts**: Allow temporary bursts above normal limits

## Troubleshooting

### Common Issues

1. **Headers Missing**: Ensure `trust proxy` is configured correctly
2. **Development Bypass**: Check `NODE_ENV` and `DISABLE_RATE_LIMITING` variables
3. **WebSocket Limits**: Verify socket ID is being passed correctly
4. **Memory Usage**: Monitor rate limiter cleanup intervals

### Debug Commands

```bash
# Check rate limit stats
curl http://localhost:3000/api/rate-limit-stats

# Test rate limiting
node test-rate-limiting.js

# Monitor server logs
tail -f logs/server.log | grep "rate limit"
```
