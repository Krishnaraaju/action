const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const {
  submitBid,
  getBids,
  revealBid
} = require('../controllers/bidController');

router.use(protect);

router.post('/', restrictTo('buyer', 'both'), submitBid);
router.get('/auction/:auctionId', getBids);
router.post('/:id/reveal', revealBid);

module.exports = router; 