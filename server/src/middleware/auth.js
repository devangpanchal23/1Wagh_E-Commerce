const jwt = require('jsonwebtoken');
const User = require('../models/User');

const USER_PROJECTION = '_id name email role mobileNumber birthdate age gender addresses emailVerified isVerified';

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token missing.',
    });
  }

  try {
    const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'wagh_super_secret_jwt_key_2026_premium_accessories';
    const decoded = jwt.verify(token, accessSecret);

    const user = await User.findById(decoded.id).select(USER_PROJECTION).lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token',
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied: Requires ${roles.join(' or ')} role` });
    }
    next();
  };
};

const admin = requireRole('admin');

module.exports = { protect, admin, requireRole };
