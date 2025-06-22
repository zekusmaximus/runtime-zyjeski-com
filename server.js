const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Import routes
const apiRoutes = require('./routes/api');
const consciousnessRoutes = require('./routes/consciousness');

// Import WebSocket handlers
const websocketHandlers = require('./lib/websocket-handlers');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for development
}));
app.use(cors());
app.use(express.json());
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
  console.log('Client connected:', socket.id);
  
  // Initialize WebSocket handlers
  websocketHandlers.initializeHandlers(socket, io);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Runtime.zyjeski.com server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});

module.exports = { app, server, io };