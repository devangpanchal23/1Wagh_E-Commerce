const GoogleDriveConnection = require('../models/GoogleDriveConnection');
const { encryptToken, decryptToken } = require('../utils/encryption');

function getAdminUserId(req) {
  if (!req.admin) return 'admin';
  return req.admin.id || req.admin.userId || req.admin.username || 'admin';
}

// @desc    Connect Google Drive via OAuth authorization code
// @route   POST /api/v1/admin/google-drive/connect
exports.connectGoogleDrive = async (req, res, next) => {
  try {
    const adminUserId = getAdminUserId(req);
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        message: 'Google Client credentials are not configured on server',
      });
    }

    // Exchange auth code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || process.env.GOOGLE_REDIRECT_URI || 'postmessage',
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('Google token exchange error:', tokenData);
      return res.status(400).json({
        success: false,
        message: tokenData.error_description || tokenData.error || 'Failed to exchange authorization code',
      });
    }

    const refreshToken = tokenData.refresh_token;
    const accessToken = tokenData.access_token;

    if (!refreshToken) {
      // Check if connection already exists to retain existing refresh token if Google didn't return a new one
      const existingConn = await GoogleDriveConnection.findOne({ adminUserId });
      if (!existingConn) {
        return res.status(400).json({
          success: false,
          message: 'No refresh token received from Google. Please re-prompt consent.',
        });
      }
    }

    // Fetch user info to store connected email
    let userEmail = 'connected_user@gmail.com';
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userinfoRes.ok) {
        const userinfo = await userinfoRes.json();
        if (userinfo.email) userEmail = userinfo.email;
      }
    } catch (err) {
      console.error('Failed to fetch user email:', err);
    }

    const encryptedRefreshToken = refreshToken
      ? encryptToken(refreshToken)
      : (await GoogleDriveConnection.findOne({ adminUserId }))?.encryptedRefreshToken;

    const connection = await GoogleDriveConnection.findOneAndUpdate(
      { adminUserId },
      {
        adminUserId,
        encryptedRefreshToken,
        email: userEmail,
        scope: tokenData.scope || 'https://www.googleapis.com/auth/drive.readonly',
        isActive: true,
        lastUsedAt: new Date(),
        connectedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      connected: true,
      email: connection.email,
      message: 'Google Drive connected successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Google Drive connection status for logged in admin
// @route   GET /api/v1/admin/google-drive/status
exports.getConnectionStatus = async (req, res, next) => {
  try {
    const adminUserId = getAdminUserId(req);
    const connection = await GoogleDriveConnection.findOne({ adminUserId, isActive: true });

    if (!connection) {
      return res.status(200).json({
        success: true,
        connected: false,
      });
    }

    return res.status(200).json({
      success: true,
      connected: true,
      email: connection.email,
      connectedAt: connection.connectedAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get short-lived access token using stored encrypted refresh token
// @route   GET /api/v1/admin/google-drive/access-token
exports.getAccessToken = async (req, res, next) => {
  try {
    const adminUserId = getAdminUserId(req);
    const connection = await GoogleDriveConnection.findOne({ adminUserId, isActive: true });

    if (!connection || !connection.encryptedRefreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Google Drive not connected. Please connect your account.',
        reauthRequired: true,
      });
    }

    const refreshToken = decryptToken(connection.encryptedRefreshToken);
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('Failed to refresh Google Drive access token:', tokenData);
      
      // Token revoked or invalid -> mark inactive
      if (tokenData.error === 'invalid_grant' || tokenResponse.status === 401) {
        connection.isActive = false;
        await connection.save();
      }

      return res.status(401).json({
        success: false,
        message: 'Google Drive authorization expired or revoked. Please reconnect.',
        reauthRequired: true,
      });
    }

    // Update last used timestamp
    connection.lastUsedAt = new Date();
    await connection.save();

    return res.status(200).json({
      success: true,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Disconnect Google Drive account for logged in admin
// @route   DELETE /api/v1/admin/google-drive/disconnect
exports.disconnectGoogleDrive = async (req, res, next) => {
  try {
    const adminUserId = getAdminUserId(req);
    const connection = await GoogleDriveConnection.findOne({ adminUserId });

    if (connection) {
      if (connection.encryptedRefreshToken) {
        try {
          const refreshToken = decryptToken(connection.encryptedRefreshToken);
          await fetch(`https://oauth2.googleapis.com/revoke?token=${refreshToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });
        } catch (err) {
          console.error('Failed to revoke Google token:', err);
        }
      }

      await GoogleDriveConnection.deleteOne({ adminUserId });
    }

    return res.status(200).json({
      success: true,
      connected: false,
      message: 'Google Drive account disconnected successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Google Drive client configuration (Client ID & API Key) for admin
// @route   GET /api/v1/admin/google-drive/config
exports.getGoogleDriveConfig = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      apiKey: process.env.GOOGLE_API_KEY || '',
    });
  } catch (error) {
    next(error);
  }
};
