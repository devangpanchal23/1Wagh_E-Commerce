const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartQty, removeFromCart, syncCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getCart);
router.post('/add', protect, addToCart);
router.put('/update', protect, updateCartQty);
router.delete('/remove/:productId', protect, removeFromCart);
router.post('/sync', protect, syncCart);

module.exports = router;
