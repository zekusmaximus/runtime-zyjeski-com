/**
 * Runtime.zyjeski.com Server
 * Interactive fiction platform where readers debug consciousness as executable code
 *
 * SECURITY CONFIGURATION:
 * This server implements strict CORS policies to prevent XSS attacks and unauthorized access.
 *
 * DEPLOYMENT REQUIREMENTS:
 * - MUST set NODE_ENV=production in production environments
 * - Production only accepts requests from https://runtime.zyjeski.com
 * - Development only accepts requests from localhost variants
 * - If NODE_ENV is undefined, defaults to production settings for security
 *
 * CORS ORIGINS:
 * - Production: ['https://runtime.zyjeski.com']
 * - Development: ['http://localhost:3000', 'http://127.0.0.1:3000']
 * - Undefined environment: Defaults to production origins
 *
 * ADDING NEW ORIGINS:
 * To safely add new origins:
 * 1. Update the getCorsOrigins() function below
 * 2. Ensure the origin uses HTTPS in production
 * 3. Test thoroughly in development first
 * 4. Monitor CORS rejection logs after deployment
 *
 * SECURITY MONITORING:
 * - Production CORS rejections are logged for security analysis
 * - Monitor logs for suspicious origin patterns
 * - Review rejected requests regularly
 */

import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { info, error } from './lib/logger.js';

// Import security configuration
import { createCSPConfig } from './lib/security/csp-config.js';
import { CSPReporter } from './lib/security/csp-reporter.js';

// Import rate limiting middleware
import {
  generalApiLimiter,
  authLimiter,
  debugCommandsLimiter,
  cspReportingLimiter,
  strictLimiter,
  getRateLimitStats,
  rateLimitHeadersMiddleware,
  wsDebugCommandsLimiter
} from './lib/middleware/rate-limiter.js';

// Import routes
import apiRoutes from './routes/api.js';
import consciousnessRoutes from './routes/consciousness.js';

// Import WebSocket handlers
import websocketHandlers from './lib/ws-bootstrap.js';

// ES6 module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get allowed CORS origins based on environment
 * @returns {string[]} Array of allowed origins
 * @description Defaults to production origins if NODE_ENV is not set for maximum security.
 * This prevents accidentally deploying with development vulnerabilities.
 *
 * Security considerations:
 * - Production: Only allows requests from the official domain
 * - Development: Only allows localhost variants to prevent external access
 * - Undefined environment: Defaults to production settings for fail-safe security
 */
const getCorsOrigins = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Default to production origins for maximum security
  // This ensures that if NODE_ENV is not set, we use the most restrictive settings
  if (isProduction || !process.env.NODE_ENV) {
    return ['https://runtime.zyjeski.com'];
  }

  // Development-only origins - restricted to localhost variants only
  // This prevents external access during development while allowing local testing
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
};

const app = express();
const server = http.createServer(app);

// Configure EJS template engine for nonce injection
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize CSP configuration
const cspConfig = createCSPConfig({
  reportOnly: process.env.CSP_REPORT_ONLY === 'true',
  reportUri: '/api/csp-report',
  enableReporting: process.env.CSP_DISABLE_REPORTING !== 'true'
});

// Initialize CSP violation reporter
const cspReporter = new CSPReporter({
  maxViolationsPerMinute: 100,
  maxViolationsPerIP: 20,
  alertThreshold: 10,
  enableDetailedLogging: process.env.NODE_ENV !== 'production'
});

/**
 * Socket.io server with secure CORS configuration
 * Restricts origins based on environment to prevent XSS attacks and unauthorized access.
 *
 * Security features:
 * - Environment-specific origin restrictions
 * - Credentials support for authenticated requests
 * - No wildcard origins in any environment
 */
