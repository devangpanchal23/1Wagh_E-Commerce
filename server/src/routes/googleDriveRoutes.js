const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  connectGoogleDrive,
  getConnectionStatus,
  getAccessToken,
  disconnectGoogleDrive,
  getGoogleDriveConfig,
} = require('../controllers/googleDriveController');
const { verifyAdminToken } = require('../middleware/adminAuth');

const connectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many Google Drive connection attempts, please try again later.',
  },
});

const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many access token requests, please try again later.',
  },
});

// All routes require admin token authentication
router.use(verifyAdminToken);

router.get('/config', getGoogleDriveConfig);
router.post('/connect', connectLimiter, connectGoogleDrive);
router.get('/status', getConnectionStatus);
router.get('/access-token', tokenLimiter, getAccessToken);
router.delete('/disconnect', disconnectGoogleDrive);

module.exports = router;
