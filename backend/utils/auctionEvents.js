const handleAuctionEvents = (wsService) => ({
  // Called when a new bid is placed
  onNewBid: (auctionId) => {
    wsService.broadcastBid(auctionId, {
      type: 'bid',
      auctionId,
      timestamp: new Date()
    });
  },

  // Called when an auction ends
  onAuctionEnd: async (auction, winner) => {
    wsService.broadcastAuctionEnd(auction._id, {
      winnerId: winner._id,
      winnerName: winner.fullName,
      winningBid: auction.winningBid
    });
  },

  // Called when auction status changes
  onAuctionStatusChange: (auctionId, status) => {
    if (wsService.auctionRooms.has(auctionId)) {
      const room = wsService.auctionRooms.get(auctionId);
      room.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'statusUpdate',
            auctionId,
            status,
            timestamp: new Date()
          }));
        }
      });
    }
  }
});

module.exports = handleAuctionEvents; 