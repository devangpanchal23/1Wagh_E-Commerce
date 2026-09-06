const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const {
  adminLogin,
  adminLogout,
  verifyAdminSession,
  updateAdminCredentials,
  getAdminStats,
  getAdminOrders,
  updateAdminOrderStatus,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  bulkDeleteAdminProducts,
  deleteAllAdminProducts,
  getAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
  getAdminBrands,
  createAdminBrand,
  deleteAdminBrand,
  getAdminUsers,
  exportAdminUsers,
} = require('../controllers/adminController');
const { uploadProductImage, getMediaGallery } = require('../controllers/mediaController');
const couponController = require('../controllers/couponController');
const { verifyAdminToken } = require('../middleware/adminAuth');
const { UPLOADS_DIR, ensureUploadsDirectoryWritable } = require('../services/uploadStorageService');

// Vercel (and other serverless-Lambda-based) deployments ship a read-only
// filesystem — only /tmp is writable, and it's wiped between invocations, so
// anything written there is gone before it could ever be served back out.
// diskStorage's `EROFS: read-only file system` there isn't a bug to patch
// around; local disk simply isn't durable storage in that environment. Use
// memoryStorage instead so the controller gets a Buffer it can push straight
// to GitHub-backed cloud storage, and keep the disk-backed path (with its
// local gallery + background GitHub sync) for local/dev servers where the
// filesystem is real and persistent.
const IS_SERVERLESS = !!process.env.VERCEL;

const storage = IS_SERVERLESS
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function (req, file, cb) {
        try {
          cb(null, ensureUploadsDirectoryWritable());
        } catch (error) {
          cb(error);
        }
      },
      filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `wagh_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
      },
    });

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|webp|svg)$/i;
  if (allowed.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and SVG images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Rate limiter specifically for admin login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 login attempts per window per IP
  message: {
    success: false,
    message: 'Too many admin login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public admin auth endpoints
router.post('/login', loginLimiter, adminLogin);
router.post('/logout', adminLogout);

// Protected admin endpoints — ALL use verifyAdminToken middleware exclusively
router.use(verifyAdminToken);

router.get('/verify', verifyAdminSession);
router.put('/credentials', updateAdminCredentials);
router.get('/stats', getAdminStats);
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', updateAdminOrderStatus);

router.get('/products', getAdminProducts);
router.post('/products', createAdminProduct);
router.delete('/products/all', deleteAllAdminProducts);
router.post('/products/all', deleteAllAdminProducts);
router.post('/products/delete-all', deleteAllAdminProducts);
router.post('/products/bulk-delete', bulkDeleteAdminProducts);
router.delete('/products/bulk-delete', bulkDeleteAdminProducts);
router.put('/products/:id', updateAdminProduct);
router.delete('/products/:id', deleteAdminProduct);

router.get('/categories', getAdminCategories);
router.post('/categories', createAdminCategory);
router.delete('/categories/:id', deleteAdminCategory);

router.get('/brands', getAdminBrands);
router.post('/brands', createAdminBrand);
router.delete('/brands/:id', deleteAdminBrand);

router.get('/users', getAdminUsers);
// Returns a binary .xlsx attachment rather than JSON
router.get('/users/export', exportAdminUsers);

// Admin Coupon Management Routes (protected by verifyAdminToken)
router.get('/coupons', couponController.getAllCoupons);
router.post('/coupons', couponController.createCoupon);
router.patch('/coupons/:id', couponController.updateCoupon);
router.patch('/coupons/:id/publish', couponController.publishCoupon);
router.patch('/coupons/:id/unpublish', couponController.unpublishCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

// Media Gallery & Image Upload Routes
router.post('/upload', upload.single('image'), uploadProductImage);
router.get('/media', getMediaGallery);

module.exports = router;
