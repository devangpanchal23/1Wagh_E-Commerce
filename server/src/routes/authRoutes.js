const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendEmailOtp,
  verifyEmailOtp,
  getSavedAddress,
  updateSavedAddress,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Mobile Phone OTP verification endpoints
router.post('/phone/send-otp', protect, sendPhoneOtp);
router.post('/profile/phone/send-otp', protect, sendPhoneOtp);
router.post('/phone/verify-otp', protect, verifyPhoneOtp);
router.post('/profile/phone/verify-otp', protect, verifyPhoneOtp);

// Email OTP verification endpoints (Resend SMTP)
router.post('/email/send-otp', protect, sendEmailOtp);
router.post('/profile/email/send-otp', protect, sendEmailOtp);
router.post('/email/verify-otp', protect, verifyEmailOtp);
router.post('/profile/email/verify-otp', protect, verifyEmailOtp);

// Saved Address endpoints (protected by user session/JWT)
router.get('/saved-address', protect, getSavedAddress);
router.put('/saved-address', protect, updateSavedAddress);

module.exports = router;
