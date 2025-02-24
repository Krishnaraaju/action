const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const User = require('../models/User');
const { encryptBid } = require('../utils/encrypt');

// @desc    Submit a bid
// @route   POST /api/bids
// @access  Private/Buyer
const submitBid = async (req, res) => {
  try {
    const { auctionId, amount } = req.body;

    // Validate auctionId
    if (!auctionId || !mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid auction ID'
      });
    }

    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid bid amount'
      });
    }

    // Find the auction and update its status
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found'
      });
    }

    // Update and check status
    auction.updateStatus();
    if (auction.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot place bid - auction is ${auction.status}`
      });
    }

    // Check if bid amount is higher than current price
    if (amount <= auction.currentPrice) {
      return res.status(400).json({
        status: 'error',
        message: 'Bid amount must be higher than current price'
      });
    }

    // Get the user's name
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Create bid and update auction
    const bid = await Bid.create({
      auction: auctionId,
      bidder: req.user.id,
      bidderName: user.fullName || user.username,
      amount
    });

    auction.currentPrice = amount;
    auction.bidCount += 1;
    await auction.save();

    // Notify clients using the WebSocket service
    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.broadcastToAuction(auctionId, {
        type: 'bidUpdate',
        auctionId,
        bidCount: auction.bidCount,
        lastBidder: bid.bidderName
      });
    }

    res.status(201).json({
      status: 'success',
      data: { 
        bid: {
          ...bid.toObject(),
          bidderName: bid.bidderName
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get bids for an auction
// @route   GET /api/bids/auction/:auctionId
// @access  Private
const getBids = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const bids = await Bid.find({ auction: auctionId })
      .select('amount timestamp bidderName revealed')
      .sort('-timestamp');

    res.json({
      status: 'success',
      data: { bids }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Reveal a bid
// @route   POST /api/bids/:id/reveal
// @access  Private
const revealBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({
        status: 'error',
        message: 'Bid not found'
      });
    }

    // Only allow bid reveal if auction has ended
    const auction = await Auction.findById(bid.auction);
    if (auction.status !== 'ended') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot reveal bid before auction ends'
      });
    }

    bid.revealed = true;
    await bid.save();

    res.json({
      status: 'success',
      data: { bid }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  submitBid,
  getBids,
  revealBid
}; 