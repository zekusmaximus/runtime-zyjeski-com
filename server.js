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

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { info, error } from './lib/logger.js';

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

// Middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

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

// Routes
app.use('/api', apiRoutes);
app.use('/api/consciousness', consciousnessRoutes);

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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