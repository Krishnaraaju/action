const Auction = require('../models/Auction');
const WebSocketService = require('../utils/websocket');
const mongoose = require('mongoose');

// @desc    Create new auction
// @route   POST /api/auctions
// @access  Private/Seller
const createAuction = async (req, res) => {
  try {
    const { title, description, startPrice, startTime, endTime } = req.body;

    // Validate times
    const now = new Date();
    const startTimeDate = new Date(startTime);
    const endTimeDate = new Date(endTime);

    if (startTimeDate < now) {
      return res.status(400).json({
        status: 'error',
        message: 'Start time must be in the future'
      });
    }

    if (endTimeDate <= startTimeDate) {
      return res.status(400).json({
        status: 'error',
        message: 'End time must be after start time'
      });
    }

    // Create auction
    const auction = await Auction.create({
      title,
      description,
      startPrice,
      currentPrice: startPrice, // Initial current price is the start price
      startTime: startTimeDate,
      endTime: endTimeDate,
      seller: req.user.id,
      bidCount: 0,
      isSealed: true // All auctions are sealed by default
    });

    // Populate seller information
    await auction.populate('seller', 'fullName email');

    res.status(201).json({
      status: 'success',
      data: { auction }
    });

    // Schedule auction status updates
    const startDelay = startTimeDate.getTime() - now.getTime();
    const endDelay = endTimeDate.getTime() - now.getTime();

    if (startDelay > 0) {
      setTimeout(async () => {
        await Auction.findByIdAndUpdate(auction._id, { status: 'active' });
        // Notify through WebSocket
        req.app.get('wsService').broadcastToAuction(auction._id, {
          type: 'statusUpdate',
          status: 'active'
        });
      }, startDelay);
    }

    if (endDelay > 0) {
      setTimeout(async () => {
        await Auction.findByIdAndUpdate(auction._id, { status: 'ended' });
        // Notify through WebSocket
        req.app.get('wsService').broadcastToAuction(auction._id, {
          type: 'statusUpdate',
          status: 'ended'
        });
      }, endDelay);
    }

  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get all auctions
// @route   GET /api/auctions
// @access  Private
const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate('seller', 'fullName email')
      .sort('-createdAt');

    res.json({
      status: 'success',
      data: { auctions }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get single auction
// @route   GET /api/auctions/:id
// @access  Private
const getAuction = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid auction ID'
      });
    }

    const auction = await Auction.findById(id)
      .populate('seller', 'fullName email')
      .populate('winner', 'fullName email');

    if (!auction) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found'
      });
    }

    res.json({
      status: 'success',
      data: { auction }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update auction
// @route   PUT /api/auctions/:id
// @access  Private/Seller
const updateAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found'
      });
    }

    // Check if user is auction seller
    if (auction.seller.toString() !== req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to update this auction'
      });
    }

    const updatedAuction = await Auction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Broadcast update using the WebSocket service
    const wsService = req.app.get('wsService');
    if (wsService) {
      wsService.broadcastToAuction(auction._id, {
        type: 'auctionUpdate',
        auction: {
          id: auction._id,
          status: auction.status,
          currentPrice: auction.currentPrice,
          bidCount: auction.bidCount
        }
      });
    }

    res.json({
      status: 'success',
      data: { auction: updatedAuction }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete auction
// @route   DELETE /api/auctions/:id
// @access  Private/Seller
const deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({
        status: 'error',
        message: 'Auction not found'
      });
    }

    // Check if user is auction seller
    if (auction.seller.toString() !== req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to delete this auction'
      });
    }

    await auction.remove();

    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  createAuction,
  getAuctions,
  getAuction,
  updateAuction,
  deleteAuction
}; 