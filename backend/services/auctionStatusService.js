const Auction = require('../models/Auction');

class AuctionStatusService {
  constructor(wss) {
    this.wss = wss;
    this.updateInterval = null;
  }

  start() {
    // Update statuses every minute
    this.updateInterval = setInterval(async () => {
      await this.updateAuctionStatuses();
    }, 60000);

    // Initial update
    this.updateAuctionStatuses();
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  async updateAuctionStatuses() {
    try {
      const before = await Auction.find({}, 'status');
      await Auction.updateStatuses();
      const after = await Auction.find({}, 'status');

      // Find changed auctions and notify clients
      before.forEach((beforeAuction) => {
        const afterAuction = after.find(a => a._id.equals(beforeAuction._id));
        if (afterAuction && beforeAuction.status !== afterAuction.status) {
          this.notifyStatusChange(afterAuction._id, afterAuction.status);
        }
      });
    } catch (error) {
      console.error('Error updating auction statuses:', error);
    }
  }

  notifyStatusChange(auctionId, status) {
    this.wss.clients.forEach((client) => {
      if (client.auctionId === auctionId.toString() && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'statusUpdate',
          status
        }));
      }
    });
  }
}

module.exports = AuctionStatusService; 