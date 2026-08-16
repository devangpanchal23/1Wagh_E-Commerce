const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const USER_PROJECTION = '_id clerkId name email mobileNumber birthdate age gender addresses role';

async function resolveAuthenticatedUser({ clerkUid, userEmail, token }) {
  // 1. Clerk user ID — indexed, authoritative for signed-in sessions
  if (clerkUid) {
    const byClerkId = await User.findOne({ clerkId: clerkUid }).select(USER_PROJECTION).lean();
    if (byClerkId) return byClerkId;
  }

  // 2. Email header — indexed fallback for legacy records
  const emailLower = userEmail ? userEmail.trim().toLowerCase() : '';
  if (emailLower) {
    const byEmail = await User.findOne({ email: emailLower }).select(USER_PROJECTION).lean();
    if (byEmail) return byEmail;
  }

  // 3. JWT claims — last resort when headers are unavailable
  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded) {
        const userId = decoded.id || decoded.sub;
        if (userId) {
          if (mongoose.Types.ObjectId.isValid(userId)) {
            const byId = await User.findById(userId).select(USER_PROJECTION).lean();
            if (byId) return byId;
          }
          const byClerkFromToken = await User.findOne({ clerkId: userId }).select(USER_PROJECTION).lean();
          if (byClerkFromToken) return byClerkFromToken;
        }
        if (decoded.email) {
          const byEmailFromToken = await User.findOne({
            email: decoded.email.trim().toLowerCase(),
          }).select(USER_PROJECTION).lean();
          if (byEmailFromToken) return byEmailFromToken;
        }
      }
    } catch (_) {
      // Ignore malformed tokens and continue to auto-provision / 401
    }
  }

  return null;
}

const protect = async (req, res, next) => {
  const startTime = Date.now();
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  const clerkUid = req.headers['x-user-uid'] || req.headers['x-clerk-user-id'];
  const userEmail = req.headers['x-user-email'];

  try {
    let userFound = await resolveAuthenticatedUser({ clerkUid, userEmail, token });
    const emailLower = userEmail ? userEmail.trim().toLowerCase() : '';

    if (!userFound && (emailLower || clerkUid)) {
      // Auto-provision user in MongoDB linked to Clerk User ID
      const nameHeader = req.headers['x-user-name'];
      const newDoc = await User.create({
        name: nameHeader || (emailLower ? emailLower.split('@')[0] : 'WAGH Customer'),
        email: emailLower || `${clerkUid}@clerk.user`,
        clerkId: clerkUid || '',
        password: 'clerk_auth_user_' + Math.random().toString(36).substring(2),
        role: 'customer',
      });
      userFound = newDoc.toObject();
    } else if (userFound && clerkUid && userFound.clerkId !== clerkUid) {
      userFound.clerkId = clerkUid;
      User.updateOne({ _id: userFound._id }, { clerkId: clerkUid }).catch(() => {});
    }

    if (!userFound) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    const dbTime = Date.now() - startTime;
    res.setHeader('Server-Timing', `db;dur=${dbTime}`);
    res.setHeader('X-Response-Time', `${dbTime}ms`);

    req.user = userFound;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ success: false, message: 'Not authorized' });
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
