const express = require('express');
const router = express.Router({ mergeParams: true });
const { getProductReviews, addReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/products/:productId/reviews', getProductReviews);
router.post('/products/:productId/reviews', protect, addReview);

module.exports = router;
