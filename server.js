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
import websocketHandlers from './lib/websocket-handlers.js';

// ES6 module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // Restrict origins in production
    origin: process.env.NODE_ENV === 'production' ? ['https://runtime.zyjeski.com'] : '*',
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false, // Strict CSP in production
}));
app.use(cors());
app.use(express.json({ limit: '1mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true }));

// Fix MIME type issues by explicitly setting static file options
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