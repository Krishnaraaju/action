require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const WebSocket = require('ws');
const AuctionStatusService = require('./services/auctionStatusService');
const WebSocketService = require('./utils/websocketService');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server: httpServer,
  path: '/ws'
});

// Initialize WebSocket service
const wsService = new WebSocketService(wss);

// Initialize auction status service
const auctionStatusService = new AuctionStatusService(wss);
auctionStatusService.start();

// Set up WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  wsService.handleConnection(ws);
});

// Start heartbeat
wsService.startHeartbeat();

// Make WebSocket service available to routes
app.set('wsService', wsService);
app.set('auctionStatusService', auctionStatusService);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bids', require('./routes/bidRoutes'));
app.use('/api/auctions', require('./routes/auctionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`WebSocket server is running on ws://localhost:${PORT}/ws`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Cleanup on server shutdown
process.on('SIGTERM', () => {
  auctionStatusService.stop();
  wss.close();
  // ... other cleanup
}); 