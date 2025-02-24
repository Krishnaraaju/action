const mongoose = require('mongoose');
const Auction = require('../models/Auction');
require('dotenv').config();

const seedAuctions = async (userId) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const auctions = [
      {
        title: 'Vintage Watch',
        description: 'Rare vintage watch in excellent condition',
        startPrice: 100,
        currentPrice: 100,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000), // 1 hour from now
        seller: userId,
        status: 'active'
      },
      {
        title: 'Antique Vase',
        description: 'Beautiful antique vase from the 18th century',
        startPrice: 500,
        currentPrice: 500,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7200000), // 2 hours from now
        seller: userId,
        status: 'active'
      }
    ];

    const createdAuctions = await Auction.insertMany(auctions);
    console.log('Auctions seeded successfully:', createdAuctions);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding auctions:', error);
    process.exit(1);
  }
};

// Usage: node seedAuctions.js <userId>
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID');
  process.exit(1);
}

seedAuctions(userId); 