const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: (info, callback) => {
        const origin = info.origin || info.req.headers.origin;
        callback(true, 200, 'Accept all connections'); // Accept all for now, implement proper verification later
      }
    });
    this.rooms = new Map(); // auctionId -> Set of WebSocket connections

    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection');

      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Send initial connection acknowledgment
      ws.send(JSON.stringify({ type: 'connected' }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        ws.terminate();
      });
    });

    // Implement ping/pong to keep connections alive
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping(() => {});
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'auth':
        this.handleAuth(ws, data.token);
        break;
      case 'joinAuction':
        this.joinAuctionRoom(ws, data.auctionId);
        break;
      case 'leaveAuction':
        this.leaveAuctionRoom(ws, data.auctionId);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  handleAuth(ws, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.id;
      ws.send(JSON.stringify({ type: 'authSuccess' }));
    } catch (error) {
      ws.send(JSON.stringify({ type: 'authError', message: 'Invalid token' }));
      ws.close();
    }
  }

  joinAuctionRoom(ws, auctionId) {
    if (!this.rooms.has(auctionId)) {
      this.rooms.set(auctionId, new Set());
    }
    this.rooms.get(auctionId).add(ws);
    ws.auctionId = auctionId;
  }

  leaveAuctionRoom(ws, auctionId) {
    const room = this.rooms.get(auctionId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(auctionId);
      }
    }
    delete ws.auctionId;
  }

  handleDisconnect(ws) {
    if (ws.auctionId) {
      this.leaveAuctionRoom(ws, ws.auctionId);
    }
  }

  broadcastToAuction(auctionId, message) {
    const room = this.rooms.get(auctionId);
    if (room) {
      room.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }
}

module.exports = WebSocketService; 