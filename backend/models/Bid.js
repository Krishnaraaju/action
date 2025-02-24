const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bidderName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  revealed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for querying bids by auction and bidder
bidSchema.index({ auction: 1, bidder: 1 });

module.exports = mongoose.model('Bid', bidSchema); 