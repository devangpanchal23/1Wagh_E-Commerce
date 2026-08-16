const jwt = require('jsonwebtoken');

const verifyAdminToken = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Admin authorization token required',
    });
  }

  try {
    const adminSecret = process.env.ADMIN_JWT_SECRET || 'wagh_admin_dedicated_jwt_secret_key_2026_secure';
    const decoded = jwt.verify(token, adminSecret);

    if (decoded.role !== 'admin' || decoded.type !== 'admin_session') {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token claims',
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin session token',
    });
  }
};

module.exports = { verifyAdminToken };