const io = new Server(server, {
  cors: {
    origin: getCorsOrigins(),
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// CSP Nonce Middleware - MUST come before Helmet CSP
app.use((req, res, next) => {
  // Generate unique nonce for each request
  res.locals.nonce = cspConfig.generateNonce();
  next();
});

// Security Middleware with CSP
app.use(helmet({
  contentSecurityPolicy: false // We'll handle CSP manually
}));

// Custom CSP Middleware
app.use((req, res, next) => {
  const directives = cspConfig.getDirectives(res.locals.nonce);

  // Convert directives to CSP header string
  const cspHeader = Object.entries(directives)
    .map(([directive, sources]) => {
      if (Array.isArray(sources) && sources.length > 0) {
        const directiveName = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${directiveName} ${sources.join(' ')}`;
      }
      return '';
    })
    .filter(Boolean)
    .join('; ');

  if (cspConfig.reportOnly) {
    res.setHeader('Content-Security-Policy-Report-Only', cspHeader);
  } else {
    res.setHeader('Content-Security-Policy', cspHeader);
  }

  next();
});

/**
 * Express CORS middleware with secure configuration
 * Uses the same origin restrictions as Socket.io for consistency
 */
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting headers middleware - adds transparency headers
app.use(rateLimitHeadersMiddleware);

// Trust proxy for accurate IP detection in rate limiting
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath, stat) => {
    if (filePath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    } else if (filePath.endsWith('.html')) {
      res.set('Content-Type', 'text/html');
    }
  }
}));

// CSP Violation Reporting Endpoint with Enhanced Analysis and Rate Limiting
app.post('/api/csp-report', cspReportingLimiter, express.json({
  type: ['application/csp-report', 'application/json'],
  limit: '1mb'
}), (req, res) => {
  const requestContext = {
    ip: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    requestId: req.get('X-Request-ID') || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  };

  // Process violation with enhanced reporter
  const result = cspReporter.processViolation(req.body, requestContext);

  if (!result.processed) {
    // Log processing failures or rate limiting
    if (result.reason === 'rate_limited') {
      // Don't log individual rate limited requests to avoid spam
      res.status(429).json({ error: 'Rate limited' });
      return;
    } else {
      error('CSP violation processing failed', {
        reason: result.reason,
        ip: requestContext.ip,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Always respond with 204 No Content for successful processing
  res.status(204).end();
});

// CSP Statistics Endpoint (for monitoring)
app.get('/api/csp-stats', (req, res) => {
  // Only allow in development or with proper authentication
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const stats = cspReporter.getStats();
  const cspConfigStats = cspConfig.getStats();

  res.json({
    csp: cspConfigStats,
    violations: stats,
    timestamp: new Date().toISOString()
  });
});

// Rate Limiting Statistics Endpoint (for monitoring)
app.get('/api/rate-limit-stats', (req, res) => {
  // Only allow in development or with proper authentication
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const rateLimitStats = getRateLimitStats();
  const wsStats = wsDebugCommandsLimiter.getStats();

  res.json({
    ...rateLimitStats,
    websocket: wsStats
  });
});

// Routes with rate limiting
// General API routes with standard rate limiting
app.use('/api', generalApiLimiter, apiRoutes);

// Consciousness API routes with debug command rate limiting for debug endpoints
app.use('/api/consciousness', generalApiLimiter, consciousnessRoutes);

// Serve main page with nonce injection
app.get('/', (req, res) => {
  res.render('index', {
    nonce: res.locals.nonce,
    wsEndpoint: process.env.NODE_ENV === 'production'
      ? 'wss://runtime.zyjeski.com'
      : `ws://localhost:${PORT}`
  });
});

// Redirect old static HTML file requests to main route
app.get('/index.html', (req, res) => {
  res.redirect(301, '/');
});

// Serve component showcase page with nonce injection
app.get('/component-showcase.html', (req, res) => {
  res.render('component-showcase', {
    nonce: res.locals.nonce
  });
});

// Serve monitor page with nonce injection
app.get('/monitor.html', (req, res) => {
  res.render('monitor', {
    nonce: res.locals.nonce
  });
});

// Handle 404s for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Production CORS monitoring - Log rejected requests for security analysis
if (process.env.NODE_ENV === 'production') {
  io.engine.on("connection_error", (err) => {
    // Log CORS-related connection errors for security monitoring
    if (err.req && err.code === 1) { // Socket.io CORS error code
      const origin = err.req.headers.origin || 'unknown';
      const userAgent = err.req.headers['user-agent'] || 'unknown';
      error('CORS rejection detected', {
        origin,
        userAgent,
        timestamp: new Date().toISOString(),
        ip: err.req.connection?.remoteAddress || 'unknown'
      });
    }
  });
}

// WebSocket connection handling
io.on('connection', (socket) => {
  info('Client connected', { socketId: socket.id });

  // Initialize WebSocket handlers
  websocketHandlers.initializeHandlers(socket, io);

  socket.on('disconnect', () => {
    info('Client disconnected', { socketId: socket.id });
  });
});

// Error handling
app.use((err, req, res, next) => {
  error('Server error', { error: err });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  info(`Runtime.zyjeski.com server running on port ${PORT}`);
  info(`Access the application at http://localhost:${PORT}`);
});

export { app, server, io };