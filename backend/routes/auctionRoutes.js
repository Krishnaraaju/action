const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const {
  createAuction,
  getAuctions,
  getAuction,
  updateAuction,
  deleteAuction
} = require('../controllers/auctionController');

router.use(protect);

router
  .route('/')
  .post(restrictTo('seller', 'both'), createAuction)
  .get(getAuctions);

router
  .route('/:id')
  .get(getAuction)
  .put(restrictTo('seller', 'both'), updateAuction)
  .delete(restrictTo('seller', 'both'), deleteAuction);

module.exports = router; 