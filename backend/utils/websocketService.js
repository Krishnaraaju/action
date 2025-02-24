const WebSocket = require('ws');

class WebSocketService {
  constructor(wss) {
    this.wss = wss;
  }

  broadcastToAuction(auctionId, message) {
    if (!this.wss) return;

    this.wss.clients.forEach((client) => {
      if (client.auctionId === auctionId.toString() && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  broadcastToAll(message) {
    if (!this.wss) return;

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  handleConnection(ws) {
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Received message:', data);
        
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          case 'auth':
            ws.token = data.token;
            break;
          case 'joinAuction':
            ws.auctionId = data.auctionId;
            console.log(`Client joined auction: ${data.auctionId}`);
            break;
          case 'leaveAuction':
            delete ws.auctionId;
            console.log(`Client left auction: ${data.auctionId}`);
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      if (ws.auctionId) {
        console.log(`Client left auction: ${ws.auctionId} due to disconnect`);
        delete ws.auctionId;
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send initial connection success message
    ws.send(JSON.stringify({ type: 'connected' }));
  }

  startHeartbeat() {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }
}

module.exports = WebSocketService; 