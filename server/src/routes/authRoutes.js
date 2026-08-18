const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  registerUser,
  verifyOtp,
  loginUser,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendEmailOtp,
  getSavedAddress,
  updateSavedAddress,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Rate limiting configurations
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'Too many registration requests. Please try again later.' },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes before trying again.' },
});

// Public authentication routes
router.post('/register', registerLimiter, registerUser);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/login', loginLimiter, loginUser);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

// Protected User Profile routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Mobile Phone OTP verification endpoints
router.post('/phone/send-otp', protect, otpLimiter, sendPhoneOtp);
router.post('/profile/phone/send-otp', protect, otpLimiter, sendPhoneOtp);
router.post('/phone/verify-otp', protect, verifyPhoneOtp);
router.post('/profile/phone/verify-otp', protect, verifyPhoneOtp);

// Email OTP verification endpoints
router.post('/email/send-otp', protect, otpLimiter, sendEmailOtp);
router.post('/profile/email/send-otp', protect, otpLimiter, sendEmailOtp);
router.post('/email/verify-otp', protect, verifyOtp);
router.post('/profile/email/verify-otp', protect, verifyOtp);

// Saved Address endpoints
router.get('/saved-address', protect, getSavedAddress);
router.put('/saved-address', protect, updateSavedAddress);

module.exports = router;
