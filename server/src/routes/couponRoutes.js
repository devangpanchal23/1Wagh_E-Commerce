const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Client route to validate and apply coupon (uses customer auth)
router.post('/coupons/apply', protect, couponController.applyCoupon);

// Admin routes for managing coupons (uses dedicated admin auth token)
router.post('/admin/coupons', verifyAdminToken, couponController.createCoupon);
router.get('/admin/coupons', verifyAdminToken, couponController.getAllCoupons);
router.patch('/admin/coupons/:id', verifyAdminToken, couponController.updateCoupon);
router.patch('/admin/coupons/:id/publish', verifyAdminToken, couponController.publishCoupon);
router.patch('/admin/coupons/:id/unpublish', verifyAdminToken, couponController.unpublishCoupon);
router.delete('/admin/coupons/:id', verifyAdminToken, couponController.deleteCoupon);

module.exports = router;
