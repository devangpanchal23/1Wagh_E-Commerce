const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');

router.get('/orders/:orderId/receipt/payment', protect, receiptController.getPaymentReceipt);
router.get('/orders/:orderId/receipt/invoice', protect, receiptController.getPurchaseInvoice);

module.exports = router;
