const Auction = require('../models/Auction');
const User = require('../models/User');
const emailService = require('./emailService');
const mongoose = require('mongoose');

class AuctionEndService {
  constructor(wsService) {
    this.wsService = wsService;
  }

  async handleAuctionEnd(auctionId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const auction = await Auction.findById(auctionId)
        .populate('seller', 'email fullName')
        .populate('bids.bidder', 'email fullName')
        .session(session);

      if (!auction || auction.status !== 'ended') {
        await session.abortTransaction();
        return;
      }

      // Determine winner
      const winningBid = await auction.determineWinner();
      if (!winningBid) {
        await session.abortTransaction();
        return;
      }

      // Update auction status atomically
      auction.status = 'completed';
      auction.winner = winningBid.bidder;
      await auction.save({ session });

      // Send notifications
      await Promise.all([
        emailService.sendAuctionWinEmail(winningBid.bidder, auction),
        this.wsService.broadcastToAuction(auctionId, {
          type: 'auctionEnd',
          winner: {
            userId: winningBid.bidder._id,
            name: winningBid.bidder.fullName,
            amount: winningBid.amount
          },
          auctionTitle: auction.title
        })
      ]);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error('Error handling auction end:', error);
    } finally {
      session.endSession();
    }
  }
}

module.exports = AuctionEndService; 