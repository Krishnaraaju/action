const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  startPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'ended'],
    default: 'upcoming'
  },
  bidCount: {
    type: Number,
    default: 0
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  winningBid: {
    type: Number
  },
  isSealed: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for querying auctions by status and time
auctionSchema.index({ status: 1, startTime: 1, endTime: 1 });

// Update status based on current time
auctionSchema.methods.updateStatus = function() {
  const now = new Date();
  if (now >= this.endTime) {
    this.status = 'ended';
  } else if (now >= this.startTime) {
    this.status = 'active';
  } else {
    this.status = 'upcoming';
  }
};

// Pre-save middleware to update status
auctionSchema.pre('save', function(next) {
  this.updateStatus();
  next();
});

// Static method to update statuses in bulk
auctionSchema.statics.updateStatuses = async function() {
  const now = new Date();
  
  // Update upcoming to active
  await this.updateMany(
    { 
      status: 'upcoming',
      startTime: { $lte: now }
    },
    { status: 'active' }
  );

  // Update active to ended
  await this.updateMany(
    {
      status: 'active',
      endTime: { $lte: now }
    },
    { status: 'ended' }
  );
};

module.exports = mongoose.model('Auction', auctionSchema); 