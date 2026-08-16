const mongoose = require('mongoose');

const googleDriveConnectionSchema = new mongoose.Schema(
  {
    adminUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    encryptedRefreshToken: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      default: 'https://www.googleapis.com/auth/drive.readonly',
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GoogleDriveConnection', googleDriveConnectionSchema);
