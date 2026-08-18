const User = require('../models/User');
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendRealSmsOtp } = require('../utils/smsService');
const { sendOtpEmail } = require('../utils/sendOtpEmail');

const normalizeBirthdate = (value) => {
  if (!value) return '';
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const generateAccessToken = (id, role) => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'wagh_super_secret_jwt_key_2026_premium_accessories';
  return jwt.sign({ id, role }, secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });
};

const generateRefreshToken = (id, role) => {
  const secret = process.env.JWT_REFRESH_SECRET || 'wagh_super_secret_refresh_jwt_key_2026_secure';
  return jwt.sign({ id, role }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });
};

const sendRefreshTokenCookie = (res, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'customer',
      isVerified: false,
      emailVerified: false,
      emailOtpHash: otpHash,
      emailOtpExpiresAt: expiresAt,
      emailOtpAttempts: 0,
      emailOtpLastSentAt: new Date(),
    });

    const sendResult = await sendOtpEmail(cleanEmail, otp);

    if (sendResult && sendResult.success === false) {
      return res.status(500).json({
        success: false,
        message: "We couldn't send the verification OTP right now. Please try again in a moment.",
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Verification code sent to email.',
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP after registration or email update
// @route   POST /api/v1/auth/verify-otp
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No OTP requested or OTP has expired. Please request a new OTP.' });
    }

    if (new Date() > new Date(user.emailOtpExpiresAt)) {
      user.emailOtpHash = null;
      user.emailOtpExpiresAt = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (user.emailOtpAttempts >= 5) {
      user.emailOtpHash = null;
      user.emailOtpExpiresAt = null;
      await user.save();
      return res.status(429).json({ success: false, message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otp.trim(), user.emailOtpHash);
    if (!isMatch) {
      user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ success: false, message: 'Incorrect OTP code.' });
    }

    user.isVerified = true;
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    user.emailOtpAttempts = 0;

    await user.save();

    res.json({
      success: true,
      message: 'Account verified successfully! You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & return access token + httpOnly refresh token cookie
// @route   POST /api/v1/auth/login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Refresh token rotation / multi-device management: retain max 5 active tokens
    user.refreshTokens = user.refreshTokens || [];
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens.shift();
    }
    user.refreshTokens.push({ token: refreshToken, createdAt: new Date() });
    user.lastLoginAt = new Date();
    await user.save();

    sendRefreshTokenCookie(res, refreshToken);

    res.json({
      success: true,
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: !!(user.isVerified || user.emailVerified),
        emailVerified: !!user.emailVerified,
        mobileNumber: user.mobileNumber || '',
        birthdate: normalizeBirthdate(user.birthdate),
        age: user.age || null,
        gender: user.gender || 'prefer_not_to_say',
        addresses: user.addresses || [],
      },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token using httpOnly refresh token cookie
// @route   POST /api/v1/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token cookie missing.' });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'wagh_super_secret_refresh_jwt_key_2026_secure';
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
      res.clearCookie('refreshToken', { httpOnly: true, path: '/api/v1/auth' });
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.clearCookie('refreshToken', { httpOnly: true, path: '/api/v1/auth' });
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // Check if refreshToken is registered in user's active tokens
    const tokenIndex = (user.refreshTokens || []).findIndex(t => t.token === refreshToken);
    if (tokenIndex === -1) {
      user.refreshTokens = [];
      await user.save();
      res.clearCookie('refreshToken', { httpOnly: true, path: '/api/v1/auth' });
      return res.status(401).json({ success: false, message: 'Refresh token revoked or reused.' });
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id, user.role);

    user.refreshTokens[tokenIndex] = { token: newRefreshToken, createdAt: new Date() };
    user.lastLoginAt = new Date();
    await user.save();

    sendRefreshTokenCookie(res, newRefreshToken);

    res.json({
      success: true,
      accessToken: newAccessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: !!(user.isVerified || user.emailVerified),
        emailVerified: !!user.emailVerified,
        mobileNumber: user.mobileNumber || '',
        birthdate: normalizeBirthdate(user.birthdate),
        age: user.age || null,
        gender: user.gender || 'prefer_not_to_say',
        addresses: user.addresses || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear refresh token cookie
// @route   POST /api/v1/auth/logout
exports.logoutUser = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      try {
        const refreshSecret = process.env.JWT_REFRESH_SECRET || 'wagh_super_secret_refresh_jwt_key_2026_secure';
        const decoded = jwt.verify(refreshToken, refreshSecret);
        await User.updateOne({ _id: decoded.id }, { $pull: { refreshTokens: { token: refreshToken } } });
      } catch (_) {}
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/api/v1/auth',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Request Password Reset OTP
// @desc    Request Password Reset OTP
// @route   POST /api/v1/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.json({ success: true, message: 'If an account with that email exists, an OTP code has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.emailOtpHash = otpHash;
    user.emailOtpExpiresAt = expiresAt;
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = new Date();
    await user.save();

    const sendResult = await sendOtpEmail(cleanEmail, otp, { type: 'reset_password' });

    if (sendResult && sendResult.success === false) {
      return res.status(500).json({
        success: false,
        message: "We couldn't send the OTP right now. Please try again in a moment.",
      });
    }

    res.json({
      success: true,
      message: 'Password reset OTP has been sent to your registered email address.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/v1/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No reset requested or code expired. Please request a new OTP.' });
    }

    if (new Date() > new Date(user.emailOtpExpiresAt)) {
      user.emailOtpHash = null;
      user.emailOtpExpiresAt = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'This OTP has expired. Please request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otp.trim(), user.emailOtpHash);
    if (!isMatch) {
      user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ success: false, message: 'The OTP you entered is incorrect. Please try again.' });
    }

    user.password = newPassword; // Pre-save hook hashes password
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    user.emailOtpAttempts = 0;
    await user.save();

    res.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/profile
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let computedAge = user.age;
    if (user.birthdate) {
      const dob = new Date(user.birthdate);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        let calc = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          calc--;
        }
        computedAge = calc >= 0 ? calc : 0;
      }
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: !!(user.isVerified || user.emailVerified),
        emailVerified: !!user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt || null,
        mobileNumber: user.mobileNumber || '',
        phone: user.mobileNumber || '',
        phoneVerified: !!user.phoneVerified,
        birthdate: normalizeBirthdate(user.birthdate),
        age: computedAge !== undefined && computedAge !== null ? computedAge : null,
        gender: user.gender || 'prefer_not_to_say',
        role: user.role,
        addresses: user.addresses || [],
      },
      message: 'Profile fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const existingUser = await User.findById(userId).lean();
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, mobileNumber, phone, age, gender, birthdate, addresses } = req.body;
    const errors = {};
    const targetPhone = mobileNumber !== undefined ? mobileNumber : phone;

    if (name !== undefined && name !== null && name.trim() !== '') {
      const cleanName = name.trim();
      if (cleanName.length < 2 || cleanName.length > 60) {
        errors.name = 'Name must be between 2 and 60 characters';
      }
    }

    if (email !== undefined && email !== null && email.trim() !== '') {
      const emailLower = email.trim().toLowerCase();
      if (emailLower !== existingUser.email) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(emailLower)) {
          errors.email = 'Please provide a valid email address';
        } else {
          const emailExists = await User.findOne({ email: emailLower, _id: { $ne: userId } });
          if (emailExists) {
            errors.email = 'Email address is already registered';
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation error', errors });
    }

    const updateFields = {};
    if (name !== undefined && name !== null) updateFields.name = name.trim();
    if (email !== undefined && email !== null && email.trim() !== '') {
      const emailLower = email.trim().toLowerCase();
      if (emailLower !== existingUser.email) {
        updateFields.email = emailLower;
        updateFields.emailVerified = false;
        updateFields.isVerified = false;
        updateFields.emailVerifiedAt = null;
      }
    }
    if (targetPhone !== undefined) {
      const cleanMobile = targetPhone.trim().replace(/\D/g, '');
      updateFields.mobileNumber = cleanMobile;
      if (cleanMobile !== (existingUser.mobileNumber || '')) {
        updateFields.phoneVerified = false;
      }
    }
    if (birthdate !== undefined) updateFields.birthdate = birthdate;
    if (age !== undefined) updateFields.age = age === '' || age === null ? null : Number(age);
    if (gender !== undefined) updateFields.gender = gender;
    if (addresses !== undefined) updateFields.addresses = addresses;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).select('_id name email isVerified emailVerified emailVerifiedAt mobileNumber phoneVerified birthdate age gender addresses role').lean();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isVerified: !!(updatedUser.isVerified || updatedUser.emailVerified),
        emailVerified: !!updatedUser.emailVerified,
        emailVerifiedAt: updatedUser.emailVerifiedAt || null,
        mobileNumber: updatedUser.mobileNumber || '',
        phone: updatedUser.mobileNumber || '',
        phoneVerified: !!updatedUser.phoneVerified,
        birthdate: normalizeBirthdate(updatedUser.birthdate),
        age: updatedUser.age !== undefined && updatedUser.age !== null ? updatedUser.age : null,
        gender: updatedUser.gender || 'prefer_not_to_say',
        role: updatedUser.role,
        addresses: updatedUser.addresses || [],
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to user's mobile number for verification
// @route   POST /api/v1/auth/phone/send-otp
exports.sendPhoneOtp = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const requestedPhone = req.body.phone || req.body.mobileNumber || user.mobileNumber;
    const cleanPhone = (requestedPhone || '').replace(/\D/g, '');

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number starting with 6-9',
      });
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (user.phoneOtpLastSentAt && user.phoneOtpLastSentAt > tenMinutesAgo && user.phoneOtpAttempts >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please wait 10 minutes before requesting a new code.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.mobileNumber = cleanPhone;
    user.phoneOtpHash = otpHash;
    user.phoneOtpExpiresAt = expiresAt;
    user.phoneOtpAttempts = 0;
    user.phoneOtpLastSentAt = new Date();

    await user.save();

    const smsResult = await sendRealSmsOtp(cleanPhone, otp);

    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        message: "We couldn't send the SMS OTP right now. Please try again in a moment.",
      });
    }

    res.json({
      success: true,
      message: `Verification code sent via ${smsResult.provider} SMS to +91 ${cleanPhone}`,
      smsDelivered: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP for user's mobile number
// @route   POST /api/v1/auth/phone/verify-otp
exports.verifyPhoneOtp = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { otp } = req.body;
    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit OTP code' });
    }

    if (!user.phoneOtpHash || !user.phoneOtpExpiresAt) {
      return res.status(400).json({ success: false, message: 'No OTP requested or OTP has expired. Please request a new OTP.' });
    }

    if (new Date() > new Date(user.phoneOtpExpiresAt)) {
      user.phoneOtpHash = null;
      user.phoneOtpExpiresAt = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otp.trim(), user.phoneOtpHash);
    if (!isMatch) {
      user.phoneOtpAttempts = (user.phoneOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP code.`,
      });
    }

    user.phoneVerified = true;
    user.phoneOtpHash = null;
    user.phoneOtpExpiresAt = null;
    user.phoneOtpAttempts = 0;

    await user.save();

    res.json({
      success: true,
      data: {
        phoneVerified: true,
        mobileNumber: user.mobileNumber,
      },
      message: 'Mobile number verified successfully!',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to user's email for verification via Resend
// @route   POST /api/v1/auth/email/send-otp
exports.sendEmailOtp = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const requestedEmail = req.body.email || user.email;
    const cleanEmail = (requestedEmail || '').trim().toLowerCase();

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.email = cleanEmail;
    user.emailOtpHash = otpHash;
    user.emailOtpExpiresAt = expiresAt;
    user.emailOtpAttempts = 0;
    user.emailOtpLastSentAt = new Date();

    await user.save();

    const sendResult = await sendOtpEmail(cleanEmail, otp);

    if (sendResult && sendResult.success === false) {
      return res.status(500).json({
        success: false,
        message: "We couldn't send the OTP right now. Please try again in a moment.",
      });
    }

    res.json({
      success: true,
      message: `Verification OTP sent to email ${cleanEmail}`,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/saved-address
exports.getSavedAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('name mobileNumber savedAddress addresses').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const allAddresses = [];
    if (user.addresses && Array.isArray(user.addresses) && user.addresses.length > 0) {
      user.addresses.forEach((addr, idx) => {
        if (addr && (addr.line1 || addr.street || addr.city)) {
          const l1 = addr.line1 || addr.street || '';
          const l2 = addr.line2 || '';
          allAddresses.push({
            id: addr.id || `addr_book_${idx}`,
            label: addr.label || 'Address Book',
            fullName: user.name || '',
            mobileNumber: addr.phone || user.mobileNumber || '',
            line1: l1,
            line2: l2,
            street: addr.street || (l2 ? `${l1}, ${l2}` : l1),
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            isDefault: !!addr.isDefault,
            source: addr.label ? `${addr.label}` : 'Address Book',
          });
        }
      });
    }

    if (user.savedAddress && (user.savedAddress.line1 || user.savedAddress.street || user.savedAddress.city)) {
      const l1 = user.savedAddress.line1 || user.savedAddress.street || '';
      const l2 = user.savedAddress.line2 || '';
      const existsInList = allAddresses.some(a => a.line1 === l1 && a.city === user.savedAddress.city);
      if (!existsInList) {
        allAddresses.unshift({
          id: 'saved_profile_addr',
          label: 'Default Saved',
          fullName: user.savedAddress.fullName || user.name || '',
          mobileNumber: user.savedAddress.mobileNumber || user.mobileNumber || '',
          line1: l1,
          line2: l2,
          street: user.savedAddress.street || (l2 ? `${l1}, ${l2}` : l1),
          city: user.savedAddress.city || '',
          state: user.savedAddress.state || '',
          pincode: user.savedAddress.pincode || '',
          isDefault: true,
          source: 'Profile Saved Address',
        });
      }
    }

    const pastOrders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('shippingAddress')
      .lean();

    pastOrders.forEach((order, idx) => {
      if (order && order.shippingAddress && (order.shippingAddress.line1 || order.shippingAddress.street || order.shippingAddress.city)) {
        const l1 = order.shippingAddress.line1 || order.shippingAddress.street || '';
        const l2 = order.shippingAddress.line2 || '';
        const existsInList = allAddresses.some(a => a.line1 === l1 && a.city === order.shippingAddress.city);
        if (!existsInList) {
          allAddresses.push({
            id: `past_order_${order._id || idx}`,
            label: `Past Order #${idx + 1}`,
            fullName: order.shippingAddress.name || user.name || '',
            mobileNumber: order.shippingAddress.phone || user.mobileNumber || '',
            line1: l1,
            line2: l2,
            street: order.shippingAddress.street || (l2 ? `${l1}, ${l2}` : l1),
            city: order.shippingAddress.city || '',
            state: order.shippingAddress.state || '',
            pincode: order.shippingAddress.pincode || '',
            isDefault: false,
            source: 'Recent Order',
          });
        }
      }
    });

    if (allAddresses.length > 0) {
      return res.json({ success: true, exists: true, savedAddress: allAddresses[0], addresses: allAddresses });
    }
    return res.json({ success: true, exists: false, savedAddress: null, addresses: [] });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/auth/saved-address
exports.updateSavedAddress = async (req, res, next) => {
  try {
    const { fullName, mobileNumber, line1, line2, street, city, state, pincode } = req.body;
    const l1 = (line1 || street || '').trim();
    const l2 = (line2 || '').trim();

    if (!l1 || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'Address Line 1, city, state, and pincode are required.' });
    }

    const newSavedAddress = {
      fullName: (fullName || '').trim(),
      mobileNumber: (mobileNumber || '').trim(),
      line1: l1,
      line2: l2,
      street: l2 ? `${l1}, ${l2}` : l1,
      city: (city || '').trim(),
      state: (state || '').trim(),
      pincode: (pincode || '').trim(),
      updatedAt: new Date(),
    };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { savedAddress: newSavedAddress } },
      { new: true, runValidators: false }
    ).select('savedAddress').lean();

    return res.json({ success: true, message: 'Saved address updated successfully', savedAddress: user.savedAddress });
  } catch (error) {
    next(error);
  }
};
