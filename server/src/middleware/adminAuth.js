const jwt = require('jsonwebtoken');

const verifyAdminToken = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    console.warn('[admin-auth] ADMIN_AUTH_ERROR: missing Bearer token');
    return res.status(401).json({
      success: false,
      code: 'ADMIN_AUTH_ERROR',
      message: 'Admin authorization token required',
    });
  }

  try {
    const adminSecret = process.env.ADMIN_JWT_SECRET || 'wagh_admin_dedicated_jwt_secret_key_2026_secure';
    const decoded = jwt.verify(token, adminSecret);

    if (decoded.role !== 'admin' || decoded.type !== 'admin_session') {
      console.warn('[admin-auth] ADMIN_AUTH_ERROR: token claims do not permit image writes');
      return res.status(401).json({
        success: false,
        code: 'ADMIN_AUTH_ERROR',
        message: 'Invalid admin token claims',
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.warn(`[admin-auth] ADMIN_AUTH_ERROR: ${err.name}: ${err.message}`);
    return res.status(401).json({
      success: false,
      code: 'ADMIN_AUTH_ERROR',
      message: 'Invalid or expired admin session token',
    });
  }
};

module.exports = { verifyAdminToken };
